import { useState, useEffect } from 'react';
import { Copy, CheckCircle, Globe } from 'lucide-react';
import { BackButton } from '@/shared/components/BackButton';

export function WebhookConfigPage() {
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Definir a URL do webhook diretamente
    setWebhookUrl('https://24df23a6-4c36-4bba-9bde-863f20db5290-00-220357sbu278p.kirk.replit.dev/api/zapi/webhook');
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
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <BackButton to="/settings" label="Voltar às Configurações" />
      
      <div>
        <h1 className="text-3xl font-bold mb-2">Configuração do Webhook Z-API</h1>
        <p className="text-gray-600">
          Configure o webhook para receber mensagens do WhatsApp em tempo real
        </p>
      </div>

      <div className="bg-white rounded-lg border shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-semibold">URL do Webhook</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <input 
              value={webhookUrl} 
              readOnly 
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md font-mono text-sm bg-gray-50"
            />
            <button 
              onClick={copyToClipboard}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Instruções de Configuração</h2>
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">1</div>
            <div>
              <p className="font-medium">Acesse o painel da Z-API</p>
              <p className="text-sm text-gray-600">
                Faça login no painel da Z-API e vá para as configurações da sua instância
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">2</div>
            <div>
              <p className="font-medium">Configure o webhook "Ao receber"</p>
              <p className="text-sm text-gray-600">
                Na seção "Ao receber", cole a URL do webhook copiada acima
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">3</div>
            <div>
              <p className="font-medium">Ative as opções necessárias</p>
              <p className="text-sm text-gray-600">
                Marque "Notificar ao enviar por mim também" se quiser ver suas próprias mensagens
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold">4</div>
            <div>
              <p className="font-medium">Teste o webhook</p>
              <p className="text-sm text-gray-600">
                Envie uma mensagem de teste no WhatsApp para verificar se está funcionando
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-2">
          <Globe className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="font-medium text-blue-900">Importante</p>
            <p className="text-sm text-blue-800">
              O webhook só funcionará se sua instância Z-API estiver conectada e ativa. 
              Verifique o status da conexão na página de configurações.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WebhookConfigPage;