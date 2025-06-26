import React, { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Edit2, Check, X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/shared/lib/hooks/use-toast';

interface InlineContactNameEditProps {
  contactId: number;
  currentName: string;
  className?: string;
}

export function InlineContactNameEdit({ 
  contactId, 
  currentName, 
  className = "" 
}: InlineContactNameEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(currentName);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateNameMutation = useMutation({
    mutationFn: (newName: string) => 
      apiRequest('PATCH', `/api/contacts/${contactId}`, { name: newName }),
    onSuccess: () => {
      toast({
        title: "Nome atualizado",
        description: "Nome do contato foi atualizado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      queryClient.invalidateQueries({ queryKey: [`/api/contacts/${contactId}`] });
      setIsEditing(false);
    },
    onError: (error: any) => {
      let errorMessage = "Não foi possível atualizar o nome do contato.";
      
      // Captura mensagem específica do erro da API
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      toast({
        title: "Erro ao atualizar nome",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!editValue.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "O nome não pode estar vazio.",
        variant: "destructive",
      });
      return;
    }
    
    if (editValue.trim() === currentName) {
      setIsEditing(false);
      return;
    }

    updateNameMutation.mutate(editValue.trim());
  };

  const handleCancel = () => {
    setEditValue(currentName);
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyPress}
          className="flex-1 h-8 text-lg font-semibold"
          autoFocus
          disabled={updateNameMutation.isPending}
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSave}
          disabled={updateNameMutation.isPending}
          className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
        >
          <Check className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          disabled={updateNameMutation.isPending}
          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`group flex items-center space-x-2 ${className}`}>
      <h3 className="font-semibold text-lg text-gray-900 flex-1">
        {currentName}
      </h3>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setIsEditing(true)}
        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-50"
      >
        <Edit2 className="w-4 h-4" />
      </Button>
    </div>
  );
}