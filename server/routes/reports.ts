import { Router } from 'express';
import { db } from '../db';
import { conversations, messages, contacts } from '../../shared/schema';
import { sql, eq, and, gte, lte, count, avg, desc } from 'drizzle-orm';

const router = Router();

// Endpoint para dados de analytics dos relatórios
router.get('/analytics', async (req, res) => {
  try {
    const { period = '30', channel = 'all', startDate, endDate } = req.query;

    // Calcular datas baseadas no período
    let dateFilter;
    const now = new Date();
    
    if (startDate && endDate) {
      dateFilter = and(
        gte(conversations.createdAt, new Date(startDate as string)),
        lte(conversations.createdAt, new Date(endDate as string))
      );
    } else {
      const daysAgo = parseInt(period as string);
      const pastDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      dateFilter = gte(conversations.createdAt, pastDate);
    }

    // Filtro por canal
    let channelFilter = sql`1=1`;
    if (channel !== 'all') {
      channelFilter = eq(conversations.channel, channel as string);
    }

    // Buscar métricas atuais
    const currentMetrics = await db
      .select({
        totalConversations: count(),
        avgResponseTime: avg(sql`EXTRACT(EPOCH FROM (updated_at - created_at))/60`)
      })
      .from(conversations)
      .where(and(dateFilter, channelFilter));

    // Buscar total de mensagens
    const messageStats = await db
      .select({
        messagesSent: count(),
      })
      .from(messages)
      .innerJoin(conversations, eq(messages.conversationId, conversations.id))
      .where(and(dateFilter, channelFilter));

    // Calcular taxa de resolução (conversas com status "resolved")
    const resolvedConversations = await db
      .select({
        resolved: count(),
      })
      .from(conversations)
      .where(and(
        dateFilter,
        channelFilter,
        eq(conversations.status, 'resolved')
      ));

    // Calcular métricas do período anterior para comparação
    const periodDays = parseInt(period as string) || 30;
    const previousPeriodStart = new Date(now.getTime() - (periodDays * 2) * 24 * 60 * 60 * 1000);
    const previousPeriodEnd = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
    
    const previousDateFilter = and(
      gte(conversations.createdAt, previousPeriodStart),
      lte(conversations.createdAt, previousPeriodEnd)
    );

    const previousMetrics = await db
      .select({
        totalConversations: count(),
        avgResponseTime: avg(sql`EXTRACT(EPOCH FROM (updated_at - created_at))/60`)
      })
      .from(conversations)
      .where(and(previousDateFilter, channelFilter));

    const previousMessageStats = await db
      .select({
        messagesSent: count(),
      })
      .from(messages)
      .innerJoin(conversations, eq(messages.conversationId, conversations.id))
      .where(and(previousDateFilter, channelFilter));

    const previousResolvedConversations = await db
      .select({
        resolved: count(),
      })
      .from(conversations)
      .where(and(
        previousDateFilter,
        channelFilter,
        eq(conversations.status, 'resolved')
      ));

    // Calcular crescimentos percentuais
    const current = currentMetrics[0];
    const previous = previousMetrics[0];
    const currentMessages = messageStats[0]?.messagesSent || 0;
    const previousMessages = previousMessageStats[0]?.messagesSent || 0;
    const currentResolved = resolvedConversations[0]?.resolved || 0;
    const previousResolved = previousResolvedConversations[0]?.resolved || 0;

    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const totalConversations = Number(current?.totalConversations) || 0;
    const previousTotalConversations = Number(previous?.totalConversations) || 0;
    const resolutionRate = totalConversations > 0 ? Math.round((Number(currentResolved) / totalConversations) * 100) : 0;
    const previousResolutionRate = previousTotalConversations > 0 ? Math.round((Number(previousResolved) / previousTotalConversations) * 100) : 0;

    const metrics = {
      totalConversations,
      messagesSent: Number(currentMessages),
      avgResponseTime: Math.round(Number(current?.avgResponseTime) || 0),
      resolutionRate,
      conversationGrowth: calculateGrowth(totalConversations, previousTotalConversations),
      messagesGrowth: calculateGrowth(Number(currentMessages), Number(previousMessages)),
      responseTimeGrowth: calculateGrowth(
        Math.round(Number(current?.avgResponseTime) || 0),
        Math.round(Number(previous?.avgResponseTime) || 0)
      ),
      resolutionGrowth: calculateGrowth(resolutionRate, previousResolutionRate)
    };

    res.json({ metrics });
  } catch (error) {
    console.error('Erro ao buscar analytics:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Endpoint para dados do gráfico de conversas por período
router.get('/conversations-chart', async (req, res) => {
  try {
    const { period = '30', channel = 'all' } = req.query;
    const now = new Date();
    const daysAgo = parseInt(period as string);
    const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    // Filtro de data
    const dateFilter = gte(conversations.createdAt, startDate);
    
    // Filtro de canal
    const channelFilter = channel === 'all' ? undefined : eq(conversations.channel, channel as string);

    // Buscar conversas agrupadas por dia
    const conversationsByDay = await db
      .select({
        date: sql<string>`DATE(${conversations.createdAt})`,
        count: count()
      })
      .from(conversations)
      .where(and(dateFilter, channelFilter))
      .groupBy(sql`DATE(${conversations.createdAt})`)
      .orderBy(sql`DATE(${conversations.createdAt})`);

    // Preencher dias sem dados com zero
    const chartData = [];
    for (let i = daysAgo - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const dayData = conversationsByDay.find(d => d.date === dateStr);
      
      chartData.push({
        date: dateStr,
        conversas: dayData ? dayData.count : 0,
        label: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      });
    }

    res.json({ data: chartData });
  } catch (error) {
    console.error('Erro ao buscar dados do gráfico de conversas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Endpoint para dados do gráfico de canais mais utilizados
router.get('/channels-chart', async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const now = new Date();
    const daysAgo = parseInt(period as string);
    const startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    const dateFilter = gte(conversations.createdAt, startDate);

    // Buscar conversas agrupadas por canal
    const conversationsByChannel = await db
      .select({
        channel: conversations.channel,
        count: count()
      })
      .from(conversations)
      .where(dateFilter)
      .groupBy(conversations.channel)
      .orderBy(desc(count()));

    // Calcular total para porcentagens
    const total = conversationsByChannel.reduce((sum, item) => sum + item.count, 0);

    const chartData = conversationsByChannel.map(item => ({
      canal: item.channel || 'WhatsApp',
      conversas: item.count,
      porcentagem: total > 0 ? Math.round((item.count / total) * 100) : 0
    }));

    res.json({ data: chartData });
  } catch (error) {
    console.error('Erro ao buscar dados do gráfico de canais:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Endpoint para exportar relatórios
router.get('/export', async (req, res) => {
  try {
    const { period = '30', channel = 'all', format = 'xlsx', startDate, endDate } = req.query;

    // Calcular datas baseadas no período
    let dateFilter;
    const now = new Date();
    
    if (startDate && endDate) {
      dateFilter = and(
        gte(conversations.createdAt, new Date(startDate as string)),
        lte(conversations.createdAt, new Date(endDate as string))
      );
    } else {
      const daysAgo = parseInt(period as string);
      const pastDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      dateFilter = gte(conversations.createdAt, pastDate);
    }

    // Filtro por canal
    let channelFilter = sql`1=1`;
    if (channel !== 'all') {
      channelFilter = eq(conversations.channel, channel as string);
    }

    // Buscar dados detalhados para exportação
    const exportData = await db
      .select({
        conversationId: conversations.id,
        contactName: contacts.name,
        contactPhone: contacts.phone,
        channel: conversations.channel,
        status: conversations.status,
        createdAt: conversations.createdAt,
        updatedAt: conversations.updatedAt,
        priority: conversations.priority,
        teamType: conversations.teamType
      })
      .from(conversations)
      .innerJoin(contacts, eq(conversations.contactId, contacts.id))
      .where(and(dateFilter, channelFilter))
      .orderBy(conversations.createdAt);

    // Simular geração de arquivo baseado no formato
    const fileName = `relatorio_${new Date().toISOString().split('T')[0]}.${format}`;
    
    if (format === 'csv') {
      // Gerar CSV
      const csvHeader = 'ID Conversa,Nome Contato,Telefone,Canal,Status,Data Criação,Data Atualização,Prioridade,Equipe\n';
      const csvData = exportData.map(row => [
        row.conversationId,
        `"${row.contactName}"`,
        row.contactPhone || '',
        row.channel,
        row.status || '',
        row.createdAt?.toISOString().split('T')[0] || '',
        row.updatedAt?.toISOString().split('T')[0] || '',
        row.priority || '',
        row.teamType || ''
      ].join(',')).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(csvHeader + csvData);
    } else if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.json(exportData);
    } else {
      // Para xlsx e pdf, retornar dados estruturados (implementação completa necessitaria de bibliotecas específicas)
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(JSON.stringify(exportData, null, 2));
    }
  } catch (error) {
    console.error('Erro ao exportar relatório:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;