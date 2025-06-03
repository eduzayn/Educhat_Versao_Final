import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/ui/card';
import { Button } from '@/shared/ui/ui/button';
import { Badge } from '@/shared/ui/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/shared/ui/ui/dialog';
import { Input } from '@/shared/ui/ui/input';
import { Label } from '@/shared/ui/ui/label';
import { Textarea } from '@/shared/ui/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/ui/select';
import { Building2, Plus, Users, Settings, UserPlus } from 'lucide-react';

const teams = [
  {
    id: 1,
    name: 'Vendas',
    description: 'Equipe responsável por prospecção e vendas',
    memberCount: 8,
    manager: {
      name: 'João Silva',
      avatar: '',
      initials: 'JS'
    },
    departments: ['Vendas Online', 'Vendas Presencial'],
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
  },
  {
    id: 2,
    name: 'Atendimento',
    description: 'Equipe de atendimento ao cliente',
    memberCount: 12,
    manager: {
      name: 'Maria Santos',
      avatar: '',
      initials: 'MS'
    },
    departments: ['Suporte Técnico', 'Atendimento Geral'],
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  },
  {
    id: 3,
    name: 'Marketing',
    description: 'Equipe de marketing e comunicação',
    memberCount: 5,
    manager: {
      name: 'Ana Costa',
      avatar: '',
      initials: 'AC'
    },
    departments: ['Marketing Digital', 'Comunicação'],
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
  },
  {
    id: 4,
    name: 'Administração',
    description: 'Equipe administrativa e financeira',
    memberCount: 4,
    manager: {
      name: 'Carlos Lima',
      avatar: '',
      initials: 'CL'
    },
    departments: ['Financeiro', 'RH', 'TI'],
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
  }
];

export const TeamsTab = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Equipes de Trabalho</h3>
          <p className="text-sm text-muted-foreground">
            Organize usuários em equipes para melhor colaboração e gestão
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Equipe
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {teams.map(team => (
          <Card key={team.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  <CardTitle className="text-lg">{team.name}</CardTitle>
                </div>
                <Badge variant="outline" className={team.color}>
                  <Users className="h-3 w-3 mr-1" />
                  {team.memberCount}
                </Badge>
              </div>
              <CardDescription>{team.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Gerente:</span>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={team.manager.avatar} />
                      <AvatarFallback className="text-xs">{team.manager.initials}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{team.manager.name}</span>
                  </div>
                </div>
                
                <div>
                  <span className="text-sm font-medium">Departamentos:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {team.departments.map(dept => (
                      <Badge key={dept} variant="secondary" className="text-xs">
                        {dept}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Adicionar Membro
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Settings className="h-4 w-4 mr-2" />
                    Configurar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};