import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { storage } from "../../core/storage";
import { insertKeywordRoutingSchema } from "../../../shared/schema";

const router = Router();

/**
 * GET /api/keyword-routing
 * Lista todas as configurações de palavra-chave
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    const keywordRoutings = await storage.getKeywordRoutings();
    
    // Buscar informações das equipes para cada configuração
    const routingsWithTeams = await Promise.all(
      keywordRoutings.map(async (routing) => {
        const team = await storage.getTeam(routing.teamId);
        return {
          ...routing,
          teamName: team?.name || 'Equipe não encontrada',
        };
      })
    );

    res.json(routingsWithTeams);
  } catch (error) {
    console.error("Erro ao listar configurações:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

/**
 * GET /api/keyword-routing/:id
 * Busca configuração específica
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const routing = await storage.getKeywordRouting(id);
    if (!routing) {
      return res.status(404).json({ error: "Configuração não encontrada" });
    }

    // Buscar informações da equipe
    const team = await storage.getTeam(routing.teamId);
    const routingWithTeam = {
      ...routing,
      teamName: team?.name || 'Equipe não encontrada',
    };

    res.json(routingWithTeam);
  } catch (error) {
    console.error("Erro ao buscar configuração:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

/**
 * POST /api/keyword-routing
 * Cria nova configuração
 */
router.post("/", async (req: Request, res: Response) => {
  try {
    const validatedData = insertKeywordRoutingSchema.parse(req.body);
    
    // Verificar se a palavra-chave já existe
    const exists = await storage.keywordExists(validatedData.keyword);
    if (exists) {
      return res.status(400).json({ 
        error: "Palavra-chave já existe no sistema" 
      });
    }

    // Verificar se a equipe existe
    const team = await storage.getTeam(validatedData.teamId);
    if (!team) {
      return res.status(400).json({ 
        error: "Equipe não encontrada" 
      });
    }

    const newRouting = await storage.createKeywordRouting(validatedData);
    
    // Retornar com informações da equipe
    const routingWithTeam = {
      ...newRouting,
      teamName: team.name,
    };

    res.status(201).json(routingWithTeam);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "Dados inválidos", 
        details: error.errors 
      });
    }
    
    console.error("Erro ao criar configuração:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

/**
 * PUT /api/keyword-routing/:id
 * Atualiza configuração existente
 */
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const validatedData = insertKeywordRoutingSchema.partial().parse(req.body);
    
    // Verificar se a configuração existe
    const existing = await storage.getKeywordRouting(id);
    if (!existing) {
      return res.status(404).json({ error: "Configuração não encontrada" });
    }

    // Se alterando palavra-chave, verificar duplicata
    if (validatedData.keyword && validatedData.keyword !== existing.keyword) {
      const exists = await storage.keywordExists(validatedData.keyword, id);
      if (exists) {
        return res.status(400).json({ 
          error: "Palavra-chave já existe no sistema" 
        });
      }
    }

    // Se alterando equipe, verificar se existe
    if (validatedData.teamId) {
      const team = await storage.getTeam(validatedData.teamId);
      if (!team) {
        return res.status(400).json({ 
          error: "Equipe não encontrada" 
        });
      }
    }

    const updatedRouting = await storage.updateKeywordRouting(id, validatedData);
    
    // Buscar informações da equipe
    const team = await storage.getTeam(updatedRouting.teamId);
    const routingWithTeam = {
      ...updatedRouting,
      teamName: team?.name || 'Equipe não encontrada',
    };

    res.json(routingWithTeam);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: "Dados inválidos", 
        details: error.errors 
      });
    }
    
    console.error("Erro ao atualizar configuração:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

/**
 * DELETE /api/keyword-routing/:id
 * Remove configuração
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const existing = await storage.getKeywordRouting(id);
    if (!existing) {
      return res.status(404).json({ error: "Configuração não encontrada" });
    }

    await storage.deleteKeywordRouting(id);
    res.status(204).send();
  } catch (error) {
    console.error("Erro ao deletar configuração:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

/**
 * POST /api/keyword-routing/find-team
 * Busca equipe baseada na mensagem
 */
router.post("/find-team", async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: "Mensagem é obrigatória" });
    }

    const teamId = await storage.findTeamByMessage(message);
    
    if (teamId) {
      const team = await storage.getTeam(teamId);
      res.json({
        found: true,
        teamId,
        teamName: team?.name || 'Equipe não encontrada',
      });
    } else {
      res.json({
        found: false,
        teamId: null,
        teamName: null,
      });
    }
  } catch (error) {
    console.error("Erro ao buscar equipe por mensagem:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

/**
 * POST /api/keyword-routing/:id/toggle
 * Ativa/desativa configuração
 */
router.post("/:id/toggle", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID inválido" });
    }

    const updatedRouting = await storage.toggleKeywordRoutingStatus(id);
    
    // Buscar informações da equipe
    const team = await storage.getTeam(updatedRouting.teamId);
    const routingWithTeam = {
      ...updatedRouting,
      teamName: team?.name || 'Equipe não encontrada',
    };

    res.json(routingWithTeam);
  } catch (error) {
    console.error("Erro ao alternar status:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

export default router;