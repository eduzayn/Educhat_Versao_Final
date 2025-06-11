import { Router, Request, Response } from 'express';
import { db } from '../../core/db';
import { aiContext, aiLogs, aiSessions, contacts, conversations } from '../../../shared/schema';
import { eq, desc, and, count, avg, sql, gt, isNotNull } from 'drizzle-orm';
import { aiService } from '../../services/aiService';
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
    // Estatísticas básicas baseadas nos dados reais disponíveis
    const [totalInteractionsResult] = await db
      .select({ count: count() })
      .from(aiLogs);

    // Leads convertidos baseado em classificação
    const [leadsConvertedResult] = await db
      .select({ count: count() })
      .from(aiLogs)
      .where(eq(aiLogs.classification, 'course_inquiry'));

    // Tempo médio de resposta
    const [avgResponseTimeResult] = await db
      .select({ avg: avg(aiLogs.processingTime) })
      .from(aiLogs);

    // Total de conversas com IA
    const [totalConversationsResult] = await db
      .select({ count: sql`COUNT(DISTINCT ${aiLogs.conversationId})` })
      .from(aiLogs);

    // Estatísticas simplificadas
    const totalInteractions = Number(totalInteractionsResult?.count) || 0;
    const leadsConverted = Number(leadsConvertedResult?.count) || 0;
    const avgResponseTime = Number(avgResponseTimeResult?.avg) || 0;
    const studentsHelped = Number(totalConversationsResult?.count) || 0;
    
    // Taxa de sucesso baseada em dados disponíveis
    const successRate = totalInteractions > 0 ? Math.round((leadsConverted / totalInteractions) * 100) : 0;

    // Top 5 intenções mais comuns
    const topIntents = await db
      .select({
        intent: aiLogs.classification,
        count: count()
      })
      .from(aiLogs)
      .where(sql`${aiLogs.classification} IS NOT NULL`)
      .groupBy(aiLogs.classification)
      .orderBy(desc(count()))
      .limit(5);

    res.json({
      totalInteractions,
      leadsConverted,
      avgResponseTime: Math.round(avgResponseTime),
      successRate,
      studentsHelped,
      topIntents: topIntents.map(item => ({
        intent: item.intent || 'unknown',
        count: Number(item.count)
      }))
    });
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas da IA:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

/**
 * GET /api/ia/logs - Logs de interações da IA
 */
router.get('/logs', async (req: Request, res: Response) => {
  try {
    const logs = await db
      .select({
        id: aiLogs.id,
        message: aiLogs.messageId,
        response: aiLogs.aiResponse,
        classification: aiLogs.classification,
        processingTime: aiLogs.processingTime,
        createdAt: aiLogs.createdAt
      })
      .from(aiLogs)
      .orderBy(desc(aiLogs.createdAt))
      .limit(50);

    res.json(logs);
  } catch (error) {
    console.error('❌ Erro ao buscar logs da IA:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

/**
 * DELETE /api/ia/logs - Limpar logs da IA
 */
router.delete('/logs', async (req: Request, res: Response) => {
  try {
    await db.delete(aiLogs);
    res.json({ success: true, message: 'Logs limpos com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao limpar logs da IA:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/ia/test - Testar a IA
 */
router.post('/test', async (req: Request, res: Response) => {
  try {
    const { message } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Mensagem é obrigatória' });
    }

    console.log('🧪 Testando IA com mensagem:', message);
    
    const response = await aiService.processMessage(message, 'test-contact', 0);
    
    res.json({
      message: response.message,
      classification: response.classification
    });
  } catch (error) {
    console.error('❌ Erro no teste da IA:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Erro interno do servidor' 
    });
  }
});

/**
 * GET /api/ia/contexts - Listar contextos de treinamento
 */
router.get('/contexts', async (req: Request, res: Response) => {
  try {
    const contexts = await db
      .select()
      .from(aiContext)
      .orderBy(desc(aiContext.createdAt));

    res.json(contexts);
  } catch (error) {
    console.error('❌ Erro ao buscar contextos:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/ia/contexts - Adicionar contexto de treinamento
 */
router.post('/contexts', async (req: Request, res: Response) => {
  try {
    const { title, content, category } = req.body;
    
    if (!title || !content || !category) {
      return res.status(400).json({ 
        error: 'Título, conteúdo e categoria são obrigatórios' 
      });
    }

    const [context] = await db
      .insert(aiContext)
      .values({
        title,
        content,
        category,
        isActive: true
      })
      .returning();

    console.log('✅ Contexto adicionado:', { title, category });
    
    res.json(context);
  } catch (error) {
    console.error('❌ Erro ao adicionar contexto:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

/**
 * DELETE /api/ia/contexts/:id - Remover contexto
 */
router.delete('/contexts/:id', async (req: Request, res: Response) => {
  try {
    const contextId = parseInt(req.params.id);
    
    if (isNaN(contextId)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    await db
      .delete(aiContext)
      .where(eq(aiContext.id, contextId));

    res.json({ success: true, message: 'Contexto removido com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao remover contexto:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

/**
 * POST /api/ia/upload-training - Upload de arquivo de treinamento
 */
router.post('/upload-training', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Arquivo é obrigatório' });
    }

    const filePath = req.file.path;
    const fileContent = await fs.readFile(filePath, 'utf-8');
    
    // Processar o conteúdo do arquivo e adicionar como contextos
    const lines = fileContent.split('\n').filter(line => line.trim());
    const contextsAdded = [];
    
    for (const line of lines) {
      if (line.includes(':')) {
        const [title, content] = line.split(':').map(s => s.trim());
        if (title && content) {
          const [context] = await db
            .insert(aiContext)
            .values({
              title,
              content,
              category: 'upload',
              isActive: true
            })
            .returning();
          
          contextsAdded.push(context);
        }
      }
    }
    
    // Limpar arquivo temporário
    await fs.unlink(filePath);
    
    res.json({
      success: true,
      message: `${contextsAdded.length} contextos adicionados com sucesso`,
      contexts: contextsAdded
    });
  } catch (error) {
    console.error('❌ Erro no upload de treinamento:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Erro interno do servidor' 
    });
  }
});

export default router;