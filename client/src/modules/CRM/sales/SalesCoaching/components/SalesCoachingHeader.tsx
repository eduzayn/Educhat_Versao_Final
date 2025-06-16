import { Button } from '@/shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Dialog, DialogTrigger } from '@/shared/ui/dialog';
import { Plus } from 'lucide-react';

interface SalesCoachingHeaderProps {
  selectedSalesperson: string;
  onSalespersonChange: (value: string) => void;
  salespeople: Array<{ id: number; name: string }>;
  canCreateRecords: boolean;
  isDialogOpen: boolean;
  onDialogOpenChange: (open: boolean) => void;
  onNewRecordClick: () => void;
}

export function SalesCoachingHeader({
  selectedSalesperson,
  onSalespersonChange,
  salespeople,
  canCreateRecords,
  isDialogOpen,
  onDialogOpenChange,
  onNewRecordClick
}: SalesCoachingHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h2 className="text-2xl font-bold">Coaching de Vendas</h2>
        <p className="text-muted-foreground">Acompanhe o desenvolvimento da equipe de vendas</p>
      </div>

      <div className="flex items-center gap-3">
        <Select value={selectedSalesperson} onValueChange={onSalespersonChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todos vendedores" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos vendedores</SelectItem>
            {salespeople?.map((person) => (
              <SelectItem key={person.id} value={person.id.toString()}>
                {person.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {canCreateRecords && (
          <Dialog open={isDialogOpen} onOpenChange={onDialogOpenChange}>
            <DialogTrigger asChild>
              <Button onClick={onNewRecordClick}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Registro
              </Button>
            </DialogTrigger>
          </Dialog>
        )}
      </div>
    </div>
  );
}
