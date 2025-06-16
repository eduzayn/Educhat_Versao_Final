import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';

interface Territory {
  id: number;
  name: string;
  description: string;
  states: string[];
  cities: string[];
  salespeople: string[];
  leadsCount: number;
  salesCount: number;
  salesValue: number;
  isActive: boolean;
}

interface SalesTerritoriesDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  territory: Territory | null;
  salespeople: any[];
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isSubmitting: boolean;
}

export function SalesTerritoriesDialog({
  isOpen,
  onOpenChange,
  territory,
  salespeople,
  onSubmit,
  isSubmitting
}: SalesTerritoriesDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {territory ? 'Editar Território' : 'Novo Território'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome do Território</Label>
            <Input
              name="name"
              defaultValue={territory?.name}
              placeholder="Ex: Região Sudeste"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              name="description"
              defaultValue={territory?.description}
              placeholder="Descrição do território"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="states">Estados (separados por vírgula)</Label>
            <Input
              name="states"
              defaultValue={territory?.states?.join(', ')}
              placeholder="SP, RJ, MG, ES"
            />
          </div>

          <div>
            <Label htmlFor="cities">Cidades Principais (separadas por vírgula)</Label>
            <Input
              name="cities"
              defaultValue={territory?.cities?.join(', ')}
              placeholder="São Paulo, Rio de Janeiro, Belo Horizonte"
            />
          </div>

          <div>
            <Label>Vendedores Responsáveis</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {salespeople?.map((person) => (
                <label key={person.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="salespeople"
                    value={person.id}
                    defaultChecked={territory?.salespeople?.includes(person.id.toString())}
                    className="rounded"
                  />
                  <span className="text-sm">{person.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="isActive"
              id="isActive"
              defaultChecked={territory?.isActive ?? true}
              className="rounded"
            />
            <Label htmlFor="isActive">Território ativo</Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 