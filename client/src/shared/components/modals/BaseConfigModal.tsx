
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { RefreshCw, Save, X } from 'lucide-react';

export interface TabConfig {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  content: React.ReactNode;
}

export interface BaseConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  tabs?: TabConfig[];
  children?: React.ReactNode;
  isLoading?: boolean;
  loadingText?: string;
  onSave?: () => void | Promise<void>;
  onCancel?: () => void;
  saveText?: string;
  cancelText?: string;
  showActions?: boolean;
  isSaving?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl';
  maxHeight?: string;
  className?: string;
}

export function BaseConfigModal({
  open,
  onOpenChange,
  title,
  description,
  icon: Icon,
  tabs,
  children,
  isLoading = false,
  loadingText = "Carregando...",
  onSave,
  onCancel,
  saveText = "Salvar",
  cancelText = "Cancelar",
  showActions = true,
  isSaving = false,
  maxWidth = "4xl",
  maxHeight = "80vh",
  className = ""
}: BaseConfigModalProps) {
  const [activeTab, setActiveTab] = React.useState(tabs?.[0]?.id || "");

  React.useEffect(() => {
    if (tabs && tabs.length > 0 && !activeTab) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTab]);

  const handleSave = async () => {
    if (onSave) {
      await onSave();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onOpenChange(false);
    }
  };

  const getMaxWidthClass = () => {
    const widthMap = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      '2xl': 'max-w-2xl',
      '3xl': 'max-w-3xl',
      '4xl': 'max-w-4xl',
      '5xl': 'max-w-5xl',
      '6xl': 'max-w-6xl',
      '7xl': 'max-w-7xl'
    };
    return widthMap[maxWidth];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={`${getMaxWidthClass()} overflow-y-auto ${className}`}
        style={{ maxHeight }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {Icon && <Icon className="h-5 w-5" />}
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription>
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>{loadingText}</span>
            </div>
          ) : tabs && tabs.length > 0 ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className={`grid w-full grid-cols-${Math.min(tabs.length, 6)}`}>
                {tabs.map((tab) => (
                  <TabsTrigger 
                    key={tab.id} 
                    value={tab.id} 
                    className="flex items-center gap-2"
                  >
                    {tab.icon && <tab.icon className="h-4 w-4" />}
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className="mt-6">
                {tabs.map((tab) => (
                  <TabsContent key={tab.id} value={tab.id} className="space-y-4">
                    {tab.content}
                  </TabsContent>
                ))}
              </div>
            </Tabs>
          ) : (
            children
          )}
        </div>

        {showActions && (
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleCancel}>
              <X className="h-4 w-4 mr-2" />
              {cancelText}
            </Button>
            {onSave && (
              <Button 
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {saveText}
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Componente de Card configurável para conteúdo dos modais
export interface ConfigCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function ConfigCard({ title, description, children, className = "" }: ConfigCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {children}
      </CardContent>
    </Card>
  );
}
