import { BaseStorage } from '../base/BaseStorage';
import { 
  macrosetorDetection, 
  macrosetorKeywords, 
  detectionLogs,
  type MacrosetorDetection,
  type InsertMacrosetorDetection,
  type MacrosetorKeyword,
  type InsertMacrosetorKeyword,
  type DetectionLog,
  type InsertDetectionLog,
  type MacrosetorWithKeywords
} from '../../../shared/schema';
import { eq, desc, and } from 'drizzle-orm';

/**
 * Storage para gerenciamento do sistema de detecção de macrosetores
 */
export class MacrosetorStorage extends BaseStorage {
  
  // Métodos para Macrosetores
  async getMacrosetores(): Promise<MacrosetorWithKeywords[]> {
    const results = await this.db
      .select()
      .from(macrosetorDetection)
      .leftJoin(macrosetorKeywords, eq(macrosetorDetection.id, macrosetorKeywords.macrosetorId))
      .orderBy(macrosetorDetection.priority, macrosetorDetection.name);

    // Agrupar resultados por macrosetor
    const grouped = results.reduce((acc, row) => {
      const macrosetor = row.macrosetor_detection;
      const keyword = row.macrosetor_keywords;
      
      if (!acc[macrosetor.id]) {
        acc[macrosetor.id] = {
          ...macrosetor,
          keywords: []
        };
      }
      
      if (keyword) {
        acc[macrosetor.id].keywords.push(keyword);
      }
      
      return acc;
    }, {} as Record<number, MacrosetorWithKeywords>);

    return Object.values(grouped);
  }

  async getMacrosetor(id: number): Promise<MacrosetorWithKeywords | undefined> {
    const results = await this.db
      .select()
      .from(macrosetorDetection)
      .leftJoin(macrosetorKeywords, eq(macrosetorDetection.id, macrosetorKeywords.macrosetorId))
      .where(eq(macrosetorDetection.id, id));

    if (results.length === 0) return undefined;

    const macrosetor = results[0].macrosetor_detection;
    const keywords = results
      .map(row => row.macrosetor_keywords)
      .filter(Boolean) as MacrosetorKeyword[];

    return {
      ...macrosetor,
      keywords
    };
  }

  async createMacrosetor(data: InsertMacrosetorDetection): Promise<MacrosetorDetection> {
    const [macrosetor] = await this.db
      .insert(macrosetorDetection)
      .values(data)
      .returning();
    
    return macrosetor;
  }

  async updateMacrosetor(id: number, data: Partial<InsertMacrosetorDetection>): Promise<MacrosetorDetection> {
    const [macrosetor] = await this.db
      .update(macrosetorDetection)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(macrosetorDetection.id, id))
      .returning();
    
