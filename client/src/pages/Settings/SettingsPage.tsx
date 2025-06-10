import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/shared/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import { useToast } from '@/shared/lib/hooks/use-toast';
import { Badge } from '@/shared/ui/badge';
import { Eye, EyeOff, Key, Bot, Search, Check, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

const secretsSchema = z.object({
  openaiKey: z.string().min(1, 'OpenAI API Key é obrigatória'),
  perplexityKey: z.string().optional(),
});

type SecretsForm = z.infer<typeof secretsSchema>;

interface SecretStatus {
  name: string;
  isConfigured: boolean;
  isWorking: boolean;
  lastTested?: string;
}

export default function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const form = useForm<SecretsForm>({
    resolver: zodResolver(secretsSchema),
    defaultValues: {
      openaiKey: '',
      perplexityKey: '',
    },
  });

  // Buscar status das secrets
  const { data: secretsStatus, isLoading } = useQuery({
    queryKey: ['/api/settings/secrets/status'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/settings/secrets/status');
      return response;
    },
  });

  // Mutation para salvar secrets
  const saveSecretsMutation = useMutation({
    mutationFn: async (data: SecretsForm) => {
      return await apiRequest('POST', '/api/settings/secrets', data);
    },
    onSuccess: () => {
      toast({
        title: "Configurações salvas",
        description: "As chaves de API foram configuradas com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/settings/secrets/status'] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive",
      });
    },
  });

  // Mutation para testar APIs
  const testApisMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/settings/secrets/test');
    },
    onSuccess: (data: any) => {
      const workingCount = data.working || 0;
      const totalCount = data.total || 0;
      
      toast({
        title: "Teste concluído",
        description: `${workingCount}/${totalCount} APIs funcionando corretamente.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/settings/secrets/status'] });
    },
    onError: () => {
      toast({
        title: "Erro no teste",
        description: "Não foi possível testar as APIs.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SecretsForm) => {
    saveSecretsMutation.mutate(data);
  };

  const toggleShowKey = (key: string) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderSecretField = (
    name: keyof SecretsForm,
    label: string,
    description: string,
    icon: React.ReactNode,
    placeholder: string
  ) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="flex items-center gap-2">
            {icon}
            {label}
          </FormLabel>
          <FormDescription>{description}</FormDescription>
          <FormControl>
            <div className="relative">
              <Input
                {...field}
                type={showKeys[name] ? 'text' : 'password'}
                placeholder={placeholder}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => toggleShowKey(name)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showKeys[name] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  // Mapear status das secrets
  const secrets = Array.isArray(secretsStatus) ? secretsStatus.map((secret: any) => ({
    name: secret.name,
    isConfigured: secret.isConfigured,
    isWorking: secret.isWorking,
    lastTested: secret.lastTested
  })) : [];

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-600 mt-2">Configure as integrações de IA para a Prof. Ana</p>
      </div>

      <Tabs defaultValue="apis" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="apis" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            APIs & Integrações
          </TabsTrigger>
          <TabsTrigger value="ai-config" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Configurações da IA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="apis" className="space-y-6">
          {/* Status das APIs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Status das APIs
              </CardTitle>
              <CardDescription>
                Verifique o status das integrações de IA configuradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {secrets.length > 0 ? (
                  secrets.map((secret: SecretStatus) => (
                    <div key={secret.name} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {secret.name === 'OpenAI API Key' ? (
                          <Bot className="h-5 w-5 text-blue-500" />
                        ) : (
                          <Search className="h-5 w-5 text-purple-500" />
                        )}
                        <div>
                          <h4 className="font-medium">{secret.name}</h4>
                          {secret.lastTested && (
                            <p className="text-sm text-gray-500">
                              Último teste: {new Date(secret.lastTested).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={secret.isConfigured ? "default" : "secondary"}>
                          {secret.isConfigured ? "Configurada" : "Não configurada"}
                        </Badge>
                        {secret.isConfigured && (
                          <Badge variant={secret.isWorking ? "default" : "destructive"}>
                            {secret.isWorking ? (
                              <Check className="h-3 w-3 mr-1" />
                            ) : (
                              <X className="h-3 w-3 mr-1" />
                            )}
                            {secret.isWorking ? "Funcionando" : "Com problemas"}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    {isLoading ? "Carregando status..." : "Nenhuma API configurada"}
                  </p>
                )}
                
                <Button 
                  onClick={() => testApisMutation.mutate()}
                  disabled={testApisMutation.isPending || secrets.length === 0}
                  className="w-full"
                >
                  {testApisMutation.isPending ? "Testando..." : "Testar todas as APIs"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Configuração de Chaves de API */}
          <Card>
            <CardHeader>
              <CardTitle>Chaves de API</CardTitle>
              <CardDescription>
                Configure as chaves de API para as integrações de IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {renderSecretField(
                    'openaiKey',
                    'OpenAI API Key',
                    'Chave de API do OpenAI para processamento de linguagem natural',
                    <Bot className="h-4 w-4" />,
                    'sk-...'
                  )}

                  {renderSecretField(
                    'perplexityKey',
                    'Perplexity API Key (Opcional)',
                    'Chave de API do Perplexity para pesquisas em tempo real',
                    <Search className="h-4 w-4" />,
                    'pplx-...'
                  )}

                  <Button 
                    type="submit" 
                    disabled={saveSecretsMutation.isPending}
                    className="w-full"
                  >
                    {saveSecretsMutation.isPending ? "Salvando..." : "Salvar Configurações"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações da Prof. Ana</CardTitle>
              <CardDescription>
                Configure o comportamento e as funcionalidades da assistente de IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-center py-8">
                As configurações avançadas da Prof. Ana estão disponíveis na seção "IA" do menu principal.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}