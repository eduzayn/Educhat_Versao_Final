import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Target } from "lucide-react";

interface SalesDashboardGoalsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SalesDashboardGoalsDialog({ 
  open, 
  onOpenChange 
}: SalesDashboardGoalsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Definir Metas de Vendas
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="monthly-goal">Meta Mensal (R$)</Label>
            <Input id="monthly-goal" placeholder="Ex: 50.000" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quarterly-goal">Meta Trimestral (R$)</Label>
            <Input id="quarterly-goal" placeholder="Ex: 150.000" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="team-goal">Meta da Equipe (%)</Label>
            <Input id="team-goal" placeholder="Ex: 120" />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            Salvar Metas
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 