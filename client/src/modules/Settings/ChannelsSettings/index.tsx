import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/ui/card";
import { Button } from "@/shared/ui/ui/button";
import { Input } from "@/shared/ui/ui/input";
import { Label } from "@/shared/ui/ui/label";
import { Switch } from "@/shared/ui/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/ui/tabs";
import { Settings, MessageSquare, Phone, Mail } from "lucide-react";

export const ChannelsSettingsModule = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Configurações de Canais</h2>
        <p className="text-muted-foreground">
          Configure os canais de comunicação disponíveis no sistema
        </p>
      </div>

      <Tabs defaultValue="whatsapp" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="telegram">Telegram</TabsTrigger>
          <TabsTrigger value="email">E-mail</TabsTrigger>
          <TabsTrigger value="sms">SMS</TabsTrigger>
        </TabsList>

        <TabsContent value="whatsapp" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Configurações do WhatsApp
              </CardTitle>
              <CardDescription>
                Configure a integração com WhatsApp Business API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Ativar WhatsApp</Label>
                  <p className="text-sm text-muted-foreground">
                    Habilitar canal de comunicação via WhatsApp
                  </p>
                </div>
                <Switch />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="whatsapp-token">Token da API</Label>
                  <Input id="whatsapp-token" placeholder="Digite o token" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp-instance">ID da Instância</Label>
                  <Input id="whatsapp-instance" placeholder="Digite o ID da instância" />
                </div>
              </div>
              
              <Button>Testar Conexão</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="telegram" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Configurações do Telegram
              </CardTitle>
              <CardDescription>
                Configure a integração com Telegram Bot API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Ativar Telegram</Label>
                  <p className="text-sm text-muted-foreground">
                    Habilitar canal de comunicação via Telegram
                  </p>
                </div>
                <Switch />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="telegram-token">Token do Bot</Label>
                <Input id="telegram-token" placeholder="Digite o token do bot" type="password" />
              </div>
              
              <Button>Testar Conexão</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Configurações de E-mail
              </CardTitle>
              <CardDescription>
                Configure o servidor SMTP para envio de e-mails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Ativar E-mail</Label>
                  <p className="text-sm text-muted-foreground">
                    Habilitar canal de comunicação via e-mail
                  </p>
                </div>
                <Switch />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp-host">Servidor SMTP</Label>
                  <Input id="smtp-host" placeholder="smtp.gmail.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-port">Porta</Label>
                  <Input id="smtp-port" placeholder="587" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp-user">Usuário</Label>
                  <Input id="smtp-user" placeholder="seu@email.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp-pass">Senha</Label>
                  <Input id="smtp-pass" placeholder="Digite a senha" type="password" />
                </div>
              </div>
              
              <Button>Testar Conexão</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Configurações de SMS
              </CardTitle>
              <CardDescription>
                Configure o provedor de SMS para envio de mensagens
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Ativar SMS</Label>
                  <p className="text-sm text-muted-foreground">
                    Habilitar canal de comunicação via SMS
                  </p>
                </div>
                <Switch />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sms-sid">Account SID</Label>
                  <Input id="sms-sid" placeholder="Digite o SID" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sms-token">Auth Token</Label>
                  <Input id="sms-token" placeholder="Digite o token" type="password" />
                </div>
              </div>
              
              <Button>Testar Conexão</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};