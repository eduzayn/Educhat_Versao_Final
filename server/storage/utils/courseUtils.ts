/**
 * Course utilities - extraído do storage original
 * Contém o dicionário completo de cursos e detecção automática
 */

// Dicionário completo de cursos (extraído do storage original)
export const COURSE_DICTIONARY = {
  // ========== GRADUAÇÃO (28 cursos) ==========
  'administracao': {
    variations: ['administração', 'administracao', 'admin', 'adm', 'gestão empresarial', 'gestao empresarial'],
    courseType: 'Graduação',
    courseName: 'Administração'
  },
  'arquitetura': {
    variations: ['arquitetura e urbanismo', 'arquitetura urbanismo', 'arq', 'arquiteto'],
    courseType: 'Graduação',
    courseName: 'Arquitetura e Urbanismo'
  },
  'biomedicina': {
    variations: ['biomedicina', 'biomedico', 'biomédico'],
    courseType: 'Graduação',
    courseName: 'Biomedicina'
  },
  'ciencias_biologicas': {
    variations: ['ciências biológicas', 'ciencias biologicas', 'biologia', 'bio'],
    courseType: 'Graduação',
    courseName: 'Ciências Biológicas'
  },
  'ciencias_contabeis': {
    variations: ['ciências contábeis', 'ciencias contabeis', 'contabilidade', 'contador'],
    courseType: 'Graduação',
    courseName: 'Ciências Contábeis'
  },
  'direito': {
    variations: ['direito', 'advocacia', 'advogado', 'bacharel em direito'],
    courseType: 'Graduação',
    courseName: 'Direito'
  },
  'educacao_fisica': {
    variations: ['educação física', 'educacao fisica', 'ed física', 'professor de educação física'],
    courseType: 'Graduação',
    courseName: 'Educação Física'
  },
  'enfermagem': {
    variations: ['enfermagem', 'enfermeiro', 'enfermeira'],
    courseType: 'Graduação',
    courseName: 'Enfermagem'
  },
  'engenharia_civil': {
    variations: ['engenharia civil', 'eng civil', 'engenheiro civil'],
    courseType: 'Graduação',
    courseName: 'Engenharia Civil'
  },
  'engenharia_eletrica': {
    variations: ['engenharia elétrica', 'engenharia eletrica', 'eng elétrica', 'engenheiro eletricista'],
    courseType: 'Graduação',
    courseName: 'Engenharia Elétrica'
  },
  'engenharia_mecanica': {
    variations: ['engenharia mecânica', 'engenharia mecanica', 'eng mecânica', 'engenheiro mecânico'],
    courseType: 'Graduação',
    courseName: 'Engenharia Mecânica'
  },
  'engenharia_producao': {
    variations: ['engenharia de produção', 'engenharia producao', 'eng produção'],
    courseType: 'Graduação',
    courseName: 'Engenharia de Produção'
  },
  'farmacia': {
    variations: ['farmácia', 'farmacia', 'farmacêutico', 'farmaceutico'],
    courseType: 'Graduação',
    courseName: 'Farmácia'
  },
  'fisioterapia': {
    variations: ['fisioterapia', 'fisioterapeuta', 'fisiológica'],
    courseType: 'Graduação',
    courseName: 'Fisioterapia'
  },
  'medicina': {
    variations: ['medicina', 'médico', 'medico', 'doutor'],
    courseType: 'Graduação',
    courseName: 'Medicina'
  },
  'medicina_veterinaria': {
    variations: ['medicina veterinária', 'medicina veterinaria', 'veterinária', 'veterinario'],
    courseType: 'Graduação',
    courseName: 'Medicina Veterinária'
  },
  'nutricao': {
    variations: ['nutrição', 'nutricao', 'nutricionista'],
    courseType: 'Graduação',
    courseName: 'Nutrição'
  },
  'odontologia': {
    variations: ['odontologia', 'dentista', 'dentística'],
    courseType: 'Graduação',
    courseName: 'Odontologia'
  },
  'pedagogia': {
    variations: ['pedagogia', 'pedagogo', 'pedagoga'],
    courseType: 'Graduação',
    courseName: 'Pedagogia'
  },
  'psicologia': {
    variations: ['psicologia', 'psicólogo', 'psicologo', 'psicóloga'],
    courseType: 'Graduação',
    courseName: 'Psicologia'
  },
  'sistemas_informacao': {
    variations: ['sistemas de informação', 'sistemas informacao', 'si', 'sistemas'],
    courseType: 'Graduação',
    courseName: 'Sistemas de Informação'
  },
  'ciencia_computacao': {
    variations: ['ciência da computação', 'ciencia computacao', 'computação', 'cc'],
    courseType: 'Graduação',
    courseName: 'Ciência da Computação'
  },
  'analise_desenvolvimento': {
    variations: ['análise e desenvolvimento de sistemas', 'analise desenvolvimento sistemas', 'ads'],
    courseType: 'Graduação',
    courseName: 'Análise e Desenvolvimento de Sistemas'
  },
  'gestao_ti': {
    variations: ['gestão da tecnologia da informação', 'gestao ti', 'gti'],
    courseType: 'Graduação',
    courseName: 'Gestão da Tecnologia da Informação'
  },
  'servico_social': {
    variations: ['serviço social', 'servico social', 'assistente social'],
    courseType: 'Graduação',
    courseName: 'Serviço Social'
  },
  'jornalismo': {
    variations: ['jornalismo', 'jornalista', 'comunicação social'],
    courseType: 'Graduação',
    courseName: 'Jornalismo'
  },
  'publicidade': {
    variations: ['publicidade e propaganda', 'publicidade propaganda', 'marketing'],
    courseType: 'Graduação',
    courseName: 'Publicidade e Propaganda'
  },
  'design_grafico': {
    variations: ['design gráfico', 'design grafico', 'designer gráfico'],
    courseType: 'Graduação',
    courseName: 'Design Gráfico'
  },
  'historia': {
    variations: ['história', 'historia', 'historiador', 'historica', 'curso de história'],
    courseType: 'Graduação',
    courseName: 'História'
  },
  'letras': {
    variations: ['letras', 'língua portuguesa', 'lingua portuguesa', 'português', 'portugues'],
    courseType: 'Graduação',
    courseName: 'Letras'
  },
  'matematica': {
    variations: ['matemática', 'matematica', 'matemático', 'matematico'],
    courseType: 'Graduação',
    courseName: 'Matemática'
  },
  'geografia': {
    variations: ['geografia', 'geógrafo', 'geografo'],
    courseType: 'Graduação',
    courseName: 'Geografia'
  },
  'filosofia': {
    variations: ['filosofia', 'filósofo', 'filosofo'],
    courseType: 'Graduação',
    courseName: 'Filosofia'
  }
};

