import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../card';
import { Switch } from '../../switch';
import { Button } from '../../button';
import { Badge } from '../../badge';
import { Separator } from '../../separator';
import { Label } from '../../label';
import { Input } from '../../input';
import { BackButton } from '@/shared/components/BackButton';
import { useToast } from '@/shared/lib/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Brain, 
  Zap, 
  BookOpen, 
  Settings, 
  TrendingUp,
  Activity,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';

interface SystemSetting {
  id: number;
  key: string;
  value: string;
  type: string;
  description: string | null;
  category: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

const aiDetectionSettings = [
  {
    key: 'ai_course_detection_enabled',
    label: 'Sistema de Detecção de Cursos',
    description: 'Ativa a detecção automática de cursos mencionados nas conversas',
    category: 'ai',
    defaultValue: 'true',
    type: 'boolean'
  },
  {
    key: 'ai_department_detection_enabled',
    label: 'Detecção de Departamentos',
    description: 'Identifica automaticamente o departamento correto baseado na mensagem',
    category: 'ai',
    defaultValue: 'true',
    type: 'boolean'
  },
  {
    key: 'ai_detection_confidence_threshold',
    label: 'Limite de Confiança',
    description: 'Pontuação mínima para aceitar uma detecção (0-100)',
    category: 'ai',
    defaultValue: '75',
    type: 'number'
  },
  {
    key: 'ai_detection_auto_tag',
    label: 'Criação Automática de Tags',
    description: 'Cria tags automaticamente para cursos detectados',
    category: 'ai',
    defaultValue: 'true',
    type: 'boolean'
  }
];

export const AIDetectionSettingsPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [localSettings, setLocalSettings] = useState<Record<string, string>>({});

