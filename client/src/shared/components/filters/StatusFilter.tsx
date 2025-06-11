import { BaseFilterSelect, FilterOption } from './BaseFilterSelect';
import { Activity } from 'lucide-react';

interface StatusFilterProps {
  value: string;
  onValueChange: (value: string) => void;
  statusOptions?: FilterOption[];
  options?: FilterOption[];
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  includeAll?: boolean;
  type?: 'conversation' | 'activity' | 'user' | 'deal';
}

export function StatusFilter({
  value,
  onValueChange,
  statusOptions,
  options,
  className = "",
  size = 'md',
  includeAll = true,
  type = 'conversation'
}: StatusFilterProps) {
  const baseOptions: FilterOption[] = includeAll ? [
    { value: "all", label: "Todos os status" }
  ] : [];

  const getDefaultOptions = (): FilterOption[] => {
    switch (type) {
      case 'conversation':
        return [
          { value: "open", label: "Aberta" },
          { value: "pending", label: "Pendente" },
          { value: "resolved", label: "Resolvida" }
        ];
      case 'activity':
        return [
          { value: "completed", label: "Concluídas" },
          { value: "scheduled", label: "Agendadas" },
          { value: "pending", label: "Pendentes" },
          { value: "cancelled", label: "Canceladas" }
        ];
      case 'user':
        return [
          { value: "active", label: "Ativo" },
          { value: "inactive", label: "Inativo" },
          { value: "pending", label: "Pendente" }
        ];
      case 'deal':
        return [
          { value: "open", label: "Aberto" },
          { value: "won", label: "Ganho" },
          { value: "lost", label: "Perdido" },
          { value: "postponed", label: "Adiado" }
        ];
      default:
        return [];
    }
  };

  const finalOptions = options || statusOptions || getDefaultOptions();
  const allOptions = [...baseOptions, ...finalOptions];

  return (
    <BaseFilterSelect
      value={value}
      onValueChange={onValueChange}
      options={allOptions}
      placeholder="Status"
      icon={Activity}
      className={className}
      size={size}
    />
  );
}