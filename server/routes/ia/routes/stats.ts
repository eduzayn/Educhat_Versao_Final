import { Router } from 'express';
import { db } from '../../../core/db';
import { aiLogs } from '../../../../shared/schema';
import { eq, desc, and, count, avg, sql } from 'drizzle-orm';
import { IAStats } from '../types';

const router = Router();

/**
 * GET /api/ia/stats - Estatísticas do dashboard
 */
router.get('/', async (req, res) => {
  try {
    // Total de interações da IA
    const [totalInteractionsResult] = await db
      .select({ count: count() })
      .from(aiLogs);

    // Conversas com interesse em cursos (classificação course_inquiry)
    const [courseInquiryResult] = await db
      .select({ count: count() })
      .from(aiLogs)
      .where(eq(aiLogs.classification, 'course_inquiry'));

    // Tempo médio de processamento
    const [avgProcessingTimeResult] = await db
      .select({ avg: avg(aiLogs.processingTime) })
      .from(aiLogs)
      .where(sql`${aiLogs.processingTime} IS NOT NULL`);

    // Conversas únicas atendidas pela IA
    const [uniqueConversationsResult] = await db
      .select({ count: sql`COUNT(DISTINCT ${aiLogs.conversationId})` })
      .from(aiLogs)
      .where(sql`${aiLogs.conversationId} IS NOT NULL`);

    // Top 5 classificações mais comuns
    const topClassifications = await db
      .select({
        classification: aiLogs.classification,
        count: count()
      })
      .from(aiLogs)
      .where(sql`${aiLogs.classification} IS NOT NULL`)
      .groupBy(aiLogs.classification)
      .orderBy(desc(count()))
      .limit(5);

    const totalInteractions = Number(totalInteractionsResult?.count) || 0;
    const courseInquiries = Number(courseInquiryResult?.count) || 0;
    const avgProcessingTime = Math.round(Number(avgProcessingTimeResult?.avg) || 0);
    const uniqueConversations = Number(uniqueConversationsResult?.count) || 0;
    
    // Taxa de detecção de interesse em cursos
    const courseDetectionRate = totalInteractions > 0 ? 
      Math.round((courseInquiries / totalInteractions) * 100) : 0;

    const stats: IAStats = {
      totalInteractions,
      leadsConverted: courseInquiries,
      avgResponseTime: avgProcessingTime,
      successRate: courseDetectionRate,
      studentsHelped: uniqueConversations,
      topIntents: topClassifications.map(item => ({
        intent: item.classification || 'unknown',
        count: Number(item.count)
      }))
    };

    res.json(stats);
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas da IA:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

export default router; 