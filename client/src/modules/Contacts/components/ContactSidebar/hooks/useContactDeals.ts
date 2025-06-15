import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface DealFormData {
  name: string;
  value: string;
  team: string;
  stage: string;
  category: string;
  course: string;
}

export const useContactDeals = () => {
  const [showDealDialog, setShowDealDialog] = useState(false);
  const [editingDeal, setEditingDeal] = useState<any>(null);
  const [editingDealData, setEditingDealData] = useState<any>({});
  const [dealFormData, setDealFormData] = useState<DealFormData>({
    name: '',
    value: '',
    team: 'comercial',
    stage: 'prospecting',
    category: '',
    course: ''
  });

  const queryClient = useQueryClient();

  const createDealMutation = useMutation({
    mutationFn: (data: any) => apiRequest('POST', '/api/deals', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      setShowDealDialog(false);
      resetDealForm();
    },
    onError: (error: any) => {
      console.error('Erro ao criar negócio:', error);
    }
  });

  const updateDealMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest('PUT', `/api/deals/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      setEditingDeal(null);
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar negócio:', error);
    }
  });

  const resetDealForm = () => {
    setDealFormData({
      name: '',
      value: '',
      team: 'comercial',
      stage: 'prospecting',
      category: '',
      course: ''
    });
  };

  const handleCreateDeal = (contactId: number) => {
    if (!dealFormData.name.trim()) return;

    const data = {
      name: dealFormData.name,
      contactId,
      value: dealFormData.value ? Math.round(parseFloat(dealFormData.value) * 100) : 0,
      teamType: dealFormData.team,
      stage: dealFormData.stage,
      category: dealFormData.category || null,
      course: dealFormData.course || null,
      probability: 50,
      owner: 'Sistema'
    };

    createDealMutation.mutate(data);
  };

  const handleUpdateDeal = (deal: any, updates: any) => {
    const data: any = {};
    
    if (updates.value !== undefined) {
      data.value = Math.round(parseFloat(updates.value) * 100);
    }
    
    if (updates.stage !== undefined) {
      data.stage = updates.stage;
    }

    updateDealMutation.mutate({ id: deal.id, data });
  };

  return {
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
  };
};