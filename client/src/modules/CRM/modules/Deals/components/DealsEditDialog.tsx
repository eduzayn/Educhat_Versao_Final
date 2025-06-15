import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import type { Deal } from '@shared/schema';

interface DealsEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDealForEdit: Deal | null;
  updateFullDealMutation: { isPending: boolean; mutate: (dealData: any) => void };
  setIsEditDealDialogOpen: (open: boolean) => void;
}

export const DealsEditDialog: React.FC<DealsEditDialogProps> = ({
  open,
  onOpenChange,
  selectedDealForEdit,
  updateFullDealMutation,
  setIsEditDealDialogOpen
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Editar Negócio</DialogTitle>
      </DialogHeader>
      {selectedDealForEdit && (
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const dealData = {
            id: selectedDealForEdit.id,
            name: formData.get('name') as string,
            company: formData.get('company') as string,
            value: parseFloat(formData.get('value') as string),
            probability: parseInt(formData.get('probability') as string),
            description: formData.get('description') as string,
            team: selectedDealForEdit.team,
            stage: selectedDealForEdit.stage
          };
          updateFullDealMutation.mutate(dealData);
        }} className="space-y-4">
          <div>
            <Label htmlFor="edit-name">Nome do Negócio</Label>
            <Input
              name="name"
              defaultValue={selectedDealForEdit.name}
              placeholder="Ex: Curso de Programação - João Silva"
              required
            />
          </div>

          <div>
            <Label htmlFor="edit-company">Empresa/Cliente</Label>
            <Input
              name="company"
              defaultValue={selectedDealForEdit.company}
              placeholder="Ex: João Silva"
              required
            />
          </div>

          <div>
            <Label htmlFor="edit-value">Valor (R$)</Label>
            <Input
              name="value"
              type="number"
              step="0.01"
              defaultValue={selectedDealForEdit.value ?? ''}
              placeholder="0,00"
              required
            />
          </div>

          <div>
            <Label htmlFor="edit-probability">Probabilidade (%)</Label>
            <Input
              name="probability"
              type="number"
              min="0"
              max="100"
              defaultValue={selectedDealForEdit.probability ?? ''}
              required
            />
          </div>

          <div>
            <Label htmlFor="edit-description">Descrição</Label>
            <Textarea
              name="description"
              defaultValue={selectedDealForEdit.description || ''}
              placeholder="Detalhes sobre o negócio..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsEditDealDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateFullDealMutation.isPending}>
              {updateFullDealMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      )}
    </DialogContent>
  </Dialog>
); 