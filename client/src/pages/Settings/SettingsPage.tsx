import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/ui/tabs';
import { Users, Settings, Shield, Zap, Globe } from 'lucide-react';
import { UsersSettingsPage } from './Users/UsersSettingsPage';
import { SystemSettingsTab } from './System/components/SystemSettingsTab';
import { SecuritySettingsTab } from './Security/components/SecuritySettingsTab';
import { IntegrationsSettingsTab } from './Integrations/components/IntegrationsSettingsTab';
import { GeneralSettingsTab } from './General/components/GeneralSettingsTab';

export const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações do Sistema</h1>
        <p className="text-muted-foreground">
          Gerencie todas as configurações da plataforma
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Sistema
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Segurança
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Integrações
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Geral
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UsersSettingsPage />
        </TabsContent>

        <TabsContent value="system">
          <SystemSettingsTab />
        </TabsContent>

        <TabsContent value="security">
          <SecuritySettingsTab />
        </TabsContent>

        <TabsContent value="integrations">
          <IntegrationsSettingsTab />
        </TabsContent>

        <TabsContent value="general">
          <GeneralSettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};