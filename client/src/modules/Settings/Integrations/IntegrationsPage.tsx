import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { BackButton } from '@/shared/components/BackButton';
import { Settings, Key, MessageSquare, Facebook, Instagram } from 'lucide-react';
import { IntegrationsSettingsTab } from './components/IntegrationsSettingsTab';
import { ApiKeysTab } from './components/ApiKeysTab';

export default function IntegrationsPage() {
  return (
    <div className="min-h-screen bg-educhat-light">
      <div className="p-6 space-y-6">
        <BackButton to="/settings" label="Voltar às Configurações" />
        
        <div className="flex items-center gap-3">
          <Settings className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold">Integrações</h2>
            <p className="text-muted-foreground">
              Configure APIs, serviços externos e integrações do sistema
            </p>
          </div>
        </div>

        <Tabs defaultValue="apis" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="apis" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Chaves de API
            </TabsTrigger>
            <TabsTrigger value="messaging" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Mensageria
            </TabsTrigger>
            <TabsTrigger value="social" className="flex items-center gap-2">
              <Facebook className="h-4 w-4" />
              Redes Sociais
            </TabsTrigger>
          </TabsList>

          <TabsContent value="apis" className="space-y-6">
            <ApiKeysTab />
          </TabsContent>

          <TabsContent value="messaging" className="space-y-6">
            <IntegrationsSettingsTab />
          </TabsContent>

          <TabsContent value="social" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Facebook className="h-5 w-5 text-blue-600" />
                  <Instagram className="h-5 w-5 text-pink-600" />
                  Facebook & Instagram
                </CardTitle>
                <CardDescription>
                  Configure integrações com Facebook Messenger e Instagram Direct
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Para configurar as integrações com Facebook e Instagram, 
                  <a href="/settings/integrations/facebook" className="text-primary hover:underline ml-1">
                    acesse a página específica
                  </a>
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}