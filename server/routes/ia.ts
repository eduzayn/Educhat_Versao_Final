import { Express, Request, Response } from 'express';
import { z } from 'zod';
import { db } from '../core/db';
import { aiContext, aiLogs, aiSessions, insertAiContextSchema, insertAiLogSchema, insertAiSessionSchema } from '../../shared/schema';
import { eq, desc, and, gte } from 'drizzle-orm';
import { aiService } from '../services/aiService';

export function registerIARoutes(app: Express) {
  
  // Get AI context items
  app.get('/api/ia/context', async (req: Request, res: Response) => {
    try {
      const contexts = await db.select().from(aiContext).where(eq(aiContext.isActive, true)).orderBy(desc(aiContext.createdAt));
      res.json(contexts);
    } catch (error) {
      console.error('❌ Erro ao buscar contextos de IA:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Add AI context
  app.post('/api/ia/context', async (req: Request, res: Response) => {
    try {
      const contextData = insertAiContextSchema.parse(req.body);
      
      const [newContext] = await db.insert(aiContext).values({
        ...contextData,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      console.log('✅ Novo contexto de IA criado:', newContext.id);
      res.status(201).json(newContext);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      }
      console.error('❌ Erro ao criar contexto de IA:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Update AI context
  app.put('/api/ia/context/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const contextData = insertAiContextSchema.partial().parse(req.body);
      
      const [updatedContext] = await db.update(aiContext)
        .set({ ...contextData, updatedAt: new Date() })
        .where(eq(aiContext.id, id))
        .returning();

      if (!updatedContext) {
        return res.status(404).json({ error: 'Contexto não encontrado' });
      }

      console.log('✅ Contexto de IA atualizado:', id);
      res.json(updatedContext);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      }
      console.error('❌ Erro ao atualizar contexto de IA:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Delete AI context
  app.delete('/api/ia/context/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      await db.update(aiContext)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(aiContext.id, id));

      console.log('✅ Contexto de IA removido:', id);
      res.json({ success: true });
    } catch (error) {
      console.error('❌ Erro ao remover contexto de IA:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Get AI logs with pagination
  app.get('/api/ia/logs', async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      const logs = await db.select().from(aiLogs)
        .orderBy(desc(aiLogs.createdAt))
        .limit(limit)
        .offset(offset);

      res.json(logs);
    } catch (error) {
      console.error('❌ Erro ao buscar logs de IA:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Create AI log
  app.post('/api/ia/logs', async (req: Request, res: Response) => {
    try {
      const logData = insertAiLogSchema.parse(req.body);
      
      const [newLog] = await db.insert(aiLogs).values({
        ...logData,
        createdAt: new Date()
      }).returning();

      console.log('📊 Log de IA criado:', newLog.id);
      res.status(201).json(newLog);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      }
      console.error('❌ Erro ao criar log de IA:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Get AI session
  app.get('/api/ia/sessions/:conversationId', async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.conversationId);
      
      const [session] = await db.select().from(aiSessions)
        .where(and(
          eq(aiSessions.conversationId, conversationId),
          eq(aiSessions.isActive, true)
        ))
        .orderBy(desc(aiSessions.lastInteraction))
        .limit(1);

      res.json(session || null);
    } catch (error) {
      console.error('❌ Erro ao buscar sessão de IA:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Create or update AI session
  app.post('/api/ia/sessions', async (req: Request, res: Response) => {
    try {
      const sessionData = insertAiSessionSchema.parse(req.body);
      
      // Check if session already exists
      const [existingSession] = await db.select().from(aiSessions)
        .where(and(
          eq(aiSessions.conversationId, sessionData.conversationId!),
          eq(aiSessions.isActive, true)
        ))
        .limit(1);

      let session;
      if (existingSession) {
        // Update existing session
        [session] = await db.update(aiSessions)
          .set({
            sessionData: sessionData.sessionData,
            lastInteraction: new Date(),
            expiresAt: sessionData.expiresAt
          })
          .where(eq(aiSessions.id, existingSession.id))
          .returning();
      } else {
        // Create new session
        [session] = await db.insert(aiSessions).values({
          ...sessionData,
          lastInteraction: new Date(),
          createdAt: new Date()
        }).returning();
      }

      console.log('🧠 Sessão de IA atualizada:', session.id);
      res.json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      }
      console.error('❌ Erro ao gerenciar sessão de IA:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // End AI session
  app.delete('/api/ia/sessions/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      await db.update(aiSessions)
        .set({ isActive: false })
        .where(eq(aiSessions.id, id));

      console.log('✅ Sessão de IA encerrada:', id);
      res.json({ success: true });
    } catch (error) {
      console.error('❌ Erro ao encerrar sessão de IA:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Get AI statistics
  app.get('/api/ia/stats', async (req: Request, res: Response) => {
    try {
      // Get total interactions from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const totalLogs = await db.select().from(aiLogs)
        .where(gte(aiLogs.createdAt, thirtyDaysAgo));

      const totalInteractions = totalLogs.length;
      const leadsConverted = totalLogs.filter((log: any) => log.classification === 'lead' && log.handoffReason === null).length;
      const avgProcessingTime = totalLogs.length > 0 
        ? Math.round(totalLogs.reduce((sum: number, log: any) => sum + (log.processingTime || 0), 0) / totalLogs.length)
        : 0;

      // Calculate satisfaction based on sentiment analysis
      const satisfactionLogs = totalLogs.filter((log: any) => log.sentiment);
      const positiveCount = satisfactionLogs.filter((log: any) => log.sentiment === 'positive').length;
      const satisfactionRate = satisfactionLogs.length > 0 
        ? Math.round((positiveCount / satisfactionLogs.length) * 100)
        : 0;

      const stats = {
        totalInteractions,
        leadsConverted,
        avgResponseTime: avgProcessingTime / 1000, // Convert to seconds
        satisfactionRate,
        period: '30 dias'
      };

      res.json(stats);
    } catch (error) {
      console.error('❌ Erro ao calcular estatísticas de IA:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Classify message intent with OpenAI integration
  app.post('/api/ia/classify', async (req: Request, res: Response) => {
    try {
      const { message, contactId, conversationId, contactHistory } = req.body;

      if (!message || !contactId || !conversationId) {
        return res.status(400).json({ error: 'Dados obrigatórios: message, contactId, conversationId' });
      }

      const { aiService } = await import('../services/aiService');
      
      const classification = await aiService.classifyMessage(
        message, 
        contactId, 
        conversationId, 
        contactHistory
      );

      console.log('🤖 Mensagem classificada pela IA:', {
        intent: classification.intent,
        sentiment: classification.sentiment,
        confidence: classification.confidence,
        aiMode: classification.aiMode
      });

      res.json(classification);
    } catch (error) {
      console.error('❌ Erro na classificação de IA:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Generate intelligent response from Prof. Ana
  app.post('/api/ia/generate', async (req: Request, res: Response) => {
    try {
      const { message, contactId, conversationId, contactHistory } = req.body;

      if (!message || !contactId || !conversationId) {
        return res.status(400).json({ error: 'Dados obrigatórios: message, contactId, conversationId' });
      }

      const { aiService } = await import('../services/aiService');
      
      // Primeiro classifica a mensagem
      const classification = await aiService.classifyMessage(
        message, 
        contactId, 
        conversationId, 
        contactHistory
      );

      // Depois gera resposta inteligente
      const aiResponse = await aiService.generateResponse(
        message,
        classification,
        contactId,
        conversationId
      );

      console.log('🤖 Prof. Ana gerou resposta:', {
        mode: classification.aiMode,
        shouldHandoff: aiResponse.shouldHandoff,
        processingTime: aiResponse.processingTime
      });

      res.json(aiResponse);
    } catch (error) {
      console.error('❌ Erro na geração de resposta da IA:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Train AI with new content
  app.post('/api/ia/train', async (req: Request, res: Response) => {
    try {
      const { name, type, content, metadata } = req.body;

      if (!name || !type || !content) {
        return res.status(400).json({ error: 'Dados obrigatórios: name, type, content' });
      }

      // Gerar embeddings reais usando OpenAI
      const { aiService } = await import('../services/aiService');
      const embeddingVector = await aiService.generateEmbedding(content);
      const embedding = JSON.stringify(embeddingVector);

      const [newContext] = await db.insert(aiContext).values({
        name,
        type,
        content,
        embedding,
        metadata: metadata || {},
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      console.log('🎓 IA treinada com novo conteúdo:', newContext.id);
      res.status(201).json(newContext);
    } catch (error) {
      console.error('❌ Erro no treinamento da IA:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Control auto-response status
  app.post('/api/ia/auto-response', async (req: Request, res: Response) => {
    try {
      const { enabled } = req.body;
      aiService.setAutoResponse(enabled);
      res.json({ 
        enabled: aiService.isAutoResponseActive(),
        message: enabled ? 'Auto-resposta ativada' : 'Auto-resposta desativada'
      });
    } catch (error) {
      console.error('❌ Erro ao alterar auto-resposta:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Get auto-response status
  app.get('/api/ia/auto-response/status', async (req: Request, res: Response) => {
    try {
      res.json({ 
        enabled: aiService.isAutoResponseActive(),
        message: aiService.isAutoResponseActive() ? 'Auto-resposta ativa' : 'Auto-resposta desativada'
      });
    } catch (error) {
      console.error('❌ Erro ao verificar status auto-resposta:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Save AI settings
  app.post('/api/ia/settings', async (req: Request, res: Response) => {
    try {
      const settingsSchema = z.object({
        aiActive: z.boolean(),
        learningMode: z.boolean(), 
        autoHandoff: z.boolean(),
        operationMode: z.string(),
        confidenceThreshold: z.number().min(0).max(100)
      });
      
      const settings = settingsSchema.parse(req.body);
      
      // Store settings (for now, just log them - in production you'd save to database)
      console.log('⚙️ Configurações da Prof. Ana atualizadas:', settings);
      
      res.json({ 
        success: true, 
        message: 'Configurações salvas com sucesso',
        settings 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      }
      console.error('❌ Erro ao salvar configurações da IA:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Get personalidades disponíveis (Faces Inteligentes)
  app.get('/api/ia/personalities', async (req: Request, res: Response) => {
    try {
      const personalities = aiService.getAvailablePersonalities();
      const currentPersonality = aiService.getCurrentPersonality();
      
      res.json({
        personalities,
        current: currentPersonality,
        systemInfo: {
          name: "Sistema de Faces Inteligentes",
          description: "A Prof. Ana adapta automaticamente sua personalidade baseada no contexto da conversa",
          version: "1.0"
        }
      });
    } catch (error) {
      console.error('❌ Erro ao buscar personalidades:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Get personalidade atual
  app.get('/api/ia/current-personality', async (req: Request, res: Response) => {
    try {
      const currentPersonality = aiService.getCurrentPersonality();
      
      res.json({
        personality: currentPersonality,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Erro ao buscar personalidade atual:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
}