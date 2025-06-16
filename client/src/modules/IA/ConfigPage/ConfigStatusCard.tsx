import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Label } from '@/shared/ui/label';
import { Switch } from '@/shared/ui/switch';
import { Brain } from 'lucide-react';
import React from 'react';

interface ConfigStatusCardProps {
  isActive: boolean;
  onToggle: (checked: boolean) => void;
}

export function ConfigStatusCard({ isActive, onToggle }: ConfigStatusCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Status da Prof. Ana
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="active-switch">Assistente ativa</Label>
            <p className="text-sm text-muted-foreground">
              Ativar ou desativar a Prof. Ana completamente
            </p>
          </div>
          <Switch
            id="active-switch"
            checked={isActive}
            onCheckedChange={onToggle}
          />
        </div>
      </CardContent>
    </Card>
  );
} 