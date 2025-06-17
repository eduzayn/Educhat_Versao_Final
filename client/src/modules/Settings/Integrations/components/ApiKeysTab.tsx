import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Badge } from '@/shared/ui/badge';
import { Eye, EyeOff, Mail, TestTube, CheckCircle, XCircle, Save } from 'lucide-react';
import { useToast } from '@/shared/lib/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface ApiConfig {
  sendgridApiKey: string;
  isActive: boolean;
}

export function ApiKeysTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<ApiConfig>({
    sendgridApiKey: '',
    isActive: false
  });
  
  const [showKeys, setShowKeys] = useState({
    sendgrid: false
  });
  
  const [testResults, setTestResults] = useState({
    sendgrid: null as boolean | null
  });

  // Buscar configurações existentes
  const { data: config, isLoading } = useQuery({
    queryKey: ['/api/settings/integrations/apis'],
    queryFn: async () => {
      const response = await fetch('/api/settings/integrations/apis', {
        credentials: 'include'
      });
      if (!response.ok) {
        if (response.status === 404) {
          return { sendgridApiKey: '', isActive: false };
        }
        throw new Error('Falha ao carregar configurações');
      }
      return response.json() as Promise<ApiConfig>;
    }
  });

  // Mutation para salvar configurações
  const saveConfigMutation = useMutation({
    mutationFn: async (data: ApiConfig) => {
      const response = await fetch('/api/settings/integrations/apis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Falha ao salvar configurações');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Configurações salvas",
        description: "As chaves de API foram salvas com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/settings/integrations/apis'] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao salvar configurações. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Mutation para testar SendGrid
  const testSendGridMutation = useMutation({
    mutationFn: async (apiKey: string) => {
      const response = await fetch('/api/settings/integrations/apis/test-sendgrid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ apiKey }),
      });
      
      const result = await response.json();
      return result;
    },
    onSuccess: (result) => {
      setTestResults(prev => ({ ...prev, sendgrid: result.success }));
      if (result.success) {
        toast({
          title: "Teste bem-sucedido",
          description: "Conexão com SendGrid estabelecida com sucesso.",
        });
      } else {
        toast({
          title: "Teste falhou",
          description: result.message || "Falha na conexão com SendGrid.",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      setTestResults(prev => ({ ...prev, sendgrid: false }));
      toast({
        title: "Erro no teste",
        description: "Falha ao testar conexão com SendGrid.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

  const handleSave = () => {
    saveConfigMutation.mutate(formData);
  };

  const handleTestSendGrid = () => {
    if (!formData.sendgridApiKey.trim()) {
      toast({
        title: "Erro",
        description: "Informe a chave da API do SendGrid antes de testar.",
        variant: "destructive",
      });
      return;
    }
    testSendGridMutation.mutate(formData.sendgridApiKey);
  };

  const maskApiKey = (key: string, show: boolean) => {
    if (!key) return '';
    if (show) return key;
    return key.length > 8 ? `${key.slice(0, 4)}${'•'.repeat(key.length - 8)}${key.slice(-4)}` : '•'.repeat(key.length);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              Carregando configurações...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* SendGrid Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            SendGrid
          </CardTitle>
          <CardDescription>
            Configure a API do SendGrid para envio de emails transacionais
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Status da Integração</Label>
              <p className="text-sm text-muted-foreground">
                {formData.sendgridApiKey ? 'SendGrid configurado' : 'SendGrid não configurado'}
              </p>
            </div>
            <Badge variant={formData.sendgridApiKey ? "default" : "secondary"} 
                   className={formData.sendgridApiKey ? "bg-green-100 text-green-800" : ""}>
              {formData.sendgridApiKey ? 'Configurado' : 'Não configurado'}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="sendgrid-key">Chave da API</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="sendgrid-key"
                  type={showKeys.sendgrid ? "text" : "password"}
                  value={maskApiKey(formData.sendgridApiKey, showKeys.sendgrid)}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData(prev => ({ ...prev, sendgridApiKey: value }));
                    setTestResults(prev => ({ ...prev, sendgrid: null }));
                  }}
                  placeholder="SG.xxxxxxxxxxxx..."
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowKeys(prev => ({ ...prev, sendgrid: !prev.sendgrid }))}
                >
                  {showKeys.sendgrid ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleTestSendGrid}
                disabled={testSendGridMutation.isPending || !formData.sendgridApiKey.trim()}
                className="flex items-center gap-2"
              >
                <TestTube className="h-4 w-4" />
                {testSendGridMutation.isPending ? 'Testando...' : 'Testar'}
              </Button>
            </div>
            
            {testResults.sendgrid !== null && (
              <div className={`flex items-center gap-2 text-sm ${
                testResults.sendgrid ? 'text-green-600' : 'text-red-600'
              }`}>
                {testResults.sendgrid ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Conexão estabelecida com sucesso
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4" />
                    Falha na conexão
                  </>
                )}
              </div>
            )}
          </div>
          
          <div className="text-xs text-muted-foreground">
            <p>Para obter sua chave da API do SendGrid:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Acesse <a href="https://sendgrid.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">sendgrid.com</a> e faça login</li>
              <li>Vá em Settings → API Keys</li>
              <li>Clique em "Create API Key" e escolha "Full Access"</li>
              <li>Copie a chave gerada (começa com "SG.")</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={saveConfigMutation.isPending}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {saveConfigMutation.isPending ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </div>
    </div>
  );
}