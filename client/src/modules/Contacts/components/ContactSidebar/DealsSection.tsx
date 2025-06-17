import { useState, useEffect } from 'react';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Card, CardContent } from '@/shared/ui/card';
import { Avatar, AvatarFallback } from '@/shared/ui/avatar';
import { Badge } from '@/shared/ui/badge';
import { Plus, Edit, Briefcase } from 'lucide-react';
import { getAllTeams, getStagesForTeam } from '@/shared/lib/crmFunnels';
import { useContactDeals } from './hooks/useContactDeals';
import { useCourseData } from './hooks/useCourseData';
import { formatCurrency, getStageColor, getStageLabel, getTeamName } from './utils/dealUtils';

interface DealsSectionProps {
  contact: {
    id: number;
    name: string;
    phone?: string;
  };
  deals: any[];
}

export function DealsSection({ contact, deals }: DealsSectionProps) {
  const {
    showDealDialog,
    setShowDealDialog,
    editingDeal,
    setEditingDeal,
    editingDealData,
    setEditingDealData,
    dealFormData,
    setDealFormData,
    createDealMutation,
    updateDealMutation,
    resetDealForm,
    handleCreateDeal,
    handleUpdateDeal
  } = useContactDeals();

  const { categories, filteredCourses, filterCoursesByCategory } = useCourseData();

  useEffect(() => {
    if (dealFormData.category) {
      filterCoursesByCategory(dealFormData.category);
    }
  }, [dealFormData.category, filterCoursesByCategory]);

  const openCreateDialog = () => {
    setEditingDeal(null);
    resetDealForm();
    setShowDealDialog(true);
  };

  const openEditDialog = (deal: any) => {
    setEditingDeal(deal);
    setEditingDealData({});
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm text-gray-900 flex items-center">
          <Briefcase className="w-4 h-4 mr-2" />
          Negócios
        </h4>
        
        <Dialog open={showDealDialog} onOpenChange={setShowDealDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" onClick={openCreateDialog}>
              <Plus className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Criar negociação</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="deal-name">Nome da negociação *</Label>
                <Input
                  id="deal-name"
                  placeholder="Digite o nome da negociação"
                  value={dealFormData.name}
                  onChange={(e) => setDealFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="deal-value">Valor</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                  <Input
                    id="deal-value"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    className="pl-8"
                    value={dealFormData.value}
                    onChange={(e) => setDealFormData(prev => ({ ...prev, value: e.target.value }))}
                  />
                </div>
                <div className="flex items-center mt-2">
                  <span className="text-sm text-blue-600 mr-2">🎓</span>
                  <span className="text-sm text-blue-600">Curso</span>
                </div>
              </div>

              <div>
                <Label htmlFor="deal-team">Funil de vendas *</Label>
                <Select 
                  value={dealFormData.team} 
                  onValueChange={(value) => {
                    setDealFormData(prev => ({ 
                      ...prev, 
                      team: value,
                      stage: ''
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o funil" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAllTeams().map(({ id, info }) => (
                      <SelectItem key={id} value={id}>
                        {info.name.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="deal-stage">Etapa do funil *</Label>
                <Select 
                  value={dealFormData.stage} 
                  onValueChange={(value) => setDealFormData(prev => ({ ...prev, stage: value }))}
                  disabled={!dealFormData.team}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={dealFormData.team ? "Selecione a etapa" : "Primeiro selecione o funil"} />
                  </SelectTrigger>
                  <SelectContent>
                    {dealFormData.team && getStagesForTeam(dealFormData.team).map((stage) => (
                      <SelectItem key={stage.id} value={stage.id}>
                        {stage.name.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Categoria do Curso</Label>
                <Select 
                  value={dealFormData.category} 
                  onValueChange={(value) => {
                    setDealFormData({...dealFormData, category: value === 'all' ? '' : value, course: ''});
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Curso de Interesse</Label>
                <Select 
                  value={dealFormData.course} 
                  onValueChange={(value) => setDealFormData({...dealFormData, course: value === 'none' ? '' : value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o curso" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum curso específico</SelectItem>
                    {filteredCourses.map((course) => (
                      <SelectItem key={course} value={course}>
                        {course}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <h5 className="font-medium text-sm mb-2">Contato</h5>
                <div className="flex items-center space-x-2">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-sm">
                      {contact.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{contact.name}</p>
                    <p className="text-xs text-gray-500">{contact.phone}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowDealDialog(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={() => handleCreateDeal(contact.id)}
                  disabled={!dealFormData.name.trim() || createDealMutation.isPending}
                >
                  {createDealMutation.isPending ? 'Criando...' : 'Criar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      {deals && deals.length > 0 ? (
        <div className="space-y-2">
          {deals.map((deal: any) => (
            <Card key={deal.id} className="border border-gray-200">
              <CardContent className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <h5 className="font-medium text-sm text-gray-900 truncate flex-1">
                    {deal.name}
                  </h5>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 ml-2"
                    onClick={() => openEditDialog(deal)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                </div>
                
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-green-600">
                    {formatCurrency(deal.value || 0)}
                  </span>
                  <Badge className={`text-xs ${getStageColor(deal.stage, deal.team)}`}>
                    {getStageLabel(deal.stage, deal.team)}
                  </Badge>
                </div>
                
                <div className="text-xs text-gray-500">
                  {deal.team && getTeamName(deal.team) 
                    ? `${getTeamName(deal.team)}` 
                    : deal.team?.toUpperCase()
                  } • Criado em {new Date(deal.createdAt).toLocaleDateString('pt-BR')}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500">Nenhum negócio encontrado</p>
        </div>
      )}

      {/* Modal de Edição de Deal */}
      {editingDeal && (
        <Dialog open={!!editingDeal} onOpenChange={() => setEditingDeal(null)}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Editar Negócio</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>Valor</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
                  <Input
                    type="number"
                    step="0.01"
                    className="pl-8"
                    defaultValue={(editingDeal.value / 100).toFixed(2)}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      handleUpdateDeal(editingDeal, { value: newValue });
                    }}
                  />
                </div>
              </div>

              <div>
                <Label>Funil de vendas</Label>
                <Select 
                  value={editingDealData.team || editingDeal.team} 
                  onValueChange={(value) => {
                    setEditingDealData((prev: any) => ({ 
                      ...prev, 
                      team: value,
                      stage: getStagesForTeam(value)[0]?.id || ''
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getAllTeams().map(({ id, info }) => (
                      <SelectItem key={id} value={id}>
                        {info.name.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Etapa do Negócio</Label>
                <Select 
                  value={editingDealData.stage || editingDeal.stage} 
                  onValueChange={(value) => {
                    setEditingDealData((prev: any) => ({ ...prev, stage: value }));
                  }}
                  disabled={!(editingDealData.team || editingDeal.team)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(editingDealData.team || editingDeal.team) && 
                      getStagesForTeam(editingDealData.team || editingDeal.team).map((stage) => (
                        <SelectItem key={stage.id} value={stage.id}>
                          {stage.name.toUpperCase()}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setEditingDeal(null)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={() => {
                    const updates = { ...editingDealData };
                    if (Object.keys(updates).length > 0) {
                      handleUpdateDeal(editingDeal, updates);
                    }
                  }}
                  disabled={updateDealMutation.isPending}
                >
                  {updateDealMutation.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}