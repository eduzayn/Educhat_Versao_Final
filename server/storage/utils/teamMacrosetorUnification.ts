/**
 * Team Configuration Utilities
 * Centralized team configurations and utilities
 */

export interface TeamConfig {
  id: number;
  name: string;
  teamType: string;
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

// Standard team configurations
export const TEAM_CONFIGS = {
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
 * Get team configuration by team type
 */
export function getTeamConfigByType(teamType: string): any {
  return TEAM_CONFIGS[teamType as keyof typeof TEAM_CONFIGS] || TEAM_CONFIGS.geral;
}

/**
 * Get all available team types
 */
export function getAllTeamTypes(): string[] {
  return Object.keys(TEAM_CONFIGS);
}

/**
 * Normalize team identifier
 */
export function normalizeTeamId(identifier: string | number): string {
  if (typeof identifier === 'number') {
    return identifier.toString();
  }
  return identifier.toLowerCase();
}

/**
 * Check if a team type is valid
 */
export function isValidTeamType(teamType: string): boolean {
  return Object.keys(TEAM_CONFIGS).includes(teamType);
}

// Aliases para compatibilidade com nomenclatura antiga (macrosetor → teamType)
export const MACROSETOR_CONFIGS = TEAM_CONFIGS;
export const getTeamConfigByMacrosetor = getTeamConfigByType;
export const getAllMacrosetores = getAllTeamTypes;
export const isValidMacrosetor = isValidTeamType;

/**
 * Get team priority for assignment
 */
export function getTeamPriority(teamType: string): number {
  const config = getTeamConfigByType(teamType);
  return config.priority;
}

/**
 * Check if team has capacity for new assignments
 */
export function hasTeamCapacity(currentLoad: number, teamType: string): boolean {
  const config = getTeamConfigByType(teamType);
  return currentLoad < config.maxCapacity;
}