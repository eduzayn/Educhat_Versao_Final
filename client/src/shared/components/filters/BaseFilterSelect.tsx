import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { LucideIcon } from 'lucide-react';

export interface FilterOption {
  value: string;
  label: string;
  icon?: LucideIcon;
}

interface BaseFilterSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: FilterOption[];
  placeholder?: string;
  icon?: LucideIcon;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function BaseFilterSelect({
  value,
  onValueChange,
  options,
  placeholder = "Selecionar",
  icon: Icon,
  className = "",
  size = 'md',
  showIcon = true
}: BaseFilterSelectProps) {
  const sizeClasses = {
    sm: "h-8 text-xs",
    md: "h-10 text-sm",
    lg: "h-12 text-base"
  };

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={`${sizeClasses[size]} ${className}`}>
        {showIcon && Icon && <Icon className="w-3 h-3 mr-1" />}
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.icon && <option.icon className="w-4 h-4 mr-2 inline" />}
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}