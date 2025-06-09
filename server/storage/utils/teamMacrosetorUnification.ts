/**
 * Team-Macrosetor Unification Utilities
 * Treats teams and macrosetors as identical concepts throughout the system
 */

export interface UnifiedTeamMacrosetor {
  id: number;
  name: string;
  macrosetor: string;
  description?: string;
  color: string;
  isActive: boolean;
  maxCapacity: number;
  priority: number;
  workingHours?: any;
  autoAssignment: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Standard macrosetor configurations
export const MACROSETOR_CONFIGS = {
  comercial: {
    name: 'Equipe Comercial',
    description: 'Responsável por vendas, matrículas e informações sobre cursos',
    color: 'green',
    priority: 1,
    maxCapacity: 50,
    autoAssignment: true
  },
  suporte: {
    name: 'Equipe Suporte',
    description: 'Responsável por problemas técnicos e dificuldades de acesso',
    color: 'blue',
    priority: 2,
    maxCapacity: 30,
    autoAssignment: true
  },
  cobranca: {
    name: 'Equipe Cobrança',
    description: 'Responsável por questões financeiras e pagamentos',
    color: 'orange',
    priority: 1,
    maxCapacity: 25,
    autoAssignment: true
  },
  tutoria: {
    name: 'Equipe Tutoria',
    description: 'Responsável por dúvidas acadêmicas e conteúdo dos cursos',
    color: 'purple',
    priority: 2,
    maxCapacity: 40,
    autoAssignment: true
  },
  secretaria: {
    name: 'Equipe Secretaria',
    description: 'Responsável por documentos, certificados e questões acadêmicas',
    color: 'indigo',
    priority: 2,
    maxCapacity: 20,
    autoAssignment: true
  },
  geral: {
    name: 'Equipe Geral',
    description: 'Atendimento geral e direcionamento inicial',
    color: 'gray',
    priority: 3,
    maxCapacity: 100,
    autoAssignment: true
  }
};

/**
 * Get team configuration by macrosetor
 */
export function getTeamConfigByMacrosetor(macrosetor: string): any {
  return MACROSETOR_CONFIGS[macrosetor as keyof typeof MACROSETOR_CONFIGS] || MACROSETOR_CONFIGS.geral;
}

/**
 * Get all available macrosetores/teams
 */
export function getAllMacrosetores(): string[] {
  return Object.keys(MACROSETOR_CONFIGS);
}

/**
 * Normalize team/macrosetor identifier
 */
export function normalizeTeamMacrosetorId(identifier: string | number): string {
  if (typeof identifier === 'number') {
    // If it's a team ID, we need to look up the macrosetor
    return identifier.toString();
  }
  return identifier.toLowerCase();
}

/**
 * Check if a macrosetor is valid
 */
export function isValidMacrosetor(macrosetor: string): boolean {
  return Object.keys(MACROSETOR_CONFIGS).includes(macrosetor);
}

/**
 * Get team priority for assignment
 */
export function getTeamPriority(macrosetor: string): number {
  const config = getTeamConfigByMacrosetor(macrosetor);
  return config.priority;
}

/**
 * Check if team has capacity for new assignments
 */
export function hasTeamCapacity(currentLoad: number, macrosetor: string): boolean {
  const config = getTeamConfigByMacrosetor(macrosetor);
  return currentLoad < config.maxCapacity;
}