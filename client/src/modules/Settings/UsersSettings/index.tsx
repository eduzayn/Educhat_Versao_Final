import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/ui/tabs';
import { Users, Shield, Building2, Key } from 'lucide-react';
import { UsersTab } from './components/UsersTab';
import { RolesTab } from './components/RolesTab';
import { TeamsTab } from './components/TeamsTab';
import { PermissionsTab } from './components/PermissionsTab';

export const UsersSettings = () => {
  const [activeTab, setActiveTab] = useState("users");
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <CardTitle>Gerenciamento de Usuários</CardTitle>
        </div>
        <CardDescription>
          Configure usuários, funções e organize equipes para otimizar o trabalho colaborativo
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
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
              <Building2 className="h-4 w-4" />
              Equipes
            </TabsTrigger>
            <TabsTrigger value="permissions" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
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
      </CardContent>
    </Card>
  );
};