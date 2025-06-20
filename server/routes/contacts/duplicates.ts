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
  
  // Timeout de segurança para evitar 502 Bad Gateway
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error('Timeout na verificação de duplicatas'));
    }, 8000); // 8 segundos máximo
  });
  
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
    
    // Executar verificação com timeout
    const result = await Promise.race([
      storage.contacts.checkPhoneDuplicates(phone, excludeContactId),
      timeoutPromise
    ]);
    
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
    const duplicates = await storage.contacts.findAllDuplicateContacts();
    
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