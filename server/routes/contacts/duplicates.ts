import { Router } from "express";
import { z } from "zod";
import { storage } from "../../storage";

const router = Router();

// Cache de resultados com TTL
const resultCache = new Map<string, { result: any; timestamp: number; ttl: number }>();
const pendingRequests = new Map<string, Promise<any>>();
const requestCounts = new Map<string, number>();

const CACHE_TTL = 30000; // 30 segundos de cache
const DEBOUNCE_TIME = 200; // Reduzido para 200ms
const MAX_REQUESTS_PER_MINUTE = 10; // Limite por telefone
const CLEANUP_INTERVAL = 60000; // Limpeza a cada minuto

// Limpeza periódica do cache e contadores
setInterval(() => {
  const now = Date.now();
  
  // Limpar cache expirado
  for (const [key, cached] of resultCache.entries()) {
    if (now - cached.timestamp > cached.ttl) {
      resultCache.delete(key);
    }
  }
  
  // Resetar contadores de requisições
  requestCounts.clear();
}, CLEANUP_INTERVAL);

// Schema para validação
const checkDuplicatesSchema = z.object({
  phone: z.string().nullish(),
  excludeContactId: z.number().optional()
});

/**
 * POST /api/contacts/check-duplicates
 * Verifica se um número de telefone já existe em outros canais
 * OTIMIZADO: Cache inteligente, throttling e debounce para performance
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
    
    // Normalizar telefone para cache (remover caracteres especiais)
    const normalizedPhone = phone.replace(/\D/g, '');
    const requestKey = `${normalizedPhone}_${excludeContactId || 'none'}`;
    
    // Throttling: Verificar limite de requisições por telefone
    const phoneKey = normalizedPhone;
    const currentCount = requestCounts.get(phoneKey) || 0;
    
    if (currentCount >= MAX_REQUESTS_PER_MINUTE) {
      return res.json({
        isDuplicate: false,
        duplicates: [],
        totalDuplicates: 0,
        channels: [],
        throttled: true,
        message: "Muitas verificações para este número. Tente novamente em alguns segundos."
      });
    }
    
    requestCounts.set(phoneKey, currentCount + 1);
    
    // Verificar cache primeiro
    const cached = resultCache.get(requestKey);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      const duration = Date.now() - startTime;
      console.log(`⚡ Cache hit para duplicatas em ${duration}ms`);
      return res.json({ ...cached.result, cached: true });
    }
    
    // Verificar se já existe uma requisição pendente
    if (pendingRequests.has(requestKey)) {
      const result = await pendingRequests.get(requestKey);
      return res.json({ ...result, deduped: true });
    }
    
    // Timeout mais agressivo para melhor UX
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Timeout na verificação de duplicatas'));
      }, 3000); // Reduzido para 3 segundos
    });
    
    // Executar verificação com cache
    const verificationPromise = (async () => {
      try {
        const { ContactDuplicateDetection } = await import('../../storage/modules/contactDuplicateDetection');
        const { db } = await import('../../db');
        const duplicateDetector = new ContactDuplicateDetection(db);
        
        const result = await Promise.race([
          duplicateDetector.checkPhoneDuplicates(phone, excludeContactId),
          timeoutPromise
        ]);
        
        // Armazenar no cache com TTL dinâmico
        const cacheTtl = result.isDuplicate ? CACHE_TTL * 2 : CACHE_TTL; // Cache duplicatas por mais tempo
        resultCache.set(requestKey, {
          result,
          timestamp: Date.now(),
          ttl: cacheTtl
        });
        
        return result;
      } finally {
        // Limpar requisição pendente com delay mínimo
        setTimeout(() => {
          pendingRequests.delete(requestKey);
        }, DEBOUNCE_TIME);
      }
    })();
    
    pendingRequests.set(requestKey, verificationPromise);
    
    const result = await verificationPromise;
    const duration = Date.now() - startTime;
    
    // Log otimizado - apenas para requests lentos
    if (duration > 500) {
      console.log(`✅ Check duplicates concluído em ${duration}ms`);
    }
    
    // Headers otimizados para cache do navegador
    res.set({
      'Cache-Control': 'private, max-age=30',
      'ETag': `"${requestKey}-${Date.now()}"`,
      'Last-Modified': new Date().toUTCString()
    });
    
    res.json(result);
    
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    // Log apenas erros críticos
    if (error.message !== 'Timeout na verificação de duplicatas') {
      console.error(`❌ Erro ao verificar duplicatas (${duration}ms):`, error);
    }
    
    if (!res.headersSent) {
      res.status(200).json({ 
        isDuplicate: false,
        duplicates: [],
        totalDuplicates: 0,
        channels: [],
        error: error.message.includes('Timeout') ? 'Verificação em andamento' : 'Verificação temporariamente indisponível',
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