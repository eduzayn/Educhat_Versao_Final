import { BaseFilterSelect, FilterOption } from './BaseFilterSelect';
import { Users } from 'lucide-react';

interface TeamFilterProps {
  value: string;
  onValueChange: (value: string) => void;
  teams?: any[];
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  includeAll?: boolean;
}

export function TeamFilter({
  value,
  onValueChange,
  teams = [],
  className = "",
  size = 'md',
  includeAll = true
}: TeamFilterProps) {
  const baseOptions: FilterOption[] = includeAll ? [
    { value: "all", label: "Todas as equipes" }
  ] : [];

  const defaultTeams: FilterOption[] = [
    { value: "comercial", label: "Comercial" },
    { value: "suporte", label: "Suporte" },
    { value: "cobranca", label: "Cobrança" },
    { value: "secretaria", label: "Secretaria" },
    { value: "tutoria", label: "Tutoria" },
    { value: "financeiro", label: "Financeiro" }
  ];

  // Usar equipes fornecidas ou padrão
  const teamOptions = teams.length > 0 
    ? teams.map(team => ({
        value: team.id?.toString() || team.name.toLowerCase(),
        label: team.name
      }))
    : defaultTeams;

  const allOptions = [
    ...baseOptions,
    ...teamOptions
  ];

  return (
    <BaseFilterSelect
      value={value}
      onValueChange={onValueChange}
      options={allOptions}
      placeholder="Equipe"
      icon={Users}
      className={className}
      size={size}
    />
  );
}