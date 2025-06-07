/**
 * Utilitários para componentes reutilizáveis
 */

import { ReactNode } from 'react';

// Loading state configuration
export const getLoadingConfig = (message = "Carregando...") => ({
  message,
  className: "flex items-center justify-center h-64"
});

// Empty state configuration  
export const getEmptyStateConfig = (
  title: string,
  description: string,
  icon?: string
) => ({
  title,
  description,
  icon,
  className: "text-center py-12"
});

// Error state configuration
export const getErrorStateConfig = (
  title = "Erro ao carregar dados",
  description = "Ocorreu um erro inesperado. Tente novamente."
) => ({
  title,
  description,
  className: "text-center py-12"
});

// Grid layout configuration
export const getGridConfig = (columns = "grid-cols-1 md:grid-cols-2 lg:grid-cols-3") => ({
  className: `grid gap-4 ${columns}`
});

// Skeleton loader configuration
export const getSkeletonConfig = (
  rows = 4,
  className = "h-4 bg-gray-300 rounded"
) => ({
  rows,
  className,
  containerClass: "animate-pulse space-y-4"
});