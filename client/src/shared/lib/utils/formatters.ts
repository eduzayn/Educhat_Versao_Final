/**
 * Client Formatting Utils - Redirects to shared module
 * @deprecated Use shared/formatters.ts instead
 */

// Import specific functions to avoid conflicts
export {
  formatPhoneForDisplay,
  formatPhoneNumber,
  formatCPF,
  formatDateBR,
  formatTimeBR,
  formatDateTimeBR,
  formatCurrency,
  formatNumber,
  formatPercentage,
  formatDurationMinutes,
  formatDurationSeconds,
  formatAudioTime,
  capitalizeWords,
  formatName,
  truncateText,
  formatInitials,
  formatFileSize
} from '../../../../../shared/formatters';

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(d);
}