import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/ui/card';
import { Button } from '@/shared/ui/ui/button';
import { Badge } from '@/shared/ui/ui/badge';
import { Input } from '@/shared/ui/ui/input';
import { Textarea } from '@/shared/ui/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/ui/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/shared/lib/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Shield, Plus, Users, Settings, Eye } from 'lucide-react';

const roleFormSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  displayName: z.string().min(2, 'Nome de exibição deve ter pelo menos 2 caracteres'),
  isActive: z.boolean().default(true)
});



const getPermissionName = (permission: string) => {
  const names = {
    user_management: 'Gerenciar Usuários',
    system_config: 'Configurar Sistema',
    reports: 'Relatórios Completos',
    channels: 'Gerenciar Canais',
    team_management: 'Gerenciar Equipes',
    user_view: 'Visualizar Usuários',
    agent_supervision: 'Supervisionar Atendentes',
    basic_reports: 'Relatórios Básicos',
    chat_access: 'Acesso ao Chat',
    customer_view: 'Visualizar Clientes'
  };
  return names[permission as keyof typeof names] || permission;
};

export const RolesTab = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Funções para controlar modais de forma robusta
  const handleOpenCreateDialog = () => {
    setIsDialogOpen(true);
  };

  const handleCloseCreateDialog = () => {
    setIsDialogOpen(false);
    form.reset();
  };

  // Fetch roles from database
  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['/api/roles'],
    queryFn: async () => {
      const response = await fetch('/api/roles');
      if (!response.ok) throw new Error('Failed to fetch roles');
      return response.json();
    }
  });

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: async (roleData: z.infer<typeof roleFormSchema>) => {
      const response = await apiRequest('POST', '/api/roles', roleData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Nova função criada com sucesso!"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/roles'] });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar função",
        variant: "destructive"
      });
    }
  });

  const form = useForm<z.infer<typeof roleFormSchema>>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: {
      name: '',
      displayName: '',
      isActive: true
    }
  });

  const onSubmit = (values: z.infer<typeof roleFormSchema>) => {
    createRoleMutation.mutate(values);
  };

  const handleViewRole = (role: any) => {
    setSelectedRole(role);
    setIsViewDialogOpen(true);
  };

  const handleEditRole = (role: any) => {
    setSelectedRole(role);
    setIsEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Funções do Sistema</h3>
          <p className="text-sm text-muted-foreground">
            Configure as funções e permissões para diferentes tipos de usuários
          </p>
        </div>
        <Button onClick={handleOpenCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Função
        </Button>
        
        <Dialog open={isDialogOpen} onOpenChange={handleCloseCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Função</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Função</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: moderador" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome de Exibição</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Moderador" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleCloseCreateDialog}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createRoleMutation.isPending}
                  >
                    {createRoleMutation.isPending ? 'Criando...' : 'Criar Função'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 bg-gray-300 rounded"></div>
                    <div className="h-6 w-24 bg-gray-300 rounded"></div>
                  </div>
                  <div className="h-6 w-16 bg-gray-300 rounded"></div>
                </div>
                <div className="h-4 w-full bg-gray-300 rounded mt-2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="h-4 w-20 bg-gray-300 rounded mb-2"></div>
                    <div className="flex flex-wrap gap-1">
                      <div className="h-6 w-16 bg-gray-300 rounded"></div>
                      <div className="h-6 w-20 bg-gray-300 rounded"></div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-8 w-full bg-gray-300 rounded"></div>
                    <div className="h-8 w-full bg-gray-300 rounded"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : roles.length === 0 ? (
        <div className="text-center py-8">
          <Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Nenhuma função encontrada
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Comece criando uma nova função para organizar as permissões do sistema.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map((role: any) => (
            <Card key={role.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    <CardTitle className="text-lg">{role.displayName || role.name}</CardTitle>
                  </div>
                  <Badge variant="outline">
                    Ativa
                  </Badge>
                </div>
                <CardDescription>
                  Função criada no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Status:</h4>
                    <Badge variant={role.isActive ? "default" : "secondary"}>
                      {role.isActive ? "Ativa" : "Inativa"}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleViewRole(role)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Visualizar
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleEditRole(role)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de Visualização */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes da Função</DialogTitle>
          </DialogHeader>
          {selectedRole && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nome:</label>
                <p className="text-sm text-muted-foreground">{selectedRole.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Nome de Exibição:</label>
                <p className="text-sm text-muted-foreground">{selectedRole.displayName}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Status:</label>
                <Badge variant={selectedRole.isActive ? "default" : "secondary"}>
                  {selectedRole.isActive ? "Ativa" : "Inativa"}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium">Permissões:</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedRole.permissions && selectedRole.permissions.length > 0 ? (
                    selectedRole.permissions.map((permission: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {getPermissionName(permission)}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhuma permissão definida</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Função</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Use a aba "Permissões" para configurar as permissões específicas desta função.
            </p>
            <div className="flex justify-end">
              <Button onClick={() => setIsEditDialogOpen(false)}>
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};