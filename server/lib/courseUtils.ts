/**
 * Course utilities - simplified for production use
 */

// Simplified course dictionary for the /api/courses endpoints
export const COURSE_DICTIONARY = {
  'administracao': { courseName: 'Administração', courseType: 'Graduação' },
  'direito': { courseName: 'Direito', courseType: 'Graduação' },
  'medicina': { courseName: 'Medicina', courseType: 'Graduação' },
  'engenharia_civil': { courseName: 'Engenharia Civil', courseType: 'Graduação' },
  'psicologia': { courseName: 'Psicologia', courseType: 'Graduação' },
  'pedagogia': { courseName: 'Pedagogia', courseType: 'Graduação' },
  'enfermagem': { courseName: 'Enfermagem', courseType: 'Graduação' },
  'nutricao': { courseName: 'Nutrição', courseType: 'Graduação' },
  'fisioterapia': { courseName: 'Fisioterapia', courseType: 'Graduação' },
  'odontologia': { courseName: 'Odontologia', courseType: 'Graduação' },
  'arquitetura': { courseName: 'Arquitetura e Urbanismo', courseType: 'Graduação' },
  'ciencias_contabeis': { courseName: 'Ciências Contábeis', courseType: 'Graduação' },
  'sistemas_informacao': { courseName: 'Sistemas de Informação', courseType: 'Graduação' },
  'educacao_fisica': { courseName: 'Educação Física', courseType: 'Graduação' },
  'farmacia': { courseName: 'Farmácia', courseType: 'Graduação' },
  'biomedicina': { courseName: 'Biomedicina', courseType: 'Graduação' },
  'medicina_veterinaria': { courseName: 'Medicina Veterinária', courseType: 'Graduação' },
  'ciencias_biologicas': { courseName: 'Ciências Biológicas', courseType: 'Graduação' },
  'engenharia_mecanica': { courseName: 'Engenharia Mecânica', courseType: 'Graduação' },
  'engenharia_eletrica': { courseName: 'Engenharia Elétrica', courseType: 'Graduação' },
  'engenharia_producao': { courseName: 'Engenharia de Produção', courseType: 'Graduação' },
  'jornalismo': { courseName: 'Jornalismo', courseType: 'Graduação' },
  'publicidade': { courseName: 'Publicidade e Propaganda', courseType: 'Graduação' },
  'design_grafico': { courseName: 'Design Gráfico', courseType: 'Graduação' },
  'ciencia_computacao': { courseName: 'Ciência da Computação', courseType: 'Graduação' },
  'analise_desenvolvimento': { courseName: 'Análise e Desenvolvimento de Sistemas', courseType: 'Graduação' },
  'gestao_ti': { courseName: 'Gestão da Tecnologia da Informação', courseType: 'Graduação' },
  'servico_social': { courseName: 'Serviço Social', courseType: 'Graduação' },
  'historia': { courseName: 'História', courseType: 'Graduação' },
  'letras': { courseName: 'Letras', courseType: 'Graduação' },
  'matematica': { courseName: 'Matemática', courseType: 'Graduação' },
  'geografia': { courseName: 'Geografia', courseType: 'Graduação' },
  'filosofia': { courseName: 'Filosofia', courseType: 'Graduação' }
};

export function getCourseCategories(): string[] {
  const categories = new Set<string>();
  for (const courseData of Object.values(COURSE_DICTIONARY)) {
    categories.add(courseData.courseType);
  }
  return Array.from(categories).sort();
}

export function getCoursesByCategory(category: string): string[] {
  return Object.values(COURSE_DICTIONARY)
    .filter(courseData => courseData.courseType === category)
    .map(courseData => courseData.courseName)
    .sort();
}