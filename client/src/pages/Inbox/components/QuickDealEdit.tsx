import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Edit2, DollarSign } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { getAllMacrosetores, getStagesForMacrosetor } from '@/lib/crmFunnels';

interface QuickDealEditProps {
  deal: any;
  contactId: number;
}

export function QuickDealEdit({ deal, contactId }: QuickDealEditProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: deal?.name || '',
    value: deal?.value ? (deal.value / 100).toString() : '0',
    macrosetor: deal?.macrosetor || '',
    stage: deal?.stage || ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const allMacrosetores = getAllMacrosetores();
  const availableStages = formData.macrosetor ? getStagesForMacrosetor(formData.macrosetor) : [];

  useEffect(() => {
    if (deal) {
      setFormData({
        name: deal.name || '',
        value: deal.value ? (deal.value / 100).toString() : '0',
        macrosetor: deal.macrosetor || '',
        stage: deal.stage || ''
      });
    }
  }, [deal]);

  const updateDealMutation = useMutation({
    mutationFn: (updates: any) => 
      apiRequest('PATCH', `/api/deals/${deal.id}`, updates),
    onSuccess: () => {
      toast({
        title: "Negócio atualizado",
        description: "As informações do negócio foram atualizadas com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      queryClient.invalidateQueries({ queryKey: [`/api/contacts/${contactId}/deals`] });
      setIsOpen(false);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o negócio.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "O nome do negócio não pode estar vazio.",
        variant: "destructive",
      });
      return;
    }

    const updates = {
      name: formData.name.trim(),
      value: Math.round(parseFloat(formData.value || '0') * 100),
      macrosetor: formData.macrosetor,
      stage: formData.stage
    };

    updateDealMutation.mutate(updates);
  };

  const handleMacrosetorChange = (newMacrosetor: string) => {
    setFormData(prev => ({
      ...prev,
      macrosetor: newMacrosetor,
      stage: '' // Reset stage quando mudar macrosetor
    }));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100);
  };

  const getStageColor = (stage: string, macrosetor?: string) => {
    if (macrosetor) {
      const stages = getStagesForMacrosetor(macrosetor);
      const stageInfo = stages.find(s => s.id === stage);
      if (stageInfo) {
        const colorMap: Record<string, string> = {
          'bg-gray-500': 'bg-gray-100 text-gray-800',
          'bg-blue-500': 'bg-blue-100 text-blue-800',
          'bg-yellow-500': 'bg-yellow-100 text-yellow-800',
          'bg-orange-500': 'bg-orange-100 text-orange-800',
          'bg-green-500': 'bg-green-100 text-green-800',
          'bg-red-500': 'bg-red-100 text-red-800',
          'bg-purple-500': 'bg-purple-100 text-purple-800',
        };
        return colorMap[stageInfo.color] || 'bg-gray-100 text-gray-800';
      }
    }
    return 'bg-gray-100 text-gray-800';
  };

  if (!deal) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div className="group cursor-pointer border border-gray-200 rounded-lg p-3 bg-white hover:bg-gray-50 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="font-medium text-sm text-gray-900">{deal.name}</span>
            </div>
            <Edit2 className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          
          <div className="space-y-1">
            <div className="text-lg font-semibold text-green-600">
              {formatCurrency(deal.value)}
            </div>
            
            {deal.stage && (
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStageColor(deal.stage, deal.macrosetor)}`}>
                  {deal.stage.toUpperCase()}
                </span>
              </div>
            )}
            
            <div className="text-xs text-gray-500">
              Criado em {new Date(deal.createdAt).toLocaleDateString('pt-BR')}
            </div>
          </div>
        </div>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Negócio</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Nome do Negócio
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Interesse em MBA"
              disabled={updateDealMutation.isPending}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Valor
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.value}
                onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                className="pl-10"
                placeholder="0,00"
                disabled={updateDealMutation.isPending}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Funil de Vendas
            </label>
            <Select
              value={formData.macrosetor}
              onValueChange={handleMacrosetorChange}
              disabled={updateDealMutation.isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o funil" />
              </SelectTrigger>
              <SelectContent>
                {allMacrosetores.map((macro) => (
                  <SelectItem key={macro.id} value={macro.id}>
                    {macro.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.macrosetor && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Etapa do Negócio
              </label>
              <Select
                value={formData.stage}
                onValueChange={(value) => setFormData(prev => ({ ...prev, stage: value }))}
                disabled={updateDealMutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a etapa" />
                </SelectTrigger>
                <SelectContent>
                  {availableStages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={updateDealMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateDealMutation.isPending}
            >
              {updateDealMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}