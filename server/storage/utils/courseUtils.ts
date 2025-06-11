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

// Sistema de detecção educacional migrado para IA
// Função detectEducationalInfo removida - o novo sistema de IA faz a análise automaticamente

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