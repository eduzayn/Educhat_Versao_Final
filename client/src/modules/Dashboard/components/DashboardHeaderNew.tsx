import React from 'react';
import { PageHeader } from '../../../shared/components/PageHeader';
import { Plus, Settings } from 'lucide-react';

interface DashboardHeaderProps {
  title?: string;
  subtitle?: string;
  onCreateNew?: () => void;
  onSettings?: () => void;
}

export function DashboardHeader({
  title = "Dashboard",
  subtitle = "Visão geral do sistema",
  onCreateNew,
  onSettings
}: DashboardHeaderProps) {
  const actions: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'ghost';
    icon?: React.ReactNode;
  }> = [];
  
  if (onCreateNew) {
    actions.push({
      label: "Novo",
      onClick: onCreateNew,
      icon: <Plus className="h-4 w-4" />
    });
  }
  
  if (onSettings) {
    actions.push({
      label: "Configurações",
      onClick: onSettings,
      variant: "outline" as const,
      icon: <Settings className="h-4 w-4" />
    });
  }

  return (
    <PageHeader
      title={title}
      subtitle={subtitle}
      actions={actions}
    />
  );
}
