import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/ui/tabs';
import { SettingsLayout } from '@/shared/components/Settings/SettingsLayout';
import { BackButton } from '@/shared/components/BackButton';
import { WhatsAppTab } from './components/WhatsAppTab';
import { InstagramTab } from './components/InstagramTab';
import { EmailTab } from './components/EmailTab';
import { WebhooksTab } from './components/WebhooksTab';

export function ChannelsSettingsPage() {
  const [activeTab, setActiveTab] = useState('whatsapp');

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <BackButton to="/settings" label="Voltar às Configurações" />
        
        <div>
          <h1 className="text-3xl font-bold">Configurações de Canais</h1>
          <p className="text-muted-foreground mt-2">
            Configure e gerencie seus canais de comunicação e integrações
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
                <TabsTrigger value="instagram">Instagram</TabsTrigger>
                <TabsTrigger value="email">E-mail</TabsTrigger>
                <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
              </TabsList>

              <TabsContent value="whatsapp" className="space-y-6">
                <WhatsAppTab />
              </TabsContent>

              <TabsContent value="instagram" className="space-y-6">
                <InstagramTab />
              </TabsContent>

              <TabsContent value="email" className="space-y-6">
                <EmailTab />
              </TabsContent>

              <TabsContent value="webhooks" className="space-y-6">
                <WebhooksTab />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </SettingsLayout>
  );
}