/**
 * Detecta cursos mencionados no texto
 */
export function detectCourses(text: string): string[] {
  const lowerText = text.toLowerCase();
  const detectedCourses: string[] = [];
  
  for (const [courseId, courseData] of Object.entries(COURSE_DICTIONARY)) {
    for (const variation of courseData.variations) {
      if (lowerText.includes(variation.toLowerCase())) {
        detectedCourses.push(courseData.courseName);
        break;
      }
    }
  }
  
  return Array.from(new Set(detectedCourses)); // Remove duplicatas
}

/**
 * Detecta informações educacionais completas (interesse e formação)
 */
export function detectEducationalInfo(text: string): {
  interests: string[];
  background: string[];
  allCourses: string[];
} {
  const lowerText = text.toLowerCase();
  const interests: string[] = [];
  const background: string[] = [];
  const allCourses: string[] = [];
  
  // Padrões expandidos para detectar interesse
  const interestPatterns = [
    /quero\s+(?:fazer|estudar|cursar|me\s+formar\s+em)\s+(?:o\s+curso\s+de\s+)?([^.!?]+)/gi,
    /interesse\s+(?:em|no|na)\s+(?:curso\s+(?:de\s+)?|área\s+de\s+)?([^.!?]+)/gi,
    /pretendo\s+(?:fazer|estudar|cursar|me\s+formar\s+em)\s+(?:o\s+curso\s+de\s+)?([^.!?]+)/gi,
    /gostaria\s+de\s+(?:fazer|estudar|cursar|me\s+formar\s+em)\s+(?:o\s+curso\s+de\s+)?([^.!?]+)/gi,
    /tenho\s+interesse\s+(?:em|no|na)\s+(?:curso\s+(?:de\s+)?|área\s+de\s+)?([^.!?]+)/gi,
    /busco\s+(?:informações\s+sobre|fazer|estudar|curso\s+de)\s+([^.!?]+)/gi,
    /procuro\s+(?:informações\s+sobre|fazer|curso\s+de)\s+([^.!?]+)/gi,
    /me\s+interess[oa]\s+(?:por|em)\s+(?:curso\s+de\s+)?([^.!?]+)/gi,
    /gosto\s+(?:da\s+área\s+de|de)\s+([^.!?]+)/gi,
    /penso\s+em\s+(?:fazer|estudar|cursar)\s+([^.!?]+)/gi,
    /estou\s+considerando\s+(?:fazer|estudar|cursar)\s+([^.!?]+)/gi,
    /tenho\s+vontade\s+de\s+(?:fazer|estudar|cursar)\s+([^.!?]+)/gi
  ];
  
  // Padrões expandidos para detectar formação atual/passada
  const backgroundPatterns = [
    /sou\s+(?:formad[oa]|graduad[oa])\s+em\s+([^.!?]+)/gi,
    /tenho\s+(?:graduação|formação|diploma)\s+em\s+([^.!?]+)/gi,
    /me\s+form[eai]+\s+em\s+([^.!?]+)/gi,
    /formad[oa]\s+em\s+([^.!?]+)/gi,
    /graduad[oa]\s+em\s+([^.!?]+)/gi,
    /bacharel\s+em\s+([^.!?]+)/gi,
    /licenciad[oa]\s+em\s+([^.!?]+)/gi,
    /estudei\s+([^.!?]+)/gi,
    /cursei\s+([^.!?]+)/gi,
    /fiz\s+(?:graduação|curso|faculdade)\s+(?:de|em)\s+([^.!?]+)/gi,
    /minha\s+(?:graduação|formação)\s+(?:é|foi)\s+em\s+([^.!?]+)/gi,
    /sou\s+(?:da\s+área\s+de|de)\s+([^.!?]+)/gi,
    /trabalho\s+(?:na\s+área\s+de|com)\s+([^.!?]+)/gi,
    /atuo\s+(?:na\s+área\s+de|em)\s+([^.!?]+)/gi
  ];
  
  // Detectar interesses
  for (const pattern of interestPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const courseText = match[1].trim();
      const detectedCourses = detectCoursesInText(courseText);
      interests.push(...detectedCourses);
    }
  }
  
  // Detectar formação
  for (const pattern of backgroundPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const courseText = match[1].trim();
      const detectedCourses = detectCoursesInText(courseText);
      background.push(...detectedCourses);
    }
  }
  
  // Detectar todos os cursos mencionados (para compatibilidade)
  allCourses.push(...detectCourses(text));
  
  return {
    interests: Array.from(new Set(interests)),
    background: Array.from(new Set(background)),
    allCourses: Array.from(new Set([...interests, ...background, ...allCourses]))
  };
}

