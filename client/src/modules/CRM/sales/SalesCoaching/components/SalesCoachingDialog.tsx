import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useFormSubmission, formatCoachingData } from '@/shared/lib/utils/formHelpers';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { CoachingRecord } from '@/shared/lib/types/sales';

interface SalesCoachingDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editingRecord: CoachingRecord | null;
  salespeople: Array<{ id: number; name: string }>;
}

export function SalesCoachingDialog({
  isOpen,
  onOpenChange,
  editingRecord,
  salespeople
}: SalesCoachingDialogProps) {
  const queryClient = useQueryClient();

  // Mutation para salvar registro de coaching
  const coachingMutation = useMutation({
    mutationFn: async (recordData: any) => {
      const url = editingRecord ? `/api/sales/coaching/${editingRecord.id}` : '/api/sales/coaching';
      const method = editingRecord ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recordData)
      });
      
      if (!response.ok) throw new Error('Erro ao salvar registro');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sales/coaching'] });
      onOpenChange(false);
    }
  });

  const { handleFormSubmit } = useFormSubmission();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const recordData = formatCoachingData(formData);

    handleFormSubmit(coachingMutation, recordData, {
      successMessage: "Registro de coaching salvo com sucesso",
      errorMessage: "Erro ao salvar registro de coaching",
      onSuccess: () => onOpenChange(false)
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingRecord ? 'Editar Registro' : 'Novo Registro de Coaching'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="salespersonId">Vendedor</Label>
            <Select name="salespersonId" defaultValue={editingRecord?.salespersonId.toString()}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um vendedor" />
              </SelectTrigger>
              <SelectContent>
                {salespeople?.map((person) => (
                  <SelectItem key={person.id} value={person.id.toString()}>
                    {person.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="type">Tipo</Label>
            <Select name="type" defaultValue={editingRecord?.type || 'feedback'}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="feedback">Feedback</SelectItem>
                <SelectItem value="goal">Meta Comportamental</SelectItem>
                <SelectItem value="training">Treinamento</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="title">Título</Label>
            <Input
              name="title"
              defaultValue={editingRecord?.title}
              placeholder="Ex: Melhoria no tempo de resposta"
              required
            />
          </div>

          <div>
            <Label htmlFor="content">Conteúdo</Label>
            <Textarea
              name="content"
              defaultValue={editingRecord?.content}
              placeholder="Descrição detalhada do coaching..."
              rows={4}
              required
            />
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select name="status" defaultValue={editingRecord?.status || 'pending'}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="in_progress">Em Andamento</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={coachingMutation.isPending}>
              {coachingMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 