import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Settings, ArrowLeft, Save } from 'lucide-react';
import React from 'react';

interface ConfigHeaderProps {
  isActive: boolean;
  onBack: () => void;
  onSave?: () => void;
  isSaving?: boolean;
}

export function ConfigHeader({ isActive, onBack, onSave, isSaving }: ConfigHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onBack}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Settings className="h-8 w-8 text-purple-600" />
            Configurações da Prof. Ana
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure as integrações e comportamento da assistente IA educacional
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant={isActive ? "default" : "secondary"} className="text-sm">
          {isActive ? "Ativa" : "Inativa"}
        </Badge>
        {onSave && (
          <Button 
            onClick={onSave}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Salvando..." : "Salvar"}
          </Button>
        )}
      </div>
    </div>
  );
} 