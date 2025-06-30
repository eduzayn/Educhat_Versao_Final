// Função utilitária para gerar cores consistentes para usuários
// Baseada no sistema das equipes para manter consistência visual

const USER_COLORS = [
  '#3B82F6', // blue-500
  '#10B981', // emerald-500
  '#F59E0B', // amber-500
  '#EF4444', // red-500
  '#8B5CF6', // violet-500
  '#06B6D4', // cyan-500
  '#84CC16', // lime-500
  '#F97316', // orange-500
  '#EC4899', // pink-500
  '#6366F1', // indigo-500
  '#14B8A6', // teal-500
  '#A855F7', // purple-500
  '#22C55E', // green-500
  '#DC2626', // red-600
  '#7C3AED', // violet-600
  '#0EA5E9', // sky-500
  '#65A30D', // lime-600
  '#D97706', // amber-600
  '#BE185D', // pink-700
  '#4338CA', // indigo-700
];

/**
 * Gera uma cor consistente baseada no ID do usuário
 * @param userId ID do usuário
 * @param existingColor Cor existente do usuário (se já definida)
 * @returns Cor hexadecimal (#RRGGBB)
 */
export function getUserColor(userId: number, existingColor?: string | null): string {
  // Se já tem cor definida, usa ela
  if (existingColor && existingColor.startsWith('#')) {
    return existingColor;
  }
  
  // Gera cor baseada no ID do usuário para consistência
  const colorIndex = userId % USER_COLORS.length;
  return USER_COLORS[colorIndex];
}

/**
 * Gera uma cor aleatória para novos usuários
 * @returns Cor hexadecimal (#RRGGBB)
 */
export function generateRandomUserColor(): string {
  const randomIndex = Math.floor(Math.random() * USER_COLORS.length);
  return USER_COLORS[randomIndex];
}

/**
 * Verifica se uma cor é válida (formato #RRGGBB)
 * @param color Cor a ser validada
 * @returns true se válida, false caso contrário
 */
export function isValidColor(color: string): boolean {
  return /^#[0-9A-F]{6}$/i.test(color);
}