  // Fetch current settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/system-settings', 'ai'],
    queryFn: async () => {
      const response = await fetch('/api/system-settings?category=ai');
      if (!response.ok) throw new Error('Falha ao carregar configurações');
      return response.json() as Promise<SystemSetting[]>;
    }
  });

  // Initialize local settings
  useEffect(() => {
    if (settings) {
      const settingsMap: Record<string, string> = {};
      settings.forEach(setting => {
        settingsMap[setting.key] = setting.value;
      });
      
      // Set defaults for missing settings
      aiDetectionSettings.forEach(defaultSetting => {
        if (!settingsMap[defaultSetting.key]) {
          settingsMap[defaultSetting.key] = defaultSetting.defaultValue;
        }
      });
      
      setLocalSettings(settingsMap);
    }
  }, [settings]);

  // Mutation for updating settings
  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value, type, description, category }: {
      key: string;
      value: string;
      type: string;
      description: string;
      category: string;
    }) => {
      const response = await fetch('/api/system-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value, type, description, category })
      });
      if (!response.ok) throw new Error('Falha ao salvar configuração');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/system-settings'] });
      toast({
        title: "Configuração salva",
        description: "As alterações foram aplicadas com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao salvar a configuração.",
        variant: "destructive"
      });
    }
  });

  const handleSettingChange = (key: string, value: string) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = () => {
    aiDetectionSettings.forEach(setting => {
      const currentValue = localSettings[setting.key];
      if (currentValue !== undefined) {
        updateSettingMutation.mutate({
          key: setting.key,
          value: currentValue,
          type: setting.type,
          description: setting.description,
          category: setting.category
        });
      }
    });
  };

  const isSystemEnabled = localSettings['ai_course_detection_enabled'] === 'true';
  const detectionStats = {
    totalCourses: 271,
    averageAccuracy: 94.2,
    dailyDetections: 127,
    savedTime: '4.2h'
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-educhat-light">
        <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <BackButton to="/settings" label="Voltar às Configurações" />
          <div>
            <h2 className="text-2xl font-bold">Sistema de Detecção IA</h2>
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-educhat-light">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <BackButton to="/settings" label="Voltar às Configurações" />
          <div>
            <h2 className="text-2xl font-bold">Sistema de Detecção IA</h2>
            <p className="text-muted-foreground">
              Configure o sistema inteligente de detecção de cursos e departamentos
            </p>
          </div>
        </div>

        {/* Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Status do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-medium">Sistema de Detecção IA</p>
              <p className="text-sm text-muted-foreground">
                Produto independente para detecção inteligente
              </p>
            </div>
            <Badge variant={isSystemEnabled ? "default" : "secondary"}>
              {isSystemEnabled ? "Ativo" : "Inativo"}
            </Badge>
          </div>
          
          {isSystemEnabled && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-blue-600">{detectionStats.totalCourses}</p>
                <p className="text-xs text-blue-600">Cursos Cadastrados</p>
              </div>
              <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-green-600">{detectionStats.averageAccuracy}%</p>
                <p className="text-xs text-green-600">Precisão Média</p>
              </div>
              <div className="text-center p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                <Zap className="h-6 w-6 text-orange-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-orange-600">{detectionStats.dailyDetections}</p>
                <p className="text-xs text-orange-600">Detecções Hoje</p>
              </div>
              <div className="text-center p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <CheckCircle className="h-6 w-6 text-purple-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-purple-600">{detectionStats.savedTime}</p>
                <p className="text-xs text-purple-600">Tempo Economizado</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

        {/* Configuration Cards */}
        <div className="grid gap-6">
          {/* Main Detection Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Configurações Principais
              </CardTitle>
              <CardDescription>
                Controle as funcionalidades principais do sistema de detecção
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
            {aiDetectionSettings.filter(s => s.type === 'boolean').map(setting => (
              <div key={setting.key} className="flex items-center justify-between">
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor={setting.key}>{setting.label}</Label>
                  <p className="text-sm text-muted-foreground">
                    {setting.description}
                  </p>
                </div>
                <Switch
                  id={setting.key}
                  checked={localSettings[setting.key] === 'true'}
                  onCheckedChange={(checked) => 
                    handleSettingChange(setting.key, checked ? 'true' : 'false')
                  }
                />
              </div>
            ))}
            
            <Separator />
            
            {aiDetectionSettings.filter(s => s.type === 'number').map(setting => (
              <div key={setting.key} className="space-y-2">
                <Label htmlFor={setting.key}>{setting.label}</Label>
                <Input
                  id={setting.key}
                  type="number"
                  min="0"
                  max="100"
                  value={localSettings[setting.key] || setting.defaultValue}
                  onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  {setting.description}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

          {/* Course Database Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Base de Conhecimento
              </CardTitle>
              <CardDescription>
                Informações sobre a base de cursos cadastrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Modalidades Suportadas</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Pós-graduação (184)</Badge>
                  <Badge variant="outline">Tecnólogos (34)</Badge>
                  <Badge variant="outline">Segunda Licenciatura (13)</Badge>
                  <Badge variant="outline">Formação Pedagógica (13)</Badge>
                  <Badge variant="outline">Formação Livre (10)</Badge>
                  <Badge variant="outline">Graduação (6)</Badge>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Departamentos</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Comercial</Badge>
                  <Badge variant="secondary">Secretaria</Badge>
                  <Badge variant="secondary">Tutoria</Badge>
                  <Badge variant="secondary">Financeiro</Badge>
                  <Badge variant="secondary">Suporte</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

          {/* Product Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Informações do Produto
              </CardTitle>
            </CardHeader>
            <CardContent>
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100">
                    Sistema de Detecção IA - Produto Independente
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Este sistema utiliza inteligência artificial para detectar automaticamente 
                    cursos e departamentos mencionados nas conversas, otimizando o atendimento 
                    e direcionamento dos leads. O sistema pode ser comercializado como produto 
                    independente para outras instituições educacionais.
                  </p>
                  <div className="mt-3 space-y-1 text-sm text-blue-600 dark:text-blue-400">
                    <p>• Detecção em tempo real via WebSocket</p>
                    <p>• Suporte a 271+ cursos em diferentes modalidades</p>
                    <p>• Classificação automática por departamento</p>
                    <p>• Integração completa com sistema CRM</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button 
          onClick={saveSettings}
          disabled={updateSettingMutation.isPending}
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          {updateSettingMutation.isPending ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
        <Button 
          variant="outline"
          onClick={() => {
            // Reset to current server state
            if (settings) {
              const settingsMap: Record<string, string> = {};
              settings.forEach(setting => {
                settingsMap[setting.key] = setting.value;
              });
              setLocalSettings(settingsMap);
            }
          }}
        >
          Descartar Alterações
        </Button>
        </div>
      </div>
    </div>
  );
};