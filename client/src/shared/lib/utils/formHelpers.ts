import { useToast } from '@/shared/lib/hooks/use-toast';

/**
 * Utilitários para formulários reutilizáveis
 */

// Tipos genéricos para formulários
export interface FormSubmissionOptions {
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

// Helper para extrair dados de FormData
export const extractFormData = (formData: FormData, fields: string[]): Record<string, any> => {
  const data: Record<string, any> = {};
  
  fields.forEach(field => {
    const value = formData.get(field);
    if (value !== null) {
      data[field] = value;
    }
  });
  
  return data;
};

// Helper para validar campos obrigatórios
export const validateRequiredFields = (data: Record<string, any>, requiredFields: string[]): string | null => {
  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
      return `Campo ${field} é obrigatório`;
    }
  }
  return null;
};

// Helper para processamento de arrays de strings separadas por vírgula
export const parseCommaSeparatedArray = (value: string | null): string[] => {
  if (!value) return [];
  return value.split(',').map(item => item.trim()).filter(Boolean);
};

// Hook customizado para submissão de formulários
export const useFormSubmission = () => {
  const { toast } = useToast();

  const handleFormSubmit = async (
    mutation: any,
    formData: Record<string, any>,
    options: FormSubmissionOptions = {}
  ) => {
    const {
      successMessage = "Operação realizada com sucesso",
      errorMessage = "Erro ao realizar operação",
      onSuccess,
      onError
    } = options;

    try {
      await mutation.mutateAsync(formData);
      
      toast({
        title: "Sucesso",
        description: successMessage,
      });
      
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
      
      onError?.(error);
    }
  };

  return { handleFormSubmit };
};

// Helper para formatar dados de vendas
export const formatSalesData = (formData: FormData) => ({
  salespersonId: parseInt(formData.get('salespersonId') as string),
  targetValue: parseFloat(formData.get('targetValue') as string),
  period: formData.get('period') as string,
  startDate: formData.get('startDate') as string,
  endDate: formData.get('endDate') as string
});

// Helper para formatar dados de território
export const formatTerritoryData = (formData: FormData) => ({
  name: formData.get('name') as string,
  description: formData.get('description') as string,
  states: parseCommaSeparatedArray(formData.get('states') as string),
  cities: parseCommaSeparatedArray(formData.get('cities') as string),
  salespeople: Array.from(formData.getAll('salespeople')),
  isActive: formData.get('isActive') === 'on'
});

// Helper para formatar dados de coaching
export const formatCoachingData = (formData: FormData) => ({
  salespersonId: parseInt(formData.get('salespersonId') as string),
  type: formData.get('type') as string,
  title: formData.get('title') as string,
  content: formData.get('content') as string,
  status: (formData.get('status') as string) || 'pending'
});