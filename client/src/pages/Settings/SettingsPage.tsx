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
    queryFn: () => apiRequest('/api/settings/secrets/status'),
  });

  // Mutation para salvar secrets
  const saveSecretsMutation = useMutation({
    mutationFn: (data: SecretsForm) =>
      apiRequest('/api/settings/secrets', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({
        title: 'Configurações salvas',
        description: 'As chaves de API foram configuradas com sucesso.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/settings/secrets/status'] });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as configurações.',
        variant: 'destructive',
      });
    },
  });

  // Mutation para testar secrets
  const testSecretsMutation = useMutation({
    mutationFn: () => apiRequest('/api/settings/secrets/test', { method: 'POST' }),
    onSuccess: (data) => {
      toast({
        title: 'Teste concluído',
        description: `${data.working} de ${data.total} APIs funcionando corretamente.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/settings/secrets/status'] });
    },
    onError: () => {
      toast({
        title: 'Erro no teste',
        description: 'Não foi possível testar as configurações.',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: SecretsForm) => {
    saveSecretsMutation.mutate(data);
  };

  const handleTestSecrets = () => {
    testSecretsMutation.mutate();
  };

  const toggleShowKey = (keyName: string) => {
    setShowKeys(prev => ({ ...prev, [keyName]: !prev[keyName] }));
  };

  const getStatusIcon = (status: SecretStatus) => {
    if (!status.isConfigured) return <X className="h-4 w-4 text-red-500" />;
    if (status.isWorking) return <Check className="h-4 w-4 text-green-500" />;
    return <X className="h-4 w-4 text-red-500" />;
  };

  const getStatusBadge = (status: SecretStatus) => {
    if (!status.isConfigured) return <Badge variant="destructive">Não configurada</Badge>;
    if (status.isWorking) return <Badge variant="default">Funcionando</Badge>;
    return <Badge variant="destructive">Com problemas</Badge>;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">
            Configure as integrações de IA para a Prof. Ana
          </p>
        </div>
      </div>

      <Tabs defaultValue="apis" className="space-y-6">
        <TabsList>
          <TabsTrigger value="apis">APIs & Integrações</TabsTrigger>
          <TabsTrigger value="ia">Configurações da IA</TabsTrigger>
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
                <div className="flex items-center justify-between">
                  <Button 
                    onClick={handleTestSecrets}
                    disabled={testSecretsMutation.isPending}
                    variant="outline"
                  >
                    {testSecretsMutation.isPending ? 'Testando...' : 'Testar todas as APIs'}
                  </Button>
                </div>

                {isLoading ? (
                  <div className="text-center py-4">Carregando status...</div>
                ) : (
                  <div className="grid gap-4">
                    {secretsStatus?.map((status: SecretStatus) => (
                      <div key={status.name} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {status.name === 'OpenAI' && <Bot className="h-5 w-5" />}
                          {status.name === 'Perplexity' && <Search className="h-5 w-5" />}
                          <div>
                            <h3 className="font-medium">{status.name}</h3>
                            {status.lastTested && (
                              <p className="text-sm text-muted-foreground">
                                Último teste: {new Date(status.lastTested).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(status)}
                          {getStatusBadge(status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Configuração de APIs */}
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
                  <FormField
                    control={form.control}
                    name="openaiKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Bot className="h-4 w-4" />
                          OpenAI API Key
                        </FormLabel>
                        <FormDescription>
                          Chave de API do OpenAI para processamento de linguagem natural
                        </FormDescription>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showKeys.openai ? 'text' : 'password'}
                              placeholder="sk-..."
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => toggleShowKey('openai')}
                            >
                              {showKeys.openai ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="perplexityKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Search className="h-4 w-4" />
                          Perplexity API Key (Opcional)
                        </FormLabel>
                        <FormDescription>
                          Chave de API do Perplexity para pesquisas em tempo real
                        </FormDescription>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showKeys.perplexity ? 'text' : 'password'}
                              placeholder="pplx-..."
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => toggleShowKey('perplexity')}
                            >
                              {showKeys.perplexity ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    disabled={saveSecretsMutation.isPending}
                    className="w-full"
                  >
                    {saveSecretsMutation.isPending ? 'Salvando...' : 'Salvar Configurações'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ia" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações da Prof. Ana</CardTitle>
              <CardDescription>
                Configurações avançadas do motor de IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  As configurações da IA são gerenciadas automaticamente pelo sistema.
                  Para ajustes avançados, entre em contato com o suporte.
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}