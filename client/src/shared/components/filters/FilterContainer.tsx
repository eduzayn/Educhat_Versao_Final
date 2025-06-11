import { ReactNode } from 'react';
import { Button } from '@/shared/ui/button';
import { Filter } from 'lucide-react';

interface FilterContainerProps {
  children: ReactNode;
  title?: string;
  description?: string;
  orientation?: 'horizontal' | 'vertical';
  spacing?: 'sm' | 'md' | 'lg';
  showMoreFilters?: boolean;
  onMoreFilters?: () => void;
  className?: string;
}

export function FilterContainer({
  children,
  title,
  description,
  orientation = 'horizontal',
  spacing = 'md',
  showMoreFilters = false,
  onMoreFilters,
  className = ""
}: FilterContainerProps) {
  const spacingClasses = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6'
  };

  const orientationClasses = {
    horizontal: `flex flex-wrap items-center ${spacingClasses[spacing]}`,
    vertical: `flex flex-col ${spacingClasses[spacing]}`
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {(title || description) && (
        <div>
          {title && <h3 className="text-sm font-medium">{title}</h3>}
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
      )}
      
      <div className={orientationClasses[orientation]}>
        {children}
        {showMoreFilters && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={onMoreFilters}
            className="shrink-0"
          >
            <Filter className="w-4 h-4 mr-2" />
            Mais Filtros
          </Button>
        )}
      </div>
    </div>
  );
}