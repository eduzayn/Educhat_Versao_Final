import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Edit, Check, X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/shared/lib/hooks/use-toast';

interface InlineEditFieldProps {
  label: string;
  value: string;
  contactId: number;
  field: 'educationalBackground' | 'educationalInterest';
  type?: 'text' | 'select';
  options?: string[];
  placeholder?: string;
}

export function InlineEditField({ 
  label, 
  value, 
  contactId, 
  field, 
  type = 'text',
  options = [],
  placeholder 
}: InlineEditFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateContactMutation = useMutation({
    mutationFn: (data: any) => apiRequest('PUT', `/api/contacts/${contactId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      queryClient.invalidateQueries({ queryKey: [`/api/contacts/${contactId}`] });
      setIsEditing(false);
      toast({
        title: 'Campo atualizado',
        description: `${label} foi atualizado com sucesso`,
      });
    },
    onError: (error: any) => {
      console.error('Erro ao atualizar campo:', error);
      toast({
        title: 'Erro ao atualizar',
        description: error?.message || 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  });

  const handleSave = () => {
    if (editValue.trim() === value) {
      setIsEditing(false);
      return;
    }

    updateContactMutation.mutate({
      [field]: editValue.trim()
    });
  };

  const handleCancel = () => {
    setEditValue(value || '');
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm text-gray-900">{label}</h4>
        </div>
        
        <div className="flex items-center space-x-2">
          {type === 'select' && options.length > 0 ? (
            <Select value={editValue} onValueChange={setEditValue}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={placeholder || `Selecione ${label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum identificado</SelectItem>
                {options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder={placeholder || `Digite ${label.toLowerCase()}`}
              className="flex-1"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSave();
                }
                if (e.key === 'Escape') {
                  handleCancel();
                }
              }}
              autoFocus
            />
          )}
          
          <Button
            size="sm"
            onClick={handleSave}
            disabled={updateContactMutation.isPending}
            className="h-8 w-8 p-0"
          >
            <Check className="h-4 w-4" />
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            disabled={updateContactMutation.isPending}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm text-gray-900">{label}</h4>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsEditing(true)}
          className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
        >
          <Edit className="h-3 w-3" />
        </Button>
      </div>
      
      <div className="text-sm text-gray-600">
        {value || 'Nenhuma informação identificada'}
      </div>
    </div>
  );
}