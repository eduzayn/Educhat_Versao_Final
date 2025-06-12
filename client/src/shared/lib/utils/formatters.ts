/**
 * Client Formatting Utils - Redirects to shared module
 * @deprecated Use shared/formatters.ts instead
 */

// Re-export from shared module
export * from '../../../../../shared/formatters';

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(d);
}

export function formatAudioTime(seconds: number): string {
  if (!seconds || seconds <= 0) return '0:00';

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}