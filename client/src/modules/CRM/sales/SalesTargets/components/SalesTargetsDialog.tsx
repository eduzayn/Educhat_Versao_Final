import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Label } from '@/shared/ui/label';
import { SalesTarget } from '@/shared/lib/types/sales';

interface SalesTargetsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  editingTarget: SalesTarget | null;
  salespeople: any[];
  isPending: boolean;
}

export function SalesTargetsDialog({ isOpen, onClose, onSubmit, editingTarget, salespeople, isPending }: SalesTargetsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingTarget ? 'Editar Meta' : 'Nova Meta de Vendas'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="salespersonId">Vendedor</Label>
            <Select name="salespersonId" defaultValue={editingTarget?.salespersonId.toString()}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um vendedor" />
              </SelectTrigger>
              <SelectContent>
                {salespeople?.map((person: any) => (
                  <SelectItem key={person.id} value={person.id.toString()}>
                    {person.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="targetValue">Valor da Meta (R$)</Label>
            <Input
              name="targetValue"
              type="number"
              step="0.01"
              defaultValue={editingTarget?.targetValue}
              placeholder="Ex: 50000"
              required
            />
          </div>

          <div>
            <Label htmlFor="period">Período</Label>
            <Select name="period" defaultValue={editingTarget?.period || 'month'}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Semanal</SelectItem>
                <SelectItem value="month">Mensal</SelectItem>
                <SelectItem value="quarter">Trimestral</SelectItem>
                <SelectItem value="year">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Data de Início</Label>
              <Input
                name="startDate"
                type="date"
                defaultValue={editingTarget?.startDate}
                required
              />
            </div>
            <div>
              <Label htmlFor="endDate">Data Final</Label>
              <Input
                name="endDate"
                type="date"
                defaultValue={editingTarget?.endDate}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Salvando...' : 'Salvar Meta'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 