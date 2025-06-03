import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/ui/tabs';
import { Users, Shield, UserCheck, Settings } from 'lucide-react';
import { BackButton } from '@/shared/components/BackButton';
import { UsersTab } from './components/UsersTab';
import { RolesTab } from './components/RolesTab';
import { TeamsTab } from './components/TeamsTab';
import { PermissionsTab } from './components/PermissionsTab';

export const UsersSettingsPage = () => {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div className="space-y-6">
      <BackButton to="/settings" label="Voltar às Configurações" />
      
      <div>
        <h2 className="text-2xl font-bold">Gerenciamento de Usuários</h2>
        <p className="text-muted-foreground">
          Configure usuários, funções, equipes e permissões do sistema
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Funções
          </TabsTrigger>
          <TabsTrigger value="teams" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Equipes
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Permissões
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UsersTab />
        </TabsContent>

        <TabsContent value="roles">
          <RolesTab />
        </TabsContent>

        <TabsContent value="teams">
          <TeamsTab />
        </TabsContent>

        <TabsContent value="permissions">
          <PermissionsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};