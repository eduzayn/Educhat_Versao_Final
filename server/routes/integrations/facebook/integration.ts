import { Request, Response, Router } from 'express';
import { z } from 'zod';
import { storage } from '../../../storage';
import { facebookIntegrationSchema } from './types';

const router = Router();

// Listar integrações
router.get('/', async (req: Request, res: Response) => {
  try {
    const integrations = await storage.facebook.getIntegrations();
    res.json(integrations);
  } catch (error) {
    console.error('❌ Erro ao buscar integrações Facebook:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar integração específica
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const integration = await storage.facebook.getIntegration(id);
    if (!integration) {
      return res.status(404).json({ error: 'Integração não encontrada' });
    }

    res.json(integration);
  } catch (error) {
    console.error('❌ Erro ao buscar integração Facebook:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar nova integração
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = facebookIntegrationSchema.parse(req.body);
    
    const integration = await storage.facebook.createIntegration(validatedData);
    res.status(201).json(integration);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors
      });
    }
    
    console.error('❌ Erro ao criar integração Facebook:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar integração
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const validatedData = facebookIntegrationSchema.partial().parse(req.body);
    
    const integration = await storage.facebook.updateIntegration(id, validatedData);
    res.json(integration);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors
      });
    }
    
    console.error('❌ Erro ao atualizar integração Facebook:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Remover integração
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    await storage.facebook.deleteIntegration(id);
    res.status(204).send();
  } catch (error) {
    console.error('❌ Erro ao remover integração Facebook:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Ativar/desativar integração
router.put('/:id/status', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { isActive } = req.body;
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'ID inválido' });
    }
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'Status deve ser um boolean' });
    }

    await storage.facebook.updateIntegrationStatus(id, isActive);
    res.json({ success: true, message: `Integração ${isActive ? 'ativada' : 'desativada'} com sucesso` });
  } catch (error) {
    console.error('❌ Erro ao atualizar status da integração Facebook:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router; 