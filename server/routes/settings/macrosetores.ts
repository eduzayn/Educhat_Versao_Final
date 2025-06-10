import { Router } from 'express';
import { z } from 'zod';
import { insertMacrosetorDetectionSchema, insertMacrosetorKeywordSchema } from '../../../shared/schema';
import type { DatabaseStorage } from '../../storage';

const router = Router();

/**
 * Rotas para gerenciamento de macrosetores
 */
export function registerMacrosetorRoutes(app: any, storage: DatabaseStorage) {
  
  // GET /api/settings/macrosetores - Listar todos os macrosetores com suas palavras-chave
  app.get('/api/settings/macrosetores', async (req: any, res: any) => {
    try {
      const macrosetores = await storage.getMacrosetores();
      res.json(macrosetores);
    } catch (error) {
      console.error('Erro ao buscar macrosetores:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // GET /api/settings/macrosetores/:id - Buscar macrosetor específico
  app.get('/api/settings/macrosetores/:id', async (req: any, res: any) => {
    try {
      const id = parseInt(req.params.id);
      const macrosetor = await storage.macrosetor.getMacrosetor(id);
      
      if (!macrosetor) {
        return res.status(404).json({ error: 'Macrosetor não encontrado' });
      }
      
      res.json(macrosetor);
    } catch (error) {
      console.error('Erro ao buscar macrosetor:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // POST /api/settings/macrosetores - Criar novo macrosetor
  app.post('/api/settings/macrosetores', async (req: any, res: any) => {
    try {
      const data = insertMacrosetorDetectionSchema.parse(req.body);
      const macrosetor = await storage.macrosetor.createMacrosetor(data);
      res.status(201).json(macrosetor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      }
      console.error('Erro ao criar macrosetor:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // PUT /api/settings/macrosetores/:id - Atualizar macrosetor
  app.put('/api/settings/macrosetores/:id', async (req: any, res: any) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertMacrosetorDetectionSchema.partial().parse(req.body);
      const macrosetor = await storage.macrosetor.updateMacrosetor(id, data);
      res.json(macrosetor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      }
      console.error('Erro ao atualizar macrosetor:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // DELETE /api/settings/macrosetores/:id - Deletar macrosetor
  app.delete('/api/settings/macrosetores/:id', async (req: any, res: any) => {
    try {
      const id = parseInt(req.params.id);
      await storage.macrosetor.deleteMacrosetor(id);
      res.status(204).send();
    } catch (error) {
      console.error('Erro ao deletar macrosetor:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // GET /api/settings/macrosetores/:id/keywords - Listar palavras-chave de um macrosetor
  app.get('/api/settings/macrosetores/:id/keywords', async (req: any, res: any) => {
    try {
      const macrosetorId = parseInt(req.params.id);
      const keywords = await storage.macrosetor.getKeywords(macrosetorId);
      res.json(keywords);
    } catch (error) {
      console.error('Erro ao buscar palavras-chave:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // POST /api/settings/macrosetores/:id/keywords - Adicionar palavra-chave a um macrosetor
  app.post('/api/settings/macrosetores/:id/keywords', async (req: any, res: any) => {
    try {
      const macrosetorId = parseInt(req.params.id);
      const data = insertMacrosetorKeywordSchema.parse({
        ...req.body,
        macrosetorId
      });
      const keyword = await storage.macrosetor.createKeyword(data);
      res.status(201).json(keyword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      }
      console.error('Erro ao criar palavra-chave:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // PUT /api/settings/keywords/:id - Atualizar palavra-chave
  app.put('/api/settings/keywords/:id', async (req: any, res: any) => {
    try {
      const id = parseInt(req.params.id);
      const data = insertMacrosetorKeywordSchema.partial().parse(req.body);
      const keyword = await storage.macrosetor.updateKeyword(id, data);
      res.json(keyword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      }
      console.error('Erro ao atualizar palavra-chave:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // DELETE /api/settings/keywords/:id - Deletar palavra-chave
  app.delete('/api/settings/keywords/:id', async (req: any, res: any) => {
    try {
      const id = parseInt(req.params.id);
      await storage.macrosetor.deleteKeyword(id);
      res.status(204).send();
    } catch (error) {
      console.error('Erro ao deletar palavra-chave:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // POST /api/settings/macrosetores/test-detection - Testar detecção de macrosetor
  app.post('/api/settings/macrosetores/test-detection', async (req: any, res: any) => {
    try {
      const { content, channel } = req.body;
      
      if (!content) {
        return res.status(400).json({ error: 'Conteúdo é obrigatório' });
      }

      const result = await storage.macrosetor.detectMacrosetorAdvanced(content, channel);
      res.json(result);
    } catch (error) {
      console.error('Erro ao testar detecção:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // GET /api/settings/macrosetores/detection-logs - Buscar logs de detecção
  app.get('/api/settings/macrosetores/detection-logs', async (req: any, res: any) => {
    try {
      const { limit = 50, offset = 0, macrosetor } = req.query;
      
      let logs;
      if (macrosetor) {
        logs = await storage.macrosetor.getDetectionLogsByMacrosetor(
          macrosetor as string, 
          parseInt(limit as string)
        );
      } else {
        logs = await storage.macrosetor.getDetectionLogs(
          parseInt(limit as string), 
          parseInt(offset as string)
        );
      }
      
      res.json(logs);
    } catch (error) {
      console.error('Erro ao buscar logs de detecção:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // POST /api/settings/macrosetores/initialize - Inicializar macrosetores padrão
  app.post('/api/settings/macrosetores/initialize', async (req: any, res: any) => {
    try {
      await storage.macrosetor.initializeDefaultMacrosetores();
      res.json({ message: 'Macrosetores padrão inicializados com sucesso' });
    } catch (error) {
      console.error('Erro ao inicializar macrosetores:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
}

export default router;