    return macrosetor;
  }

  async deleteMacrosetor(id: number): Promise<void> {
    await this.db
      .delete(macrosetorDetection)
      .where(eq(macrosetorDetection.id, id));
  }

  // Métodos para Palavras-chave
  async getKeywords(macrosetorId: number): Promise<MacrosetorKeyword[]> {
    return await this.db
      .select()
      .from(macrosetorKeywords)
      .where(eq(macrosetorKeywords.macrosetorId, macrosetorId))
      .orderBy(macrosetorKeywords.keyword);
  }

  async getMacrosetorKeywords(macrosetorId: number): Promise<MacrosetorKeyword[]> {
    return this.getKeywords(macrosetorId);
  }

  async createKeyword(data: InsertMacrosetorKeyword): Promise<MacrosetorKeyword> {
    const [keyword] = await this.db
      .insert(macrosetorKeywords)
      .values(data)
      .returning();
    
    return keyword;
  }

  async createMacrosetorKeyword(macrosetorId: number, data: Omit<InsertMacrosetorKeyword, 'macrosetorId'>): Promise<MacrosetorKeyword> {
    return this.createKeyword({ ...data, macrosetorId });
  }

  async updateKeyword(id: number, data: Partial<InsertMacrosetorKeyword>): Promise<MacrosetorKeyword> {
    const [keyword] = await this.db
      .update(macrosetorKeywords)
      .set(data)
      .where(eq(macrosetorKeywords.id, id))
      .returning();
    
    return keyword;
  }

  async deleteKeyword(id: number): Promise<void> {
    await this.db
      .delete(macrosetorKeywords)
      .where(eq(macrosetorKeywords.id, id));
  }

  async deleteKeywordsByMacrosetor(macrosetorId: number): Promise<void> {
    await this.db
      .delete(macrosetorKeywords)
      .where(eq(macrosetorKeywords.macrosetorId, macrosetorId));
  }

  async deleteMacrosetorKeyword(macrosetorId: number, keywordId: number): Promise<void> {
    await this.db
      .delete(macrosetorKeywords)
      .where(and(
        eq(macrosetorKeywords.id, keywordId),
        eq(macrosetorKeywords.macrosetorId, macrosetorId)
      ));
  }

  // Métodos para Logs de Detecção
  async createDetectionLog(data: InsertDetectionLog): Promise<DetectionLog> {
    const [log] = await this.db
      .insert(detectionLogs)
      .values(data)
      .returning();
    
    return log;
  }

  async getDetectionLogs(limit = 100, offset = 0): Promise<DetectionLog[]> {
    return await this.db
      .select()
      .from(detectionLogs)
      .orderBy(desc(detectionLogs.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getDetectionLogsByMacrosetor(macrosetor: string, limit = 100): Promise<DetectionLog[]> {
    return await this.db
      .select()
      .from(detectionLogs)
      .where(eq(detectionLogs.detectedMacrosetor, macrosetor))
      .orderBy(desc(detectionLogs.createdAt))
      .limit(limit);
  }

  // Sistema antigo de detecção removido - agora usa IA para classificação
  async detectMacrosetorAdvanced(content: string, channel?: string): Promise<{
    macrosetor: string;
    confidence: number;
    matchedKeywords: string[];
  }> {
    // Sistema antigo de detecção por palavras-chave removido
    // O novo sistema de IA faz a classificação automaticamente
    return { macrosetor: 'geral', confidence: 0, matchedKeywords: [] };
  }

  // Sistema antigo de teste removido - agora usa IA para classificação
  async testMacrosetorDetection(text: string): Promise<{
    detected: string;
    score: number;
    keywords: Array<{
      keyword: string;
      weight: number;
      macrosetor: string;
    }>;
  }> {
    // Sistema antigo de detecção por palavras-chave removido
    return {
      detected: 'geral',
      score: 0,
      keywords: []
    };
  }

  // Método para inicializar macrosetores padrão
  async initializeDefaultMacrosetores(): Promise<void> {
    const existingMacrosetores = await this.getMacrosetores();
    
    if (existingMacrosetores.length > 0) {
      console.log('Macrosetores já inicializados');
      return;
    }

    const defaultMacrosetores = [
      {
        name: 'comercial',
        description: 'Interesse em cursos, informações comerciais e vendas',
        priority: 1,
        keywords: [
          { keyword: 'curso', weight: 2 },
          { keyword: 'matricula', weight: 2 },
          { keyword: 'inscrição', weight: 2 },
          { keyword: 'valor', weight: 1 },
          { keyword: 'preço', weight: 1 },
          { keyword: 'mensalidade', weight: 2 },
          { keyword: 'desconto', weight: 1 },
          { keyword: 'promoção', weight: 1 },
          { keyword: 'tenho interesse', weight: 2 },
          { keyword: 'quero saber mais', weight: 2 },
          { keyword: 'gostaria de', weight: 1 },
          { keyword: 'quanto custa', weight: 2 }
        ]
      },
      {
        name: 'cobranca',
        description: 'Questões financeiras, pagamentos e cobranças',
        priority: 2,
        keywords: [
          { keyword: 'boleto', weight: 3 },
          { keyword: 'pagamento', weight: 2 },
          { keyword: 'fatura', weight: 2 },
          { keyword: 'cobrança', weight: 3 },
          { keyword: 'atraso', weight: 2 },
          { keyword: 'segunda via', weight: 3 },
          { keyword: 'vencimento', weight: 2 },
          { keyword: 'parcelamento', weight: 2 },
          { keyword: 'financeiro', weight: 1 },
          { keyword: 'inadimplência', weight: 2 }
        ]
      },
      {
        name: 'suporte',
        description: 'Problemas técnicos e suporte ao usuário',
        priority: 3,
        keywords: [
          { keyword: 'problema', weight: 2 },
          { keyword: 'erro', weight: 2 },
          { keyword: 'não funciona', weight: 3 },
          { keyword: 'bug', weight: 2 },
          { keyword: 'ajuda', weight: 1 },
          { keyword: 'suporte', weight: 3 },
          { keyword: 'não consigo', weight: 2 },
          { keyword: 'senha', weight: 2 },
          { keyword: 'login', weight: 2 },
          { keyword: 'acesso', weight: 2 }
        ]
      },
      {
        name: 'secretaria',
        description: 'Documentos, certificados e questões acadêmicas',
        priority: 4,
        keywords: [
          { keyword: 'certificado', weight: 3 },
          { keyword: 'diploma', weight: 3 },
          { keyword: 'declaração', weight: 2 },
          { keyword: 'histórico', weight: 2 },
          { keyword: 'documento', weight: 2 },
          { keyword: 'carteirinha', weight: 2 },
          { keyword: 'rematrícula', weight: 2 },
          { keyword: 'transferência', weight: 2 },
          { keyword: 'secretaria', weight: 3 }
        ]
      },
      {
        name: 'tutoria',
        description: 'Dúvidas acadêmicas e suporte educacional',
        priority: 5,
        keywords: [
          { keyword: 'dúvida', weight: 2 },
          { keyword: 'exercício', weight: 2 },
          { keyword: 'questão', weight: 1 },
          { keyword: 'matéria', weight: 2 },
          { keyword: 'conteúdo', weight: 1 },
          { keyword: 'professor', weight: 2 },
          { keyword: 'tutor', weight: 3 },
          { keyword: 'explicação', weight: 2 },
          { keyword: 'aula', weight: 1 },
          { keyword: 'material', weight: 1 }
        ]
      }
    ];

    for (const macrosetorData of defaultMacrosetores) {
      const { keywords, ...macrosetorInfo } = macrosetorData;
      
      // Criar macrosetor
      const macrosetor = await this.createMacrosetor(macrosetorInfo);
      
      // Criar palavras-chave
      for (const keywordData of keywords) {
        await this.createKeyword({
          ...keywordData,
          macrosetorId: macrosetor.id
        });
      }
    }

    console.log('✅ Macrosetores padrão inicializados com sucesso');
  }
}