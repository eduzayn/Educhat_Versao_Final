/**
 * Macrosetor detection utilities
 * Analyzes message content to determine educational field/sector
 */

export interface MacrosetorDetection {
  macrosetor: string;
  confidence: number;
  keywords: string[];
}

// Educational field keywords mapping
const MACROSETOR_KEYWORDS = {
  'comercial': [
    'curso', 'matricula', 'inscrição', 'valor', 'preço', 'pagamento', 'mensalidade',
    'desconto', 'promoção', 'oferta', 'venda', 'comprar', 'adquirir',
    'investimento', 'custo', 'quanto custa', 'informações sobre curso',
    'quero saber mais', 'tenho interesse', 'gostaria de', 'comercial',
    'vendas', 'negócio', 'proposta', 'orçamento'
  ],
  'suporte': [
    'problema', 'erro', 'não funciona', 'bug', 'falha', 'dificuldade',
    'ajuda', 'socorro', 'suporte', 'técnico', 'não consigo', 'travou',
    'lento', 'não carrega', 'senha', 'login', 'acesso', 'recuperar',
    'resetar', 'configurar', 'instalação', 'tutorial', 'como fazer'
  ],
  'cobranca': [
    'pagamento', 'boleto', 'fatura', 'cobrança', 'débito', 'vencimento',
    'atraso', 'multa', 'juros', 'parcelamento', 'renegociação', 'acordo',
    'quitação', 'financeiro', 'conta em atraso', 'inadimplência',
    'segunda via', 'extrato', 'comprovante', 'recibo', 'nota fiscal'
  ],
  'tutoria': [
    'dúvida', 'exercício', 'questão', 'matéria', 'conteúdo', 'disciplina',
    'professor', 'tutor', 'explicação', 'esclarecimento', 'aula',
    'videoaula', 'material', 'apostila', 'livro', 'bibliografia',
    'cronograma', 'horário', 'agenda', 'revisão', 'prova', 'exame'
  ],
  'secretaria': [
    'certificado', 'diploma', 'declaração', 'histórico', 'documento',
    'carteirinha', 'identidade estudantil', 'rematrícula', 'transferência',
    'trancamento', 'cancelamento', 'secretaria', 'acadêmico',
    'coordenação', 'diretoria', 'protocolo', 'solicitação', 'requerimento'
  ],
  'tecnologia': [
    'programação', 'desenvolvimento', 'software', 'javascript', 'python', 'java',
    'web design', 'front-end', 'back-end', 'fullstack', 'mobile', 'app',
    'inteligência artificial', 'machine learning', 'data science', 'blockchain',
    'cybersecurity', 'redes', 'banco de dados', 'sql', 'nosql',
    'devops', 'cloud', 'aws', 'azure', 'docker', 'kubernetes'
  ],
  'saude': [
    'medicina', 'enfermagem', 'fisioterapia', 'nutrição', 'psicologia',
    'odontologia', 'farmacia', 'veterinaria', 'biomedicina',
    'educação física', 'fonoaudiologia', 'terapia ocupacional',
    'anatomia', 'fisiologia', 'patologia', 'farmacologia'
  ],
  'engenharia': [
    'engenharia civil', 'engenharia mecânica', 'engenharia elétrica',
    'engenharia química', 'engenharia de produção', 'engenharia ambiental',
    'arquitetura', 'urbanismo', 'construção civil', 'autocad', 'solidworks'
  ],
  'administracao': [
    'administração', 'gestão', 'marketing', 'vendas', 'empreendedorismo',
    'finanças', 'contabilidade', 'recursos humanos', 'logística',
    'economia', 'negócios', 'startups', 'inovação'
  ],
  'direito': [
    'direito', 'advocacia', 'jurídico', 'legislação', 'tribunal',
    'constitucional', 'civil', 'penal', 'trabalhista', 'tributário',
    'processo', 'jurisprudência', 'oab', 'concurso público'
  ],
  'educacao': [
    'pedagogia', 'licenciatura', 'magistério', 'educação infantil',
    'ensino fundamental', 'ensino médio', 'ead', 'didática',
    'metodologia', 'avaliação', 'currículo', 'pnld'
  ],
  'comunicacao': [
    'jornalismo', 'publicidade', 'propaganda', 'marketing digital',
    'redes sociais', 'design gráfico', 'fotografia', 'audiovisual',
    'rádio', 'televisão', 'cinema', 'streaming'
  ]
};

/**
 * Sistema antigo de detecção removido - agora utiliza IA para classificação
 * Função mantida apenas para compatibilidade com código existente
 */
export function detectMacrosetor(content: string): MacrosetorDetection | null {
  // Sistema antigo de detecção por palavras-chave removido
  // O novo sistema de IA faz a classificação automaticamente
  return null;
}

/**
 * Gets all available macrosetores
 */
export function getAvailableMacrosetores(): string[] {
  return Object.keys(MACROSETOR_KEYWORDS);
}

/**
 * Gets keywords for a specific macrosetor
 */
export function getMacrosetorKeywords(macrosetor: string): string[] {
  return MACROSETOR_KEYWORDS[macrosetor as keyof typeof MACROSETOR_KEYWORDS] || [];
}