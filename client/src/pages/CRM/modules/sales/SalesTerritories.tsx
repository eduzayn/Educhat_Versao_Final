import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/ui/card';
import { Button } from '@/shared/ui/ui/button';
import { Input } from '@/shared/ui/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/ui/dialog';
import { Label } from '@/shared/ui/ui/label';
import { Badge } from '@/shared/ui/ui/badge';
import { Textarea } from '@/shared/ui/ui/textarea';
import { useAuth } from '@/shared/lib/hooks/useAuth';
import { 
  Plus, 
  Edit, 
  MapPin, 
  Users, 
  TrendingUp, 
  Target,
  Trash2
} from "lucide-react";

interface Territory {
  id: number;
  name: string;
  description: string;
  states: string[];
  cities: string[];
  salespeople: string[];
  leadsCount: number;
  salesCount: number;
  salesValue: number;
  isActive: boolean;
}

export function SalesTerritories() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTerritory, setEditingTerritory] = useState<Territory | null>(null);
  
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Verificar se usuário pode gerenciar territórios (apenas gerentes e admin)
  const canManageTerritories = (user as any)?.role === 'admin' || (user as any)?.role === 'gerente';

  // Buscar territórios
  const { data: territories, isLoading } = useQuery({
    queryKey: ['/api/sales/territories'],
    queryFn: async () => {
      const response = await fetch('/api/sales/territories');
      if (!response.ok) throw new Error('Erro ao carregar territórios');
      return response.json();
    }
  });

  // Buscar vendedores disponíveis
  const { data: salespeople } = useQuery({
    queryKey: ['/api/sales/salespeople'],
    queryFn: async () => {
      const response = await fetch('/api/sales/salespeople');
      if (!response.ok) throw new Error('Erro ao carregar vendedores');
      return response.json();
    }
  });

  // Mutation para salvar território
  const territoryMutation = useMutation({
    mutationFn: async (territoryData: any) => {
      const url = editingTerritory ? `/api/sales/territories/${editingTerritory.id}` : '/api/sales/territories';
      const method = editingTerritory ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(territoryData)
      });
      
      if (!response.ok) throw new Error('Erro ao salvar território');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sales/territories'] });
      setIsDialogOpen(false);
      setEditingTerritory(null);
    }
  });

  // Mutation para deletar território
  const deleteMutation = useMutation({
    mutationFn: async (territoryId: number) => {
      const response = await fetch(`/api/sales/territories/${territoryId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Erro ao deletar território');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sales/territories'] });
    }
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const territoryData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      states: (formData.get('states') as string).split(',').map(s => s.trim()).filter(Boolean),
      cities: (formData.get('cities') as string).split(',').map(c => c.trim()).filter(Boolean),
      salespeople: Array.from(formData.getAll('salespeople')),
      isActive: formData.get('isActive') === 'on'
    };

    territoryMutation.mutate(territoryData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const defaultData = territories || { territories: [], stats: {} };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Territórios de Vendas</h2>
          <p className="text-muted-foreground">Gerencie a distribuição geográfica de leads e vendedores</p>
        </div>

        {canManageTerritories && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingTerritory(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Território
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingTerritory ? 'Editar Território' : 'Novo Território'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome do Território</Label>
                <Input
                  name="name"
                  defaultValue={editingTerritory?.name}
                  placeholder="Ex: Região Sudeste"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  name="description"
                  defaultValue={editingTerritory?.description}
                  placeholder="Descrição do território"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="states">Estados (separados por vírgula)</Label>
                <Input
                  name="states"
                  defaultValue={editingTerritory?.states?.join(', ')}
                  placeholder="SP, RJ, MG, ES"
                />
              </div>

              <div>
                <Label htmlFor="cities">Cidades Principais (separadas por vírgula)</Label>
                <Input
                  name="cities"
                  defaultValue={editingTerritory?.cities?.join(', ')}
                  placeholder="São Paulo, Rio de Janeiro, Belo Horizonte"
                />
              </div>

              <div>
                <Label>Vendedores Responsáveis</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {salespeople?.map((person: any) => (
                    <label key={person.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="salespeople"
                        value={person.id}
                        defaultChecked={editingTerritory?.salespeople?.includes(person.id.toString())}
                        className="rounded"
                      />
                      <span className="text-sm">{person.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="isActive"
                  id="isActive"
                  defaultChecked={editingTerritory?.isActive ?? true}
                  className="rounded"
                />
                <Label htmlFor="isActive">Território ativo</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={territoryMutation.isPending}>
                  {territoryMutation.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </form>
          </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Territórios</CardTitle>
            <MapPin className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{defaultData.stats?.totalTerritories || 0}</div>
            <p className="text-xs text-muted-foreground">Territórios ativos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendedores Alocados</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{defaultData.stats?.allocatedSalespeople || 0}</div>
            <p className="text-xs text-muted-foreground">Com territórios definidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Distribuídos</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{defaultData.stats?.totalLeads || 0}</div>
            <p className="text-xs text-muted-foreground">Por região</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas por Território</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {defaultData.stats?.totalSales?.toLocaleString('pt-BR') || '0'}
            </div>
            <p className="text-xs text-muted-foreground">Volume total</p>
          </CardContent>
        </Card>
      </div>

      {/* Mapa Interativo - Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Mapa de Territórios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/30 rounded-lg p-8 text-center">
            <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Mapa Interativo</h3>
            <p className="text-muted-foreground mb-4">
              Visualização geográfica dos territórios será implementada com Google Maps ou Leaflet
            </p>
            <Button variant="outline">Configurar Integração de Mapas</Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Territórios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {defaultData.territories?.length > 0 ? (
          defaultData.territories.map((territory: Territory) => (
            <Card key={territory.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{territory.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{territory.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {territory.isActive ? (
                      <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                    ) : (
                      <Badge variant="outline">Inativo</Badge>
                    )}
                    {canManageTerritories && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingTerritory(territory);
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMutation.mutate(territory.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Estados Cobertos</h4>
                  <div className="flex flex-wrap gap-1">
                    {territory.states?.map((state, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {state}
                      </Badge>
                    ))}
                  </div>
                </div>

                {territory.cities?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Cidades Principais</h4>
                    <div className="flex flex-wrap gap-1">
                      {territory.cities.slice(0, 3).map((city, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {city}
                        </Badge>
                      ))}
                      {territory.cities.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{territory.cities.length - 3} mais
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium mb-2">Vendedores</h4>
                  <div className="flex flex-wrap gap-1">
                    {territory.salespeople?.map((person, index) => (
                      <Badge key={index} className="text-xs">
                        {person}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-3 border-t">
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">{territory.leadsCount || 0}</div>
                    <div className="text-xs text-muted-foreground">Leads</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{territory.salesCount || 0}</div>
                    <div className="text-xs text-muted-foreground">Vendas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">
                      R$ {territory.salesValue?.toLocaleString('pt-BR') || '0'}
                    </div>
                    <div className="text-xs text-muted-foreground">Volume</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-2">
            <Card>
              <CardContent className="text-center py-8">
                <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum território configurado</h3>
                <p className="text-muted-foreground mb-4">
                  {canManageTerritories 
                    ? 'Comece criando territórios para organizar sua equipe de vendas'
                    : 'Nenhum território foi configurado ainda'
                  }
                </p>
                {canManageTerritories && (
                  <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Território
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}