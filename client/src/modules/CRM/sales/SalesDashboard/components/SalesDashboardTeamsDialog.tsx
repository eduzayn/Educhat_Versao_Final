import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';
import { Users, Target, BarChart3 } from "lucide-react";

interface SalesDashboardTeamsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeSalespeople: number;
}

export function SalesDashboardTeamsDialog({ 
  open, 
  onOpenChange,
  activeSalespeople
}: SalesDashboardTeamsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-600" />
            Gerenciar Equipe de Vendas
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Vendedores Ativos</h4>
              <div className="text-2xl font-bold text-green-600">
                {activeSalespeople}
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Performance Média</h4>
              <div className="text-2xl font-bold text-blue-600">85%</div>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Ações da Equipe</Label>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Users className="h-4 w-4 mr-2" />
                Ver Performance Individual
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Target className="h-4 w-4 mr-2" />
                Definir Metas por Vendedor
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <BarChart3 className="h-4 w-4 mr-2" />
                Relatório de Produtividade
              </Button>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 