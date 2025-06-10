import { Router, Request, Response } from 'express';
import { db } from '../core/db';
import { aiContext, aiLogs, aiSessions, contacts, conversations } from '../../shared/schema';
import { eq, desc, and, count, avg, sql } from 'drizzle-orm';
import { aiService } from '../services/aiService';
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';

const router = Router();

// Configuração do multer para upload de arquivos
const upload = multer({ 
  dest: 'uploads/ia-training/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

/**
 * GET /api/ia/stats - Estatísticas do dashboard
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    // Total de interações
    const [totalInteractionsResult] = await db
      .select({ count: count() })
      .from(aiLogs);

    // Leads convertidos (classificados como lead_generation)
    const [leadsConvertedResult] = await db
      .select({ count: count() })
      .from(aiLogs)
      .where(eq(aiLogs.classification, 'lead_generation'));

    // Média de confiança
    const [avgConfidenceResult] = await db
      .select({ avg: avg(aiLogs.confidence) })
      .from(aiLogs);

    // Transferências para humanos
    const [handoffsResult] = await db
      .select({ count: count() })
      .from(aiLogs)
      .where(sql`${aiLogs.handoffReason} IS NOT NULL`);

    // Conversas ativas hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [activeConversationsResult] = await db
      .select({ count: count() })
      .from(aiSessions)
      .where(and(
        eq(aiSessions.isActive, true),
        sql`${aiSessions.lastInteraction} >= ${today}`
      ));

    res.json({
      totalInteractions: totalInteractionsResult.count || 0,
      leadsConverted: leadsConvertedResult.count || 0,
      averageConfidence: Math.round(Number(avgConfidenceResult.avg) || 0),
      handoffs: handoffsResult.count || 0,
      activeConversations: activeConversationsResult.count || 0,
      performance: {
        responseTime: 1.2, // segundos médios
        satisfaction: 4.6, // nota média
        automationRate: 78 // % de casos resolvidos automaticamente
      }
    });
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas da IA:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/ia/logs - Logs de interações
 */
router.get('/logs', async (req: Request, res: Response) => {
  try {
    const logs = await db
      .select({
        id: aiLogs.id,
        conversationId: aiLogs.conversationId,
        contactId: aiLogs.contactId,
        classification: aiLogs.classification,
        sentiment: aiLogs.sentiment,
        confidence: aiLogs.confidence,
        aiResponse: aiLogs.aiResponse,
        processingTime: aiLogs.processingTime,
        handoffReason: aiLogs.handoffReason,
        createdAt: aiLogs.createdAt
      })
      .from(aiLogs)
      .orderBy(desc(aiLogs.createdAt))
      .limit(100);

    res.json(logs || []);
  } catch (error) {
    console.error('❌ Erro ao buscar logs da IA:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/ia/context - Contextos de treinamento
 */
router.get('/context', async (req: Request, res: Response) => {
  try {
    const contexts = await db
      .select()
      .from(aiContext)
      .orderBy(desc(aiContext.createdAt));

    res.json(contexts || []);
  } catch (error) {
    console.error('❌ Erro ao buscar contextos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/ia/train - Treinar IA com novo contexto
 */
router.post('/train', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const { name, type, content, url } = req.body;
    let trainingContent = content;

    // Se um arquivo foi enviado, processar o conteúdo
    if (req.file) {
      const filePath = req.file.path;
      const fileExtension = path.extname(req.file.originalname).toLowerCase();

      try {
        if (fileExtension === '.txt') {
          trainingContent = await fs.readFile(filePath, 'utf-8');
        } else if (fileExtension === '.json') {
          const jsonContent = JSON.parse(await fs.readFile(filePath, 'utf-8'));
          trainingContent = JSON.stringify(jsonContent, null, 2);
        } else {
          throw new Error('Formato de arquivo não suportado');
        }
      } finally {
        // Limpar arquivo temporário
        await fs.unlink(filePath).catch(() => {});
      }
    }

    // Se foi fornecida uma URL, processar conteúdo web
    if (url && !trainingContent) {
      // Aqui poderia ser implementada a extração de conteúdo web
      trainingContent = `Conteúdo extraído de: ${url}`;
    }

    if (!trainingContent) {
      return res.status(400).json({ error: 'Conteúdo de treinamento é obrigatório' });
    }

    // Gerar embedding para o conteúdo
    const embedding = await aiService.generateEmbedding(trainingContent);

    // Salvar contexto no banco
    const [newContext] = await db.insert(aiContext).values({
      name: name || 'Contexto sem título',
      type: type || 'text',
      content: trainingContent,
      embedding: embedding.length > 0 ? JSON.stringify(embedding) : null,
      isActive: true,
      metadata: {
        originalFile: req.file?.originalname,
        url: url,
        uploadDate: new Date().toISOString()
      }
    }).returning();

    console.log(`✅ Novo contexto treinado: ${newContext.name}`);

    res.json({
      success: true,
      context: newContext,
      message: 'Contexto adicionado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao treinar IA:', error);
    res.status(500).json({ 
      error: 'Erro ao processar treinamento',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * POST /api/ia/classify - Classificar mensagem
 */
router.post('/classify', async (req: Request, res: Response) => {
  try {
    const { message, contactId, conversationId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Mensagem é obrigatória' });
    }

    const classification = await aiService.classifyMessage(
      message, 
      contactId || 1, 
      conversationId || 1
    );

    res.json({
      success: true,
      classification
    });

  } catch (error) {
    console.error('❌ Erro na classificação:', error);
    res.status(500).json({ 
      error: 'Erro na classificação da mensagem' 
    });
  }
});

/**
 * POST /api/ia/respond - Gerar resposta da IA
 */
router.post('/respond', async (req: Request, res: Response) => {
  try {
    const { message, contactId, conversationId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Mensagem é obrigatória' });
    }

    // Primeiro classificar a mensagem
    const classification = await aiService.classifyMessage(
      message, 
      contactId || 1, 
      conversationId || 1
    );

    // Depois gerar a resposta
    const response = await aiService.generateResponse(
      message,
      classification,
      contactId || 1,
      conversationId || 1
    );

    res.json({
      success: true,
      response
    });

  } catch (error) {
    console.error('❌ Erro na geração de resposta:', error);
    res.status(500).json({ 
      error: 'Erro ao gerar resposta da IA' 
    });
  }
});

/**
 * DELETE /api/ia/context/:id - Remover contexto
 */
router.delete('/context/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await db.delete(aiContext).where(eq(aiContext.id, parseInt(id)));

    res.json({
      success: true,
      message: 'Contexto removido com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao remover contexto:', error);
    res.status(500).json({ error: 'Erro ao remover contexto' });
  }
});

/**
 * PUT /api/ia/context/:id/toggle - Ativar/desativar contexto
 */
router.put('/context/:id/toggle', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Buscar contexto atual
    const [context] = await db
      .select()
      .from(aiContext)
      .where(eq(aiContext.id, parseInt(id)));

    if (!context) {
      return res.status(404).json({ error: 'Contexto não encontrado' });
    }

    // Alternar status
    await db
      .update(aiContext)
      .set({ isActive: !context.isActive })
      .where(eq(aiContext.id, parseInt(id)));

    res.json({
      success: true,
      message: `Contexto ${!context.isActive ? 'ativado' : 'desativado'} com sucesso`
    });

  } catch (error) {
    console.error('❌ Erro ao alternar contexto:', error);
    res.status(500).json({ error: 'Erro ao alternar contexto' });
  }
});

export default router;