import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Checkbox } from '@/shared/ui/checkbox';
import { Separator } from '@/shared/ui/separator';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Progress } from '@/shared/ui/progress';
import { useToast } from '@/shared/lib/hooks/use-toast';
import { 
  Bot, 
  Eye, 
  Play, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  BarChart3,
  Zap
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';

interface AssignmentPreview {
  conversationId: number;
  currentTeamId: number | null;
  suggestedTeamType: string | null;
  confidence: number;
  reason: string;
  messageCount: number;
}

interface AssignmentResult {
  processed: number;
  updated: number;
  skipped: number;
  errors: any[];
  assignments: any[];
  successRate: number;
  dryRun: boolean;
}

export function RetroactiveAssignment() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    maxConversations: 50,
    onlyUnassigned: true,
    minConfidence: 40,
    dryRun: false
  });
  const [lastResult, setLastResult] = useState<AssignmentResult | null>(null);

  // Query para prévia
  const { data: preview, isLoading: previewLoading, refetch: refetchPreview } = useQuery({
    queryKey: ['/api/admin/retroactive-assignment/preview', settings.maxConversations, settings.onlyUnassigned],
    queryFn: async () => {
      const params = new URLSearchParams({
        maxConversations: settings.maxConversations.toString(),
        onlyUnassigned: settings.onlyUnassigned.toString()
      });
      
      const response = await fetch(`/api/admin/retroactive-assignment/preview?${params}`);
      if (!response.ok) throw new Error('Erro ao carregar prévia');
      return response.json();
    },
    enabled: false // Carregar apenas quando solicitado
  });

  // Mutation para execução
  const executeMutation = useMutation({
    mutationFn: async (config: typeof settings) => {
      const response = await fetch('/api/admin/retroactive-assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      if (!response.ok) throw new Error('Erro na execução');
      return response.json();
    },
    onSuccess: (data) => {
      setLastResult(data.data);
      toast({
        title: settings.dryRun ? 'Análise concluída' : 'Atribuição concluída',
        description: `${data.data.updated} conversas ${settings.dryRun ? 'seriam atualizadas' : 'atualizadas'} de ${data.data.processed} processadas`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro na execução',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      });
    }
  });

  const handlePreview = () => {
    refetchPreview();
  };

  const handleExecute = () => {
    executeMutation.mutate(settings);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-500';
    if (confidence >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 80) return 'Alta';
    if (confidence >= 60) return 'Média';
    return 'Baixa';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Bot className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold">Atribuição Retroativa com IA</h1>
          <p className="text-gray-600">
            Analise conversas existentes e atribua automaticamente às equipes corretas
          </p>
        </div>
      </div>

      {/* Configurações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Configurações de Análise
          </CardTitle>
          <CardDescription>
            Configure os parâmetros para a análise automática de conversas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxConversations">Máximo de Conversas</Label>
              <Input
                id="maxConversations"
                type="number"
                value={settings.maxConversations}
                onChange={(e) => setSettings(s => ({ ...s, maxConversations: parseInt(e.target.value) || 50 }))}
                min="1"
                max="500"
              />
              <p className="text-xs text-gray-500">Limite de conversas para processar por execução</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="minConfidence">Confiança Mínima (%)</Label>
              <Input
                id="minConfidence"
                type="number"
                value={settings.minConfidence}
                onChange={(e) => setSettings(s => ({ ...s, minConfidence: parseInt(e.target.value) || 40 }))}
                min="1"
                max="100"
              />
              <p className="text-xs text-gray-500">Nível mínimo de confiança para fazer atribuição</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="onlyUnassigned"
                checked={settings.onlyUnassigned}
                onCheckedChange={(checked) => 
                  setSettings(s => ({ ...s, onlyUnassigned: checked as boolean }))
                }
              />
              <Label htmlFor="onlyUnassigned">Apenas conversas não atribuídas</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="dryRun"
                checked={settings.dryRun}
                onCheckedChange={(checked) => 
                  setSettings(s => ({ ...s, dryRun: checked as boolean }))
                }
              />
              <Label htmlFor="dryRun">Modo simulação (não fazer alterações)</Label>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handlePreview}
              disabled={previewLoading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              {previewLoading ? 'Carregando...' : 'Visualizar Prévia'}
            </Button>

            <Button
              onClick={handleExecute}
              disabled={executeMutation.isPending}
              className="flex items-center gap-2"
            >
              {settings.dryRun ? <Eye className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {executeMutation.isPending ? 'Executando...' : (settings.dryRun ? 'Simular' : 'Executar')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Prévia */}
      {preview?.data && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Prévia da Análise
            </CardTitle>
            <CardDescription>
              {preview.data.totalAnalyzed} conversas analisadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {preview.data.previews.map((item: AssignmentPreview) => (
                <div key={item.conversationId} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Conversa #{item.conversationId}</span>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={`${getConfidenceColor(item.confidence)} text-white`}
                      >
                        {item.confidence}% {getConfidenceLabel(item.confidence)}
                      </Badge>
                      {item.suggestedTeamType && (
                        <Badge variant="secondary">{item.suggestedTeamType}</Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{item.reason}</p>
                  <p className="text-xs text-gray-500">{item.messageCount} mensagens</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultado da Execução */}
      {lastResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Resultado da {lastResult.dryRun ? 'Simulação' : 'Execução'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Métricas */}
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{lastResult.processed}</div>
                <div className="text-sm text-gray-500">Processadas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{lastResult.updated}</div>
                <div className="text-sm text-gray-500">
                  {lastResult.dryRun ? 'Seriam atualizadas' : 'Atualizadas'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{lastResult.skipped}</div>
                <div className="text-sm text-gray-500">Ignoradas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{lastResult.errors.length}</div>
                <div className="text-sm text-gray-500">Erros</div>
              </div>
            </div>

            {/* Taxa de Sucesso */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Taxa de sucesso</span>
                <span className="font-medium">{lastResult.successRate}%</span>
              </div>
              <Progress value={lastResult.successRate} className="h-2" />
            </div>

            {/* Erros */}
            {lastResult.errors.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {lastResult.errors.length} erros encontrados durante o processamento.
                </AlertDescription>
              </Alert>
            )}

            {/* Atribuições Realizadas */}
            {lastResult.assignments.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">
                  {lastResult.dryRun ? 'Atribuições Sugeridas' : 'Atribuições Realizadas'}
                </h4>
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {lastResult.assignments.map((assignment: any, index: number) => (
                    <div key={index} className="text-sm border rounded p-2">
                      <div className="flex items-center justify-between">
                        <span>Conversa #{assignment.conversationId}</span>
                        <Badge variant="outline">{assignment.confidence}%</Badge>
                      </div>
                      <div className="text-gray-600">→ {assignment.teamName}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Informações sobre IA */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-600" />
            Como Funciona a Análise de IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              O sistema analisa o conteúdo das mensagens de cada conversa procurando por palavras-chave 
              específicas para determinar qual equipe seria mais adequada:
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h5 className="font-medium text-gray-900">Comercial</h5>
                <p>preço, valor, curso, matrícula, interesse, desconto</p>
              </div>
              <div>
                <h5 className="font-medium text-gray-900">Suporte</h5>
                <p>problema, erro, ajuda, login, senha, plataforma</p>
              </div>
              <div>
                <h5 className="font-medium text-gray-900">Financeiro</h5>
                <p>boleto, cobrança, pagamento, mensalidade, negociar</p>
              </div>
              <div>
                <h5 className="font-medium text-gray-900">Tutoria</h5>
                <p>dúvida, matéria, aula, professor, atividade, prova</p>
              </div>
            </div>
            <p>
              A confiança é calculada baseada na quantidade de palavras-chave encontradas. 
              Apenas conversas com confiança acima do limite configurado são atribuídas.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}