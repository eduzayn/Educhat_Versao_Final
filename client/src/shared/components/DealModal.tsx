import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../lib/hooks/use-toast';
import { apiRequest } from '../lib/queryClient';
import { useDynamicFunnels } from '../../hooks/useDynamicFunnels';
import { getStagesForCategory } from '@/shared/lib/crmFunnels';

interface DealModalProps {
  mode: 'create' | 'edit';
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  deal?: any;
  contactId?: number;
  defaultFunnel?: string;
  defaultStage?: string;
  defaultTeamType?: string;
  onSuccess?: () => void;
}

export function DealModal({
  mode,
  isOpen,
  onOpenChange,
  deal,
  contactId,
  defaultFunnel,
  defaultStage,
  defaultTeamType = 'geral',
  onSuccess
}: DealModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    value: '0',
    category: '',
    stage: '',
    course: '',
    notes: '',
    probability: '50',
    expectedCloseDate: '',
    company: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: dynamicFunnels = [], isLoading: funnelsLoading } = useDynamicFunnels();
  const availableStages = formData.category ? getStagesForCategory(formData.category) : [];

  // Inicializar dados do formulário
  useEffect(() => {
    if (mode === 'edit' && deal) {
      setFormData({
        name: deal.name || '',
        value: deal.value ? (deal.value / 100).toString() : '0',
        category: deal.category || deal.teamType || '',
        stage: deal.stage || '',
        course: deal.course || '',
        notes: deal.notes || '',
        probability: deal.probability?.toString() || '50',
        expectedCloseDate: deal.expectedCloseDate || '',
        company: deal.company || ''
      });
    } else if (mode === 'create') {
      setFormData({
        name: '',
        value: '0',
        category: defaultFunnel || '',
        stage: defaultStage || '',
        course: '',
        notes: '',
        probability: '50',
        expectedCloseDate: '',
        company: ''
      });
    }
  }, [mode, deal, defaultFunnel, defaultStage, isOpen]);

  // Mutation para criar negócio
  const createDealMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/deals', data),
    onSuccess: () => {
      toast({
        title: "Negócio criado",
        description: "O negócio foi criado com sucesso.",
      });
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      if (contactId) {
        queryClient.invalidateQueries({ queryKey: [`/api/contacts/${contactId}/deals`] });
      }
      
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: "Não foi possível criar o negócio.",
        variant: "destructive",
      });
      console.error('Erro ao criar negócio:', error);
    }
  });

  // Mutation para editar negócio
  const editDealMutation = useMutation({
    mutationFn: (data: any) => apiRequest('PATCH', `/api/deals/${deal.id}`, data),
    onSuccess: () => {
      toast({
        title: "Negócio atualizado",
        description: "As informações do negócio foram atualizadas com sucesso.",
      });
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      if (contactId) {
        queryClient.invalidateQueries({ queryKey: [`/api/contacts/${contactId}/deals`] });
      }
      
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o negócio.",
        variant: "destructive",
      });
      console.error('Erro ao atualizar negócio:', error);
    }
  });

  const handleCategoryChange = (newCategory: string) => {
    setFormData(prev => ({
      ...prev,
      category: newCategory,
      stage: '' // Reset stage quando mudar categoria
    }));
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "O nome do negócio não pode estar vazio.",
        variant: "destructive",
      });
      return;
    }

    const data = {
      name: formData.name.trim(),
      value: Math.round(parseFloat(formData.value || '0') * 100),
      category: formData.category || null,
      teamType: formData.category || defaultTeamType, // Para compatibilidade
      stage: formData.stage || null,
      course: formData.course || null,
      notes: formData.notes || null,
      probability: parseInt(formData.probability) || 50,
      expectedCloseDate: formData.expectedCloseDate || null,
      company: formData.company || null,
      contactId: contactId || null,
      owner: 'Sistema'
    };

    if (mode === 'create') {
      createDealMutation.mutate(data);
    } else {
      editDealMutation.mutate(data);
    }
  };

  const isLoading = createDealMutation.isPending || editDealMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Criar negociação' : 'Editar Negócio'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="deal-name">Nome da negociação *</Label>
            <Input
              id="deal-name"
              placeholder="Digite o nome da negociação"
              value={formData.name}
              onChange={(e: any) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              disabled={isLoading}
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
                min="0"
                value={formData.value}
                onChange={(e: any) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                className="pl-10"
                placeholder="0,00"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Campo Empresa (apenas para CRM) */}
          {!contactId && (
            <div>
              <Label htmlFor="deal-company">Empresa (opcional)</Label>
              <Input
                id="deal-company"
                placeholder="Nome da empresa"
                value={formData.company}
                onChange={(e: any) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                disabled={isLoading}
              />
            </div>
          )}

          <div>
            <Label>Funil de vendas *</Label>
            <Select
              value={formData.category}
              onValueChange={handleCategoryChange}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o funil" />
              </SelectTrigger>
              <SelectContent>
                {funnelsLoading ? (
                  <SelectItem value="loading" disabled>
                    Carregando funis...
                  </SelectItem>
                ) : (
                  dynamicFunnels.map((category: any) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.info.name.toUpperCase()}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {formData.category && (
            <div>
              <Label>Etapa do funil</Label>
              <Select
                value={formData.stage}
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, stage: value }))}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Primeiro selecione o funil" />
                </SelectTrigger>
                <SelectContent>
                  {availableStages.map((stage: any) => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="deal-course">Curso de Interesse</Label>
            <Input
              id="deal-course"
              value={formData.course}
              onChange={(e: any) => setFormData(prev => ({ ...prev, course: e.target.value }))}
              placeholder="Ex: MBA em Gestão Empresarial"
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="deal-probability">Probabilidade (%)</Label>
            <Input
              id="deal-probability"
              type="number"
              min="0"
              max="100"
              value={formData.probability}
              onChange={(e: any) => setFormData(prev => ({ ...prev, probability: e.target.value }))}
              placeholder="50"
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="deal-date">Data Prevista de Fechamento</Label>
            <Input
              id="deal-date"
              type="date"
              value={formData.expectedCloseDate}
              onChange={(e: any) => setFormData(prev => ({ ...prev, expectedCloseDate: e.target.value }))}
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="deal-notes">Observações</Label>
            <Textarea
              id="deal-notes"
              value={formData.notes}
              onChange={(e: any) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Detalhes adicionais sobre o negócio..."
              className="min-h-[80px]"
              disabled={isLoading}
            />
          </div>

          {mode === 'create' && formData.category && (
            <div className="text-sm text-muted-foreground">
              O negócio será criado no estágio: {
                formData.stage 
                  ? availableStages.find((s: any) => s.id === formData.stage)?.name
                  : availableStages[0]?.name || 'Primeiro estágio'
              } ({formData.category.toUpperCase()})
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !formData.name.trim()}
            >
              {isLoading 
                ? (mode === 'create' ? 'Criando...' : 'Salvando...') 
                : (mode === 'create' ? 'Criar' : 'Salvar')
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}