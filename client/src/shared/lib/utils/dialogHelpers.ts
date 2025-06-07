import { useState } from 'react';

/**
 * Utilitários para diálogos e modais reutilizáveis
 */

export interface DialogState {
  isOpen: boolean;
  editingItem: any | null;
}

// Hook para gerenciar estado de diálogos
export const useDialogState = (initialState: Partial<DialogState> = {}) => {
  const [state, setState] = useState<DialogState>({
    isOpen: false,
    editingItem: null,
    ...initialState
  });

  const openDialog = (item?: any) => {
    setState({
      isOpen: true,
      editingItem: item || null
    });
  };

  const closeDialog = () => {
    setState({
      isOpen: false,
      editingItem: null
    });
  };

  const isEditing = Boolean(state.editingItem);

  return {
    ...state,
    openDialog,
    closeDialog,
    isEditing
  };
};

// Tipos para configuração de diálogos
export interface DialogConfig {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

// Configurações padrão para diferentes tipos de diálogos
export const DIALOG_CONFIGS = {
  create: {
    title: 'Criar Novo Item',
    confirmText: 'Criar',
    cancelText: 'Cancelar'
  },
  edit: {
    title: 'Editar Item',
    confirmText: 'Salvar',
    cancelText: 'Cancelar'
  },
  delete: {
    title: 'Confirmar Exclusão',
    description: 'Esta ação não pode ser desfeita.',
    confirmText: 'Excluir',
    cancelText: 'Cancelar',
    variant: 'destructive' as const
  }
};

// Helper para criar configurações dinâmicas de diálogo
export const createDialogConfig = (
  type: keyof typeof DIALOG_CONFIGS,
  overrides: Partial<DialogConfig> = {}
): DialogConfig => ({
  ...DIALOG_CONFIGS[type],
  ...overrides
});