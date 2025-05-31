import { useState, useEffect } from 'react';
import { Copy, CheckCircle, Globe } from 'lucide-react';

export function WebhookConfigPage() {
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Definir a URL do webhook diretamente
    setWebhookUrl('https://omni-communicate-magonder.replit.app/api/zapi/webhook');
  }, []);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configuração do Webhook</h1>
        <p className="text-muted-foreground">
          Configure o webhook para receber mensagens do WhatsApp em tempo real
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            URL do Webhook
          </CardTitle>
          <CardDescription>
            Use esta URL para configurar o webhook na Z-API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input 
              value={webhookUrl} 
              readOnly 
              className="font-mono text-sm"
            />
            <Button 
              onClick={copyToClipboard}
              variant="outline"
              size="icon"
            >
              {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={updateWebhook}
              disabled={isUpdating}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              {isUpdating ? 'Configurando...' : 'Configurar Automaticamente'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instruções de Configuração Manual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Badge variant="secondary" className="mt-1">1</Badge>
              <div>
                <p className="font-medium">Acesse o painel da Z-API</p>
                <p className="text-sm text-muted-foreground">
                  Faça login no painel da Z-API e vá para as configurações da sua instância
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Badge variant="secondary" className="mt-1">2</Badge>
              <div>
                <p className="font-medium">Configure o webhook "Ao receber"</p>
                <p className="text-sm text-muted-foreground">
                  Na seção "Ao receber", cole a URL do webhook copiada acima
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Badge variant="secondary" className="mt-1">3</Badge>
              <div>
                <p className="font-medium">Ative as opções necessárias</p>
                <p className="text-sm text-muted-foreground">
                  Marque "Notificar ao enviar por mim também" se quiser ver suas próprias mensagens
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Badge variant="secondary" className="mt-1">4</Badge>
              <div>
                <p className="font-medium">Teste o webhook</p>
                <p className="text-sm text-muted-foreground">
                  Envie uma mensagem de teste no WhatsApp para verificar se está funcionando
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <Settings className="h-4 w-4" />
        <AlertDescription>
          <strong>Importante:</strong> O webhook só funcionará se sua instância Z-API estiver conectada e ativa. 
          Verifique o status da conexão na página de configurações.
        </AlertDescription>
      </Alert>
    </div>
  );
}

export default WebhookConfigPage;