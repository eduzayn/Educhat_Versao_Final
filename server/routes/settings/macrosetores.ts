import { Router } from 'express';
import type { DatabaseStorage } from '../../storage';

const router = Router();

/**
 * Rotas para gerenciamento de macrosetores
 */
export function registerMacrosetorRoutes(app: any, storage: DatabaseStorage) {
  
  // GET /api/settings/macrosetores - Listar todos os macrosetores com suas palavras-chave
  app.get('/api/settings/macrosetores', async (req: any, res: any) => {
    try {
      // Usar dados hardcoded existentes no sistema
      const macrosetorKeywords = {
        'comercial': [
          'curso', 'matricula', 'inscrição', 'valor', 'preço', 'pagamento', 'mensalidade',
          'desconto', 'promoção', 'oferta', 'venda', 'comprar', 'adquirir',
          'investimento', 'custo', 'quanto custa', 'informações sobre curso',
          'quero saber mais', 'tenho interesse', 'gostaria de', 'comercial',
          'vendas', 'negócio', 'proposta', 'orçamento'
        ],
        'cobranca': [
          'pagamento', 'boleto', 'fatura', 'cobrança', 'débito', 'vencimento',
          'atraso', 'multa', 'juros', 'parcelamento', 'renegociação', 'acordo',
          'quitação', 'financeiro', 'conta em atraso', 'inadimplência',
          'segunda via', 'extrato', 'comprovante', 'recibo', 'nota fiscal',
          'mensalidades', 'em atraso'
        ],
        'suporte': [
          'problema', 'erro', 'nao funciona', 'bug', 'falha', 'dificuldade',
          'ajuda', 'socorro', 'suporte', 'tecnico', 'nao consigo', 'travou',
          'lento', 'nao carrega', 'senha', 'login', 'acesso', 'recuperar',
          'resetar', 'configurar', 'instalacao', 'tutorial', 'como fazer'
        ],
        'tutoria': [
          'dúvida', 'exercício', 'questão', 'matéria', 'conteúdo', 'disciplina',
          'professor', 'tutor', 'explicação', 'esclarecimento', 'aula',
          'videoaula', 'material', 'apostila', 'livro', 'bibliografia',
          'cronograma', 'horário', 'agenda', 'revisão', 'prova', 'exame'
        ],
        'secretaria': [
          'certificado', 'diploma', 'declaracao', 'historico', 'documento',
          'carteirinha', 'identidade estudantil', 'rematricula', 'transferencia',
          'trancamento', 'cancelamento', 'secretaria', 'academico',
          'coordenacao', 'diretoria', 'protocolo', 'solicitacao', 'requerimento',
          'gostaria de solicitar', 'solicitar certificado', 'segunda graduacao'
        ]
      };

      const macrosetores = Object.entries(macrosetorKeywords).map(([name, keywordsList], index) => ({
        id: index + 1,
        name,
        description: getDescriptionForMacrosetor(name),
        isActive: true,
        priority: index + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        keywords: keywordsList.map((keyword, keywordIndex) => ({
          id: keywordIndex + 1,
          macrosetorId: index + 1,
          keyword,
          weight: getWeightForKeyword(keyword),
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }))
      }));

      res.json(macrosetores);
    } catch (error) {
      console.error('Erro ao buscar macrosetores:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  function getDescriptionForMacrosetor(name: string): string {
    const descriptions: Record<string, string> = {
      'comercial': 'Interesse em cursos, informações comerciais e vendas',
      'cobranca': 'Questões financeiras, pagamentos e cobranças',
      'suporte': 'Problemas técnicos e suporte ao usuário',
      'tutoria': 'Questões acadêmicas e apoio pedagógico',
      'secretaria': 'Documentos, certificados e questões administrativas'
    };
    return descriptions[name] || 'Macrosetor genérico';
  }

  function getWeightForKeyword(keyword: string): number {
    const highPriorityKeywords = ['curso', 'matricula', 'boleto', 'cobrança', 'certificado', 'problema'];
    const mediumPriorityKeywords = ['valor', 'preço', 'pagamento', 'suporte', 'dúvida'];
    
    if (highPriorityKeywords.includes(keyword)) return 3;
    if (mediumPriorityKeywords.includes(keyword)) return 2;
    return 1;
  }

  // GET /api/settings/macrosetores/:id/keywords - Buscar palavras-chave de um macrosetor
  app.get('/api/settings/macrosetores/:id/keywords', async (req: any, res: any) => {
    try {
      const id = parseInt(req.params.id);
      const macrosetorKeywords: Record<number, string[]> = {
        1: ['curso', 'matricula', 'inscrição', 'valor', 'preço', 'pagamento'],
        2: ['pagamento', 'boleto', 'fatura', 'cobrança', 'débito', 'vencimento'],
        3: ['problema', 'erro', 'nao funciona', 'bug', 'falha', 'ajuda'],
        4: ['dúvida', 'exercício', 'questão', 'matéria', 'conteúdo', 'disciplina'],
        5: ['certificado', 'diploma', 'declaracao', 'historico', 'documento']
      };

      const keywords = macrosetorKeywords[id] || [];
      const keywordObjects = keywords.map((keyword, index) => ({
        id: index + 1,
        macrosetorId: id,
        keyword,
        weight: getWeightForKeyword(keyword),
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      res.json(keywordObjects);
    } catch (error) {
      console.error('Erro ao buscar palavras-chave:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // POST /api/settings/macrosetores/test - Testar detecção
  app.post('/api/settings/macrosetores/test', async (req: any, res: any) => {
    try {
      const { text } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: 'Texto é obrigatório' });
      }

      // Sistema de detecção automática removido
      res.json({
        detected: 'geral',
        score: 0,
        keywords: [],
        message: 'Sistema de detecção automática foi removido'
      });
    } catch (error) {
      console.error('Erro ao testar detecção:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Rotas simplificadas para criar/editar/deletar (retornam sucesso mas não alteram dados)
  app.post('/api/settings/macrosetores', async (req: any, res: any) => {
    res.json({ success: true, message: 'Esta é uma visualização do sistema existente' });
  });

  app.put('/api/settings/macrosetores/:id', async (req: any, res: any) => {
    res.json({ success: true, message: 'Esta é uma visualização do sistema existente' });
  });

  app.delete('/api/settings/macrosetores/:id', async (req: any, res: any) => {
    res.json({ success: true, message: 'Esta é uma visualização do sistema existente' });
  });

  app.post('/api/settings/macrosetores/:id/keywords', async (req: any, res: any) => {
    res.json({ success: true, message: 'Esta é uma visualização do sistema existente' });
  });

  app.delete('/api/settings/macrosetores/:macrosetorId/keywords/:keywordId', async (req: any, res: any) => {
    res.json({ success: true, message: 'Esta é uma visualização do sistema existente' });
  });
}