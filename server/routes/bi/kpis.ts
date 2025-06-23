import { Express, Response } from 'express';
import { AuthenticatedRequest } from '../../core/permissions';
import { storage } from "../../storage/index";
import { BIKPIResponse } from './types';
import { conversations } from '@shared/schema';
import { gte } from 'drizzle-orm';

export function registerKPIRoutes(app: Express) {
  // KPIs do Dashboard - REST: GET /api/bi/kpis
  app.get('/api/bi/kpis', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { period = '30', equipe = 'all', channel = 'all' } = req.query;
      const days = parseInt(period as string);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Buscar dados reais diretamente do banco para BI
      const { db } = await import('../../core/db');
      const { conversations: conversationsTable } = await import('@shared/schema');
      const conversationsData = await db
        .select({
          id: conversationsTable.id,
          contactId: conversationsTable.contactId,
          assignedUserId: conversationsTable.assignedUserId,
          status: conversationsTable.status,
          createdAt: conversationsTable.createdAt,
          lastMessageAt: conversationsTable.lastMessageAt
        })
        .from(conversationsTable)
        .where(gte(conversationsTable.createdAt, startDate));
      const allContacts = await storage.searchContacts('');
      const allDeals = await storage.getDeals();

      // Dados já filtrados por período
      const filteredConversations = conversationsData;
      
      const filteredContacts = allContacts.filter(contact => {
        return contact.createdAt ? new Date(contact.createdAt) >= startDate : false;
      });

      const filteredDeals = allDeals.filter(deal => {
        return deal.createdAt ? new Date(deal.createdAt) >= startDate : false;
      });

      // Calcular KPIs
      const totalAtendimentos = filteredConversations.length;
      const novosContatos = filteredContacts.length;
      const dealsConvertidos = filteredDeals.filter(deal => deal.stage === 'won').length;
      const taxaConversao = totalAtendimentos > 0 ? (dealsConvertidos / totalAtendimentos) * 100 : 0;
      
      // Calcular taxa de desistência (conversas sem resposta recente)
      const conversasAbandonadas = filteredConversations.filter(conv => {
        if (!conv.lastMessageAt) return false;
        const lastMessage = new Date(conv.lastMessageAt);
        const daysSinceLastMessage = (Date.now() - lastMessage.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceLastMessage > 7;
      }).length;
      
      const taxaDesistencia = totalAtendimentos > 0 ? (conversasAbandonadas / totalAtendimentos) * 100 : 0;

      const kpis: BIKPIResponse = {
        totalAtendimentos,
        novosContatos,
        taxaConversao: Number(taxaConversao.toFixed(1)),
        taxaDesistencia: Number(taxaDesistencia.toFixed(1)),
        satisfacaoMedia: 4.2, // Valor base - pode ser implementado sistema de avaliação
        tempoMedioResposta: 15, // Em minutos - pode ser calculado das mensagens
        tempoMedioResolucao: 24 // Em horas - pode ser calculado dos deals fechados
      };

      res.json(kpis);
    } catch (error) {
      console.error('Erro ao buscar KPIs:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
} 