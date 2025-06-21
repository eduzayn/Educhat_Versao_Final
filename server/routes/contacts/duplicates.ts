import { Router } from "express";
import { z } from "zod";
import { storage } from "../../storage";

const router = Router();

// Sistema de debounce para evitar múltiplas chamadas simultâneas
const pendingRequests = new Map<string, Promise<any>>();
const DEBOUNCE_TIME = 500; // 500ms para agrupar requisições idênticas

// Schema para validação
const checkDuplicatesSchema = z.object({
  phone: z.string().nullish(),
  excludeContactId: z.number().optional()
});

/**
 * POST /api/contacts/check-duplicates
 * Verifica se um número de telefone já existe em outros canais
 * OTIMIZADO: Timeout robusto e tratamento de erro para evitar 502
 */
router.post("/check-duplicates", async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { phone, excludeContactId } = checkDuplicatesSchema.parse(req.body);
    
    // Se não há telefone válido, retornar sem duplicação
    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      return res.json({
        isDuplicate: false,
        duplicates: [],
        totalDuplicates: 0,
        channels: []
      });
    }
    
    // Chave única para debounce baseada nos parâmetros
    const requestKey = `${phone}_${excludeContactId || 'none'}`;
    
    // Verificar se já existe uma requisição pendente para os mesmos parâmetros
    if (pendingRequests.has(requestKey)) {
      console.log(`⏰ Reutilizando verificação de duplicatas em andamento para ${phone}`);
      const result = await pendingRequests.get(requestKey);
      return res.json(result);
    }
    
    // Timeout de segurança para evitar 502 Bad Gateway
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Timeout na verificação de duplicatas'));
      }, 6000); // Reduzido para 6 segundos máximo
    });
    
    // Usar módulo direto para evitar overhead do wrapper
    const { ContactDuplicateDetection } = await import('../../storage/modules/contactDuplicateDetection');
    const { db } = await import('../../db');
    const duplicateDetector = new ContactDuplicateDetection(db);
    
    // Criar e armazenar a promise da verificação
    const verificationPromise = Promise.race([
      duplicateDetector.checkPhoneDuplicates(phone, excludeContactId),
      timeoutPromise
    ]).finally(() => {
      // Remover da lista de pendentes após conclusão
      setTimeout(() => {
        pendingRequests.delete(requestKey);
      }, DEBOUNCE_TIME);
    });
    
    pendingRequests.set(requestKey, verificationPromise);
    
    // Executar verificação
    const result = await verificationPromise;
    
    const duration = Date.now() - startTime;
    console.log(`✅ Check duplicates concluído em ${duration}ms`);
    
    // Headers para evitar cache em caso de erro
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    res.json(result);
    
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`❌ Erro ao verificar duplicatas (${duration}ms):`, error);
    
    // Retornar resposta de fallback em caso de erro para evitar 502
    if (!res.headersSent) {
      res.status(200).json({ 
        isDuplicate: false,
        duplicates: [],
        totalDuplicates: 0,
        channels: [],
        error: "Verificação temporariamente indisponível",
        fallback: true
      });
    }
  }
});

/**
 * GET /api/contacts/duplicates
 * Lista todos os contatos duplicados no sistema
 */
router.get("/duplicates", async (req, res) => {
  try {
    const duplicateDetector = new (await import('../../storage/modules/contactDuplicateDetection')).ContactDuplicateDetection((await import('../../db')).db);
    const duplicates = await duplicateDetector.findAllDuplicateContacts();
    
    res.json(duplicates);
  } catch (error: any) {
    console.error("Erro ao buscar duplicatas:", error);
    res.status(500).json({ 
      error: "Erro ao buscar duplicatas", 
      details: error.message 
    });
  }
});

export default router;