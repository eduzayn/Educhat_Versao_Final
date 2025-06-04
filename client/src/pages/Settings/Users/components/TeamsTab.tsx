import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/ui/card';
import { Button } from '@/shared/ui/ui/button';
import { Badge } from '@/shared/ui/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/ui/dialog';
import { Input } from '@/shared/ui/ui/input';
import { Label } from '@/shared/ui/ui/label';
import { Textarea } from '@/shared/ui/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/ui/select';
import { Building2, Plus, Users, Settings, UserPlus, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { Team } from '@shared/schema';

// Função para obter a cor baseada na cor hex da equipe
const getTeamColorClass = (color: string) => {
  const colorMap: Record<string, string> = {
    '#4F46E5': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    '#10B981': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    '#F59E0B': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
    '#8B5CF6': 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',
    '#EC4899': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    '#06B6D4': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
    '#EF4444': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  };
  return colorMap[color] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
};

export const TeamsTab = () => {
  const [showTeamDialog, setShowTeamDialog] = useState(false);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  // Buscar equipes do banco de dados
  const { data: teams = [], isLoading, error } = useQuery({
    queryKey: ['/api/teams'],
    queryFn: async () => {
      const response = await fetch('/api/teams');
      if (!response.ok) {
        throw new Error('Erro ao carregar equipes');
      }
      return response.json() as Promise<Team[]>;
    }
  });

  // Buscar usuários disponíveis
  const { data: systemUsers = [] } = useQuery({
    queryKey: ['/api/system-users'],
    queryFn: async () => {
      const response = await fetch('/api/system-users');
      if (!response.ok) {
        throw new Error('Erro ao carregar usuários');
      }
      return response.json();
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Equipes de Trabalho</h3>
          <p className="text-sm text-muted-foreground">
            Organize usuários em equipes para melhor colaboração e gestão
          </p>
        </div>
        <Button 
          onClick={() => setShowTeamDialog(true)}
          className="z-10 relative"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Equipe
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Carregando equipes...</span>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-600">
          Erro ao carregar equipes. Tente novamente.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teams.map(team => (
            <Card key={team.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    <CardTitle className="text-lg">{team.name}</CardTitle>
                  </div>
                  <Badge variant="outline" className={getTeamColorClass(team.color || '')}>
                    <Users className="h-3 w-3 mr-1" />
                    0
                  </Badge>
                </div>
                <CardDescription>{team.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Macrosetor:</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {team.macrosetor || 'Não definido'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Status:</span>
                    <Badge variant={team.isActive ? "default" : "destructive"} className="text-xs">
                      {team.isActive ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => {
                        setSelectedTeam(team);
                        setShowAddMemberDialog(true);
                      }}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Adicionar Membro
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => {
                        setSelectedTeam(team);
                        setShowConfigDialog(true);
                      }}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Configurar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Criação de Equipe */}
      <Dialog open={showTeamDialog} onOpenChange={setShowTeamDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Criar Nova Equipe</DialogTitle>
            <DialogDescription>
              Preencha os dados abaixo para criar uma nova equipe de trabalho.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="team-name" className="text-right">
                Nome
              </Label>
              <Input
                id="team-name"
                placeholder="Nome da equipe"
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="team-description" className="text-right">
                Descrição
              </Label>
              <Textarea
                id="team-description"
                placeholder="Descrição da equipe"
                className="col-span-3"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="team-manager" className="text-right">
                Gerente
              </Label>
              <Select>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o gerente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="joao">João Silva</SelectItem>
                  <SelectItem value="maria">Maria Santos</SelectItem>
                  <SelectItem value="ana">Ana Costa</SelectItem>
                  <SelectItem value="carlos">Carlos Oliveira</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="team-departments" className="text-right">
                Departamentos
              </Label>
              <Input
                id="team-departments"
                placeholder="Ex: Vendas Online, Vendas Presencial"
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="team-color" className="text-right">
                Cor
              </Label>
              <Select>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione uma cor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blue">Azul</SelectItem>
                  <SelectItem value="green">Verde</SelectItem>
                  <SelectItem value="purple">Roxo</SelectItem>
                  <SelectItem value="orange">Laranja</SelectItem>
                  <SelectItem value="red">Vermelho</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTeamDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={() => {
              console.log('Criar equipe');
              setShowTeamDialog(false);
            }}>
              Criar Equipe
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Adicionar Membro */}
      <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adicionar Membro à Equipe</DialogTitle>
            <DialogDescription>
              Adicione um usuário à equipe {selectedTeam?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="user-select" className="text-right">
                Usuário
              </Label>
              <Select>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione um usuário" />
                </SelectTrigger>
                <SelectContent>
                  {systemUsers.map((user: any) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.displayName} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMemberDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={() => {
              console.log('Adicionar membro à equipe');
              setShowAddMemberDialog(false);
            }}>
              Adicionar Membro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Configurações da Equipe */}
      <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Configurações da Equipe</DialogTitle>
            <DialogDescription>
              Configure as propriedades da equipe {selectedTeam?.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="config-name" className="text-right">
                Nome
              </Label>
              <Input
                id="config-name"
                defaultValue={selectedTeam?.name}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="config-description" className="text-right">
                Descrição
              </Label>
              <Textarea
                id="config-description"
                defaultValue={selectedTeam?.description || ''}
                className="col-span-3"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="config-macrosetor" className="text-right">
                Macrosetor
              </Label>
              <Select defaultValue={selectedTeam?.macrosetor || ''}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o macrosetor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comercial">Comercial</SelectItem>
                  <SelectItem value="suporte">Suporte</SelectItem>
                  <SelectItem value="financeiro">Financeiro</SelectItem>
                  <SelectItem value="secretaria">Secretaria</SelectItem>
                  <SelectItem value="secretaria_pos">Secretaria Pós</SelectItem>
                  <SelectItem value="tutoria">Tutoria</SelectItem>
                  <SelectItem value="cobranca">Cobrança</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="config-status" className="text-right">
                Status
              </Label>
              <Select defaultValue={selectedTeam?.isActive ? "true" : "false"}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Ativa</SelectItem>
                  <SelectItem value="false">Inativa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={() => {
              console.log('Salvar configurações da equipe');
              setShowConfigDialog(false);
            }}>
              Salvar Configurações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};