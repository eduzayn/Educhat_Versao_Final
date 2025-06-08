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
 * Detects the macrosetor based on message content
 */
export function detectMacrosetor(content: string): MacrosetorDetection | null {
  if (!content || content.trim().length < 10) {
    return null;
  }

  const normalizedContent = content.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove accents

  const detections: MacrosetorDetection[] = [];

  for (const [macrosetor, keywords] of Object.entries(MACROSETOR_KEYWORDS)) {
    const foundKeywords: string[] = [];
    let totalMatches = 0;

    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword.replace(/[\u0300-\u036f]/g, '')}\\b`, 'gi');
      const matches = normalizedContent.match(regex);
      if (matches) {
        foundKeywords.push(keyword);
        totalMatches += matches.length;
      }
    }

    if (foundKeywords.length > 0) {
      const confidence = Math.min(
        (foundKeywords.length / keywords.length) * 0.7 + 
        (totalMatches / content.split(' ').length) * 0.3,
        1.0
      );

      detections.push({
        macrosetor,
        confidence,
        keywords: foundKeywords
      });
    }
  }

  // Return the detection with highest confidence
  if (detections.length > 0) {
    return detections.sort((a, b) => b.confidence - a.confidence)[0];
  }

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