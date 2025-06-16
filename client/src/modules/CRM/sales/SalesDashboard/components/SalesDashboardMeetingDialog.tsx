import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Calendar } from "lucide-react";

interface SalesDashboardMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SalesDashboardMeetingDialog({ 
  open, 
  onOpenChange 
}: SalesDashboardMeetingDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            Agendar Reunião
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="meeting-title">Título da Reunião</Label>
            <Input id="meeting-title" placeholder="Ex: Revisão de Metas Mensais" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="meeting-date">Data</Label>
            <Input id="meeting-date" type="date" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="meeting-time">Horário</Label>
            <Input id="meeting-time" type="time" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="meeting-participants">Participantes</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar equipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toda equipe de vendas</SelectItem>
                <SelectItem value="managers">Apenas gerentes</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            Agendar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 