/**
 * Função auxiliar para detectar cursos em um texto específico
 */
function detectCoursesInText(text: string): string[] {
  const lowerText = text.toLowerCase();
  const detectedCourses: string[] = [];
  
  for (const [courseId, courseData] of Object.entries(COURSE_DICTIONARY)) {
    for (const variation of courseData.variations) {
      if (lowerText.includes(variation.toLowerCase())) {
        detectedCourses.push(courseData.courseName);
        break;
      }
    }
  }
  
  return detectedCourses;
}

/**
 * Obtém todas as categorias de cursos disponíveis
 */
export function getCourseCategories(): string[] {
  const categories = new Set<string>();
  for (const courseData of Object.values(COURSE_DICTIONARY)) {
    categories.add(courseData.courseType);
  }
  return Array.from(categories).sort();
}

/**
 * Obtém todos os cursos de uma categoria específica
 */
export function getCoursesByCategory(category: string): string[] {
  return Object.values(COURSE_DICTIONARY)
    .filter(courseData => courseData.courseType === category)
    .map(courseData => courseData.courseName)
    .sort();
}

/**
 * Obtém todos os cursos organizados por categoria
 */
export function getAllCoursesGrouped(): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};
  
  for (const courseData of Object.values(COURSE_DICTIONARY)) {
    if (!grouped[courseData.courseType]) {
      grouped[courseData.courseType] = [];
    }
    grouped[courseData.courseType].push(courseData.courseName);
  }
  
  // Ordenar cursos dentro de cada categoria
  for (const category in grouped) {
    grouped[category].sort();
  }
  
  return grouped;
}

/**
 * Obtém informações completas do curso
 */
export function getCourseInfo(courseName: string) {
  for (const [courseId, courseData] of Object.entries(COURSE_DICTIONARY)) {
    if (courseData.courseName === courseName || 
        courseData.variations.some(v => v.toLowerCase() === courseName.toLowerCase())) {
      return {
        id: courseId,
        ...courseData
      };
    }
  }
  return null;
}