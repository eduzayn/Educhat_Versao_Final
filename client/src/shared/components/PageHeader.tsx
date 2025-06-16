import React from 'react';
import { Button } from '../ui/button';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  icon?: React.ReactNode;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  actions?: PageHeaderAction[];
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  showBackButton = false,
  onBack,
  actions = [],
  children,
  className = ''
}: PageHeaderProps) {
  return (
    <header className={`bg-white border-b border-gray-200 px-6 py-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {showBackButton && onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="p-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
            {subtitle && (
              <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'default'}
              onClick={action.onClick}
              className="flex items-center gap-2"
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
          {children}
        </div>
      </div>
    </header>
  );
}
