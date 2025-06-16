import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from '@/shared/lib/hooks/useAuth';
import { useFormSubmission, formatCoachingData } from '@/shared/lib/utils/formHelpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog';
import { Label } from '@/shared/ui/label';
import { Badge } from '@/shared/ui/badge';
import { Textarea } from '@/shared/ui/textarea';
import { Progress } from '@/shared/ui/progress';
import { Avatar, AvatarFallback } from '@/shared/ui/avatar';
import { 
  Plus, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Target,
  MessageSquare,
  Upload,
  FileText,
  Star,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { SalesCoachingHeader } from './SalesCoachingHeader';
import { SalesCoachingDialog } from './SalesCoachingDialog';
import { SalesCoachingStats } from './SalesCoachingStats';
import { SalesCoachingProfiles } from './SalesCoachingProfiles';
import { SalesCoachingHistory } from './SalesCoachingHistory';
import { SalesCoachingMaterials } from './SalesCoachingMaterials';

interface CoachingRecord {
  id: number;
  salespersonId: number;
  salespersonName: string;
  date: string;
  type: 'feedback' | 'goal' | 'training';
  title: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  createdBy: string;
}

interface SalespersonProfile {
  id: number;
  name: string;
  responseTime: number;
  conversionRate: number;
  salesVolume: number;
  strengths: string[];
  improvements: string[];
  lastCoaching: string;
}

export function SalesCoaching() {
  const [selectedSalesperson, setSelectedSalesperson] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CoachingRecord | null>(null);
  
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Controle de acesso: apenas gerentes e administradores podem criar novos registros
  const canCreateRecords = (user as any)?.role === 'Gerente' || (user as any)?.role === 'Administrador';

  // Buscar dados de coaching
  const { data: coachingData, isLoading } = useQuery({
    queryKey: ['/api/sales/coaching', { salesperson: selectedSalesperson }],
    queryFn: async () => {
      const response = await fetch(`/api/sales/coaching?salesperson=${selectedSalesperson}`);
      if (!response.ok) throw new Error('Erro ao carregar dados de coaching');
      return response.json();
    }
  });

  // Buscar perfis dos vendedores
  const { data: profiles } = useQuery({
    queryKey: ['/api/sales/profiles'],
    queryFn: async () => {
      const response = await fetch('/api/sales/profiles');
      if (!response.ok) throw new Error('Erro ao carregar perfis');
      return response.json();
    }
  });

  // Buscar vendedores para filtros
  const { data: salespeople } = useQuery({
    queryKey: ['/api/sales/salespeople'],
    queryFn: async () => {
      const response = await fetch('/api/sales/salespeople');
      if (!response.ok) throw new Error('Erro ao carregar vendedores');
      return response.json();
    }
  });

  // Buscar materiais de treinamento
  const { data: materials } = useQuery({
    queryKey: ['/api/sales/coaching/materials'],
    queryFn: async () => {
      const response = await fetch('/api/sales/coaching/materials');
      if (!response.ok) throw new Error('Erro ao carregar materiais');
      return response.json();
    }
  });

  // Mutation para salvar registro de coaching
  const coachingMutation = useMutation({
    mutationFn: async (recordData: any) => {
      const url = editingRecord ? `/api/sales/coaching/${editingRecord.id}` : '/api/sales/coaching';
      const method = editingRecord ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recordData)
      });
      
      if (!response.ok) throw new Error('Erro ao salvar registro');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sales/coaching'] });
      setIsDialogOpen(false);
      setEditingRecord(null);
    }
  });

  // Mutation para deletar registro
  const deleteMutation = useMutation({
    mutationFn: async (recordId: number) => {
      const response = await fetch(`/api/sales/coaching/${recordId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Erro ao deletar registro');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sales/coaching'] });
    }
  });

  const { handleFormSubmit } = useFormSubmission();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const recordData = formatCoachingData(formData);

    handleFormSubmit(coachingMutation, recordData, {
      successMessage: "Registro de coaching salvo com sucesso",
      errorMessage: "Erro ao salvar registro de coaching",
      onSuccess: () => setIsDialogOpen(false)
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="text-blue-600 border-blue-600"><AlertCircle className="h-3 w-3 mr-1" />Em Andamento</Badge>;
      case 'completed':
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="h-3 w-3 mr-1" />Concluído</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'feedback': return <MessageSquare className="h-4 w-4" />;
      case 'goal': return <Target className="h-4 w-4" />;
      case 'training': return <FileText className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const defaultData = coachingData || { records: [], stats: {} };

  return (
    <div className="space-y-6">
      <SalesCoachingHeader
        selectedSalesperson={selectedSalesperson}
        onSalespersonChange={setSelectedSalesperson}
        salespeople={salespeople || []}
        canCreateRecords={canCreateRecords}
        isDialogOpen={isDialogOpen}
        onDialogOpenChange={setIsDialogOpen}
        onNewRecordClick={() => setEditingRecord(null)}
      />

      <SalesCoachingDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingRecord={editingRecord}
        salespeople={salespeople || []}
      />

      <SalesCoachingStats stats={defaultData.stats} />

      <SalesCoachingProfiles profiles={profiles || []} />

      <SalesCoachingHistory
        records={defaultData.records}
        onEdit={setEditingRecord}
        onDelete={(recordId) => deleteMutation.mutate(recordId)}
        canEdit={canCreateRecords}
      />

      <SalesCoachingMaterials
        materials={materials || []}
        canUpload={canCreateRecords}
      />

      {/* Estatísticas de Coaching */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Registros</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{defaultData.stats?.totalRecords || 0}</div>
            <p className="text-xs text-muted-foreground">Sessões de coaching</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{defaultData.stats?.inProgress || 0}</div>
            <p className="text-xs text-muted-foreground">Ações pendentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{defaultData.stats?.completed || 0}</div>
            <p className="text-xs text-muted-foreground">Objetivos atingidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
            <Star className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {defaultData.stats?.successRate?.toFixed(1) || '0'}%
            </div>
            <p className="text-xs text-muted-foreground">Coaching efetivo</p>
          </CardContent>
        </Card>
      </div>

      {/* Perfis de Performance */}
      {profiles?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Perfis de Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {profiles.map((profile: SalespersonProfile) => (
                <div key={profile.id} className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback>{profile.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-medium">{profile.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Último coaching: {new Date(profile.lastCoaching).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    {canCreateRecords && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingRecord(null);
                          setIsDialogOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Coaching
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Tempo de Resposta</span>
                        <span>{profile.responseTime} min</span>
                      </div>
                      <Progress value={Math.max(0, 100 - (profile.responseTime / 60 * 100))} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Taxa de Conversão</span>
                        <span>{profile.conversionRate}%</span>
                      </div>
                      <Progress value={profile.conversionRate} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <h5 className="text-sm font-medium text-green-600 mb-2">Pontos Fortes</h5>
                        <div className="space-y-1">
                          {profile.strengths?.slice(0, 2).map((strength, index) => (
                            <Badge key={index} variant="outline" className="text-xs block">
                              {strength}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h5 className="text-sm font-medium text-orange-600 mb-2">Melhorias</h5>
                        <div className="space-y-1">
                          {profile.improvements?.slice(0, 2).map((improvement, index) => (
                            <Badge key={index} variant="outline" className="text-xs block">
                              {improvement}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upload de Materiais */}
      <Card>
        <CardHeader>
          <CardTitle>Materiais de Treinamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
            <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Upload de Materiais</h3>
            <p className="text-muted-foreground mb-4">
              Adicione apresentações, vídeos e documentos de treinamento
            </p>
            {canCreateRecords && (
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Fazer Upload
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}