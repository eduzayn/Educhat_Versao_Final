import React from 'react';
import { PageHeader } from '../../../shared/components/PageHeader';
import { Save, ArrowLeft } from 'lucide-react';

interface ConfigHeaderProps {
  title?: string;
  subtitle?: string;
  onSave?: () => void;
  onBack?: () => void;
  showBackButton?: boolean;
}

export function ConfigHeader({
  title = "Configurações de IA",
  subtitle = "Configure os parâmetros da inteligência artificial",
  onSave,
  onBack,
  showBackButton = false
}: ConfigHeaderProps) {
  const actions: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'ghost';
    icon?: React.ReactNode;
  }> = [];
  
  if (onSave) {
    actions.push({
      label: "Salvar",
      onClick: onSave,
      icon: <Save className="h-4 w-4" />
    });
  }

  return (
    <PageHeader
      title={title}
      subtitle={subtitle}
      showBackButton={showBackButton}
      onBack={onBack}
      actions={actions}
    />
  );
}
