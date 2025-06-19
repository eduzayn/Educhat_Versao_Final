import { Router } from "express";
import { z } from "zod";
import { storage } from "../../storage";

const router = Router();

// Schema para validação
const checkDuplicatesSchema = z.object({
  phone: z.union([z.string(), z.null(), z.undefined()]).optional(),
  excludeContactId: z.number().optional()
});

/**
 * POST /api/contacts/check-duplicates
 * Verifica se um número de telefone já existe em outros canais
 */
router.post("/check-duplicates", async (req, res) => {
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
    
    const result = await storage.contacts.checkPhoneDuplicates(phone, excludeContactId);
    
    res.json(result);
  } catch (error: any) {
    console.error("Erro ao verificar duplicatas:", error);
    res.status(400).json({ 
      error: "Erro ao verificar duplicatas", 
      details: error.message 
    });
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