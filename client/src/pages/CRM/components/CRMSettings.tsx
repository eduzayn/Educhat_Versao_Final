import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/ui/dialog';
import { Button } from '@/shared/ui/ui/button';
import { Input } from '@/shared/ui/ui/input';
import { Label } from '@/shared/ui/ui/label';
import { Switch } from '@/shared/ui/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/ui/card';
import { Separator } from '@/shared/ui/ui/separator';
// Implementação simplificada do toast para evitar dependências
const useToast = () => ({
  toast: (props: any) => console.log('Toast:', props)
});

// Implementação simplificada do queryClient
const queryClient = {
  invalidateQueries: (props: any) => console.log('Invalidating queries:', props)
};

const apiRequest = async (url: string, options?: any) => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    },
    ...options
  });
  return response.json();
};
import {
  Settings,
  Database,
  Users,
  MessageSquare,
  Target,
  RefreshCw
} from "lucide-react";

interface SystemSetting {
  id: number;
  key: string;
  value: string;
  type: string;
  description: string;
  category: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface CRMSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CRMSettings({ open, onOpenChange }: CRMSettingsProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");

  // Buscar configurações do sistema
  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/system-settings'],
    enabled: open,
  });

  // Mutation para atualizar configuração
  const updateSettingMutation = useMutation({
    mutationFn: async ({ id, value, is_enabled }: { id: number; value?: string; is_enabled?: boolean }) => {
      return apiRequest(`/api/system-settings/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ value, is_enabled }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/system-settings'] });
      toast({
        title: "Configuração atualizada",
        description: "As alterações foram salvas com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    },
  });

  const handleSettingUpdate = (id: number, value?: string, is_enabled?: boolean) => {
    updateSettingMutation.mutate({ id, value, is_enabled });
  };

  const getSettingsByCategory = (category: string) => {
    return (settings || []).filter((setting: SystemSetting) => setting.category === category);
  };

  const renderSettingInput = (setting: SystemSetting) => {
    const handleChange = (newValue: string | boolean) => {
      if (typeof newValue === 'boolean') {
        handleSettingUpdate(setting.id, undefined, newValue);
      } else {
        handleSettingUpdate(setting.id, newValue);
      }
    };

    switch (setting.type) {
      case 'boolean':
        return (
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">{setting.description}</Label>
              <div className="text-sm text-muted-foreground">
                Chave: {setting.key}
              </div>
            </div>
            <Switch
              checked={setting.is_enabled}
              onCheckedChange={handleChange}
            />
          </div>
        );
      case 'number':
        return (
          <div className="space-y-2">
            <Label htmlFor={setting.key}>{setting.description}</Label>
            <Input
              id={setting.key}
              type="number"
              value={setting.value}
              onChange={(e) => handleChange(e.target.value)}
              className="w-full"
            />
            <div className="text-sm text-muted-foreground">
              Chave: {setting.key}
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-2">
            <Label htmlFor={setting.key}>{setting.description}</Label>
            <Input
              id={setting.key}
              value={setting.value}
              onChange={(e) => handleChange(e.target.value)}
              className="w-full"
            />
            <div className="text-sm text-muted-foreground">
              Chave: {setting.key}
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações do CRM
          </DialogTitle>
          <DialogDescription>
            Gerencie as configurações do sistema, equipes, notificações e integrações.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Geral
            </TabsTrigger>
            <TabsTrigger value="database" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Banco
            </TabsTrigger>
            <TabsTrigger value="teams" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Equipes
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Notificações
            </TabsTrigger>
            <TabsTrigger value="deals" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Negócios
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <RefreshCw className="h-6 w-6 animate-spin" />
                <span className="ml-2">Carregando configurações...</span>
              </div>
            ) : (
              <>
                <TabsContent value="general" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Configurações Gerais</CardTitle>
                      <CardDescription>
                        Configurações básicas do sistema CRM
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {getSettingsByCategory('general').map((setting: SystemSetting) => (
                        <div key={setting.id}>
                          {renderSettingInput(setting)}
                          <Separator className="mt-4" />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="database" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Configurações de Banco de Dados</CardTitle>
                      <CardDescription>
                        Configurações relacionadas ao armazenamento de dados
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {getSettingsByCategory('database').map((setting: SystemSetting) => (
                        <div key={setting.id}>
                          {renderSettingInput(setting)}
                          <Separator className="mt-4" />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="teams" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Configurações de Equipes</CardTitle>
                      <CardDescription>
                        Configurações de atribuição automática e gestão de equipes
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {getSettingsByCategory('teams').map((setting: SystemSetting) => (
                        <div key={setting.id}>
                          {renderSettingInput(setting)}
                          <Separator className="mt-4" />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="notifications" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Configurações de Notificações</CardTitle>
                      <CardDescription>
                        Configurações de alertas e notificações do sistema
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {getSettingsByCategory('notifications').map((setting: SystemSetting) => (
                        <div key={setting.id}>
                          {renderSettingInput(setting)}
                          <Separator className="mt-4" />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="deals" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Configurações de Negócios</CardTitle>
                      <CardDescription>
                        Configurações do funil de vendas e gestão de negócios
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {getSettingsByCategory('deals').map((setting: SystemSetting) => (
                        <div key={setting.id}>
                          {renderSettingInput(setting)}
                          <Separator className="mt-4" />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>
              </>
            )}
          </div>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['/api/system-settings'] });
              toast({
                title: "Configurações recarregadas",
                description: "As configurações foram atualizadas.",
              });
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Recarregar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}