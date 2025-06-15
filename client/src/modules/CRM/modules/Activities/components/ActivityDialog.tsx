import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';
import React from 'react';

interface ActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activityForm: any;
  setActivityForm: (form: any) => void;
  onSubmit: () => void;
  isEdit?: boolean;
}

export const ActivityDialog: React.FC<ActivityDialogProps> = ({ open, onOpenChange, activityForm, setActivityForm, onSubmit, isEdit }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Editar Atividade' : 'Nova Atividade'}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Título</Label>
          <Input
            id="title"
            value={activityForm.title}
            onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })}
            placeholder="Digite o título da atividade"
          />
        </div>
        <div>
          <Label htmlFor="type">Tipo</Label>
          <Select value={activityForm.type} onValueChange={(value) => setActivityForm({ ...activityForm, type: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="call">Ligação</SelectItem>
              <SelectItem value="meeting">Reunião</SelectItem>
              <SelectItem value="email">E-mail</SelectItem>
              <SelectItem value="task">Tarefa</SelectItem>
              <SelectItem value="message">Mensagem</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="contact">Contato</Label>
          <Input
            id="contact"
            value={activityForm.contact}
            onChange={(e) => setActivityForm({ ...activityForm, contact: e.target.value })}
            placeholder="Nome do contato"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              value={activityForm.date}
              onChange={(e) => setActivityForm({ ...activityForm, date: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="time">Horário</Label>
            <Input
              id="time"
              type="time"
              value={activityForm.time}
              onChange={(e) => setActivityForm({ ...activityForm, time: e.target.value })}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="priority">Prioridade</Label>
          <Select value={activityForm.priority} onValueChange={(value) => setActivityForm({ ...activityForm, priority: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Baixa</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            value={activityForm.description}
            onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
            placeholder="Descreva a atividade..."
            rows={3}
          />
        </div>
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={onSubmit}
            disabled={!activityForm.title || !activityForm.type}
            className="flex-1"
          >
            {isEdit ? 'Atualizar Atividade' : 'Criar Atividade'}
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
); 