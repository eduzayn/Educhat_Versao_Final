import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog';
import { Label } from '@/shared/ui/label';
import { Edit, DollarSign, TrendingUp } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/shared/lib/hooks/use-toast';
import { getAllMacrosetores, getStagesForMacrosetor } from '@/lib/crmFunnels';

interface Deal {
  id: number;
  name: string;
  value: number;
  stage: string;
  macrosetor?: string;
  description?: string;
  probability?: number;
}

interface InlineDealEditProps {
  deal: Deal;
}

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
        'bg-green-500': 'bg-green-100 text-green-800',
        'bg-red-500': 'bg-red-100 text-red-800',
        'bg-purple-500': 'bg-purple-100 text-purple-800',
        'bg-orange-500': 'bg-orange-100 text-orange-800',
      };
      return colorMap[stageInfo.color] || 'bg-gray-100 text-gray-800';
    }
  }
  return 'bg-gray-100 text-gray-800';
};

export function InlineDealEdit({ deal }: InlineDealEditProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: deal.name,
    value: (deal.value / 100).toString(),
    stage: deal.stage,
    macrosetor: deal.macrosetor || '',
    description: deal.description || '',
    probability: deal.probability?.toString() || '50'
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateDealMutation = useMutation({
    mutationFn: (data: any) => apiRequest('PUT', `/api/deals/${deal.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      queryClient.invalidateQueries({ queryKey: [`/api/contacts/${deal.contactId}/deals`] });
      setIsOpen(false);
      toast({
        title: 'Negócio atualizado',
        description: 'As informações do negócio foram atualizadas com sucesso',
      });
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar negócio:', error);
      toast({
        title: 'Erro ao atualizar',
        description: error?.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  });

  const handleSave = () => {
    const data: any = {
      name: formData.name.trim(),
      value: Math.round(parseFloat(formData.value) * 100),
      stage: formData.stage,
      probability: parseInt(formData.probability)
    };

    if (formData.macrosetor) {
      data.macrosetor = formData.macrosetor;
    }

    if (formData.description.trim()) {
      data.description = formData.description.trim();
    }

    updateDealMutation.mutate(data);
  };

  const availableStages = formData.macrosetor 
    ? getStagesForMacrosetor(formData.macrosetor)
    : [];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
        >
          <Edit className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Negócio</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="deal-name">Nome do Negócio</Label>
            <Input
              id="deal-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nome do negócio"
            />
          </div>

          <div>
            <Label htmlFor="deal-value">Valor</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="deal-value"
                type="number"
                step="0.01"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                className="pl-10"
                placeholder="0,00"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="deal-macrosetor">Macrosetor</Label>
            <Select 
              value={formData.macrosetor} 
              onValueChange={(value) => setFormData({ ...formData, macrosetor: value, stage: '' })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o macrosetor" />
              </SelectTrigger>
              <SelectContent>
                {getAllMacrosetores().map((macro) => (
                  <SelectItem key={macro.id} value={macro.id}>
                    {macro.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.macrosetor && availableStages.length > 0 && (
            <div>
              <Label htmlFor="deal-stage">Status</Label>
              <Select 
                value={formData.stage} 
                onValueChange={(value) => setFormData({ ...formData, stage: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
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

          <div>
            <Label htmlFor="deal-probability">Probabilidade (%)</Label>
            <div className="relative">
              <TrendingUp className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="deal-probability"
                type="number"
                min="0"
                max="100"
                value={formData.probability}
                onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
                className="pl-10"
                placeholder="50"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="deal-description">Descrição</Label>
            <Textarea
              id="deal-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrição opcional do negócio"
              rows={3}
            />
          </div>

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
              disabled={updateDealMutation.isPending || !formData.name.trim()}
            >
              {updateDealMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}