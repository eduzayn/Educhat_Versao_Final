import { BaseFilterSelect, FilterOption } from './BaseFilterSelect';
import { Calendar } from 'lucide-react';

interface PeriodFilterProps {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  includeCustom?: boolean;
}

export function PeriodFilter({
  value,
  onValueChange,
  className = "",
  size = 'md',
  includeCustom = true
}: PeriodFilterProps) {
  const periodOptions: FilterOption[] = [
    { value: "7", label: "Últimos 7 dias" },
    { value: "30", label: "Últimos 30 dias" },
    { value: "90", label: "Últimos 90 dias" },
    { value: "365", label: "Último ano" },
    ...(includeCustom ? [{ value: "custom", label: "Personalizado" }] : [])
  ];

  return (
    <BaseFilterSelect
      value={value}
      onValueChange={onValueChange}
      options={periodOptions}
      placeholder="Período"
      icon={Calendar}
      className={className}
      size={size}
    />
  );
}