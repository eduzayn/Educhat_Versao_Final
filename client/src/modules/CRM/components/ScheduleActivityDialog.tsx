import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/shared/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { Check, ChevronsUpDown } from "lucide-react";
import { useToast } from '@/shared/lib/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { format, addDays, startOfWeek, addMinutes, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock, User, Users, Phone, Video, MessageSquare } from "lucide-react";

interface ScheduleActivityDialogProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedContactId?: number;
}

export function ScheduleActivityDialog({ isOpen, onClose, preselectedContactId }: ScheduleActivityDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    contactId: preselectedContactId || 0 as number,
    activityType: 'call',
    date: '',
    time: '',
    duration: '30',
    priority: 'normal',
    reminderMinutes: '15',
    location: '',
    meetingLink: ''
  });

  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [openContactSelect, setOpenContactSelect] = useState(false);

  // Buscar contatos para seleção
  const { data: contacts = [] } = useQuery<Array<{id: number, name: string, phone?: string, email?: string}>>({
    queryKey: ['/api/contacts/search'],
    enabled: isOpen && !preselectedContactId,
  });

  // Gerar horários disponíveis
  const generateTimeSlots = () => {
    const slots = [];
    const startHour = 8; // 8:00
    const endHour = 18; // 18:00
    const interval = 30; // 30 minutos
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += interval) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  // Mutation para criar atividade
  const createActivityMutation = useMutation({
    mutationFn: async (activityData: any) => {
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activityData),
      });
      if (!response.ok) {
        throw new Error('Erro ao agendar atividade');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Atividade agendada",
        description: "A atividade foi agendada com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível agendar a atividade.",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setForm({
      title: '',
      description: '',
      contactId: preselectedContactId || 0 as number,
      activityType: 'call',
      date: '',
      time: '',
      duration: '30',
      priority: 'normal',
      reminderMinutes: '15',
      location: '',
      meetingLink: ''
    });
    setSelectedTimeSlot('');
    onClose();
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTimeSlot(time);
    setForm({ ...form, time });
  };

  const handleSubmit = () => {
    if (!form.title.trim() || !form.date || !form.time) {
      toast({
        title: "Erro",
        description: "Título, data e horário são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const activityData = {
      title: form.title,
      description: form.description,
      contactId: form.contactId > 0 ? form.contactId : null,
      activityType: form.activityType,
      scheduledAt: `${form.date}T${form.time}:00`,
      duration: parseInt(form.duration),
      priority: form.priority,
      reminderMinutes: parseInt(form.reminderMinutes),
      location: form.location || null,
      meetingLink: form.meetingLink || null,
    };

    createActivityMutation.mutate(activityData);
  };

  const timeSlots = generateTimeSlots();
  const today = new Date();
  const minDate = format(today, 'yyyy-MM-dd');

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Agendar Atividade
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Coluna Esquerda - Informações Básicas */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Título da Atividade *
              </label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ex: Ligação de follow-up"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Tipo de Atividade
              </label>
              <Select value={form.activityType} onValueChange={(value) => setForm({ ...form, activityType: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Ligação
                    </div>
                  </SelectItem>
                  <SelectItem value="meeting">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Reunião Presencial
                    </div>
                  </SelectItem>
                  <SelectItem value="video_call">
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      Videochamada
                    </div>
                  </SelectItem>
                  <SelectItem value="message">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Envio de Mensagem
                    </div>
                  </SelectItem>
                  <SelectItem value="email">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Envio de E-mail
                    </div>
                  </SelectItem>
                  <SelectItem value="follow_up">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Follow-up
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!preselectedContactId && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Contato
                </label>
                <Popover open={openContactSelect} onOpenChange={setOpenContactSelect}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openContactSelect}
                      className="w-full justify-between"
                    >
                      {form.contactId && form.contactId > 0
                        ? (() => {
                            const selectedContact = contacts.find((contact) => contact.id === form.contactId);
                            return selectedContact ? `${selectedContact.name}${selectedContact.phone ? ` (${selectedContact.phone})` : ''}` : "Contato não encontrado";
                          })()
                        : "Selecione um contato"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Digite o nome do contato..." className="h-9" />
                      <CommandList>
                        <CommandEmpty>Nenhum contato encontrado.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            onSelect={() => {
                              setForm({ ...form, contactId: 0 });
                              setOpenContactSelect(false);
                            }}
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${form.contactId === 0 ? "opacity-100" : "opacity-0"}`}
                            />
                            Nenhum contato selecionado
                          </CommandItem>
                          {contacts.length > 0 && contacts.map((contact) => (
                            <CommandItem
                              key={contact.id}
                              onSelect={() => {
                                setForm({ ...form, contactId: contact.id });
                                setOpenContactSelect(false);
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${form.contactId === contact.id ? "opacity-100" : "opacity-0"}`}
                              />
                              {contact.name} {contact.phone && `(${contact.phone})`}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Duração (min)
                </label>
                <Select value={form.duration} onValueChange={(value) => setForm({ ...form, duration: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 min</SelectItem>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="45">45 min</SelectItem>
                    <SelectItem value="60">1 hora</SelectItem>
                    <SelectItem value="90">1h 30min</SelectItem>
                    <SelectItem value="120">2 horas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Prioridade
                </label>
                <Select value={form.priority} onValueChange={(value) => setForm({ ...form, priority: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">
                      <span className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        Baixa
                      </span>
                    </SelectItem>
                    <SelectItem value="normal">
                      <span className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                        Normal
                      </span>
                    </SelectItem>
                    <SelectItem value="high">
                      <span className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                        Alta
                      </span>
                    </SelectItem>
                    <SelectItem value="urgent">
                      <span className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        Urgente
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(form.activityType === 'meeting' || form.activityType === 'video_call') && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  {form.activityType === 'meeting' ? 'Local da Reunião' : 'Link da Videochamada'}
                </label>
                <Input
                  value={form.activityType === 'meeting' ? form.location : form.meetingLink}
                  onChange={(e) => setForm({ 
                    ...form, 
                    [form.activityType === 'meeting' ? 'location' : 'meetingLink']: e.target.value 
                  })}
                  placeholder={
                    form.activityType === 'meeting' 
                      ? "Ex: Sala de reuniões, Endereço..." 
                      : "Ex: https://meet.google.com/..."
                  }
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Lembrete
              </label>
              <Select value={form.reminderMinutes} onValueChange={(value) => setForm({ ...form, reminderMinutes: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Sem lembrete</SelectItem>
                  <SelectItem value="5">5 minutos antes</SelectItem>
                  <SelectItem value="15">15 minutos antes</SelectItem>
                  <SelectItem value="30">30 minutos antes</SelectItem>
                  <SelectItem value="60">1 hora antes</SelectItem>
                  <SelectItem value="1440">1 dia antes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Descrição
              </label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Detalhes adicionais sobre a atividade..."
                rows={3}
              />
            </div>
          </div>

          {/* Coluna Direita - Agenda */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Data *
              </label>
              <Input
                type="date"
                value={form.date}
                min={minDate}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Horário Disponível *
              </label>
              
              <div className="border rounded-lg p-4 bg-gray-50 max-h-64 overflow-y-auto">
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => handleTimeSelect(time)}
                      className={`
                        px-3 py-2 rounded-md text-sm font-medium transition-all duration-200
                        ${selectedTimeSlot === time
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-white border border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-300'
                        }
                      `}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
              
              {selectedTimeSlot && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-800">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">Horário selecionado:</span>
                    <span className="font-bold">{selectedTimeSlot}</span>
                  </div>
                  {form.date && (
                    <div className="text-sm text-blue-600 mt-1">
                      {format(parseISO(form.date), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Resumo da Atividade */}
            {form.title && form.date && selectedTimeSlot && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">Resumo da Atividade</h4>
                <div className="space-y-1 text-sm text-green-700">
                  <div><strong>Título:</strong> {form.title}</div>
                  <div><strong>Tipo:</strong> {form.activityType === 'call' ? 'Ligação' : 
                    form.activityType === 'meeting' ? 'Reunião Presencial' :
                    form.activityType === 'video_call' ? 'Videochamada' :
                    form.activityType === 'message' ? 'Envio de Mensagem' :
                    form.activityType === 'email' ? 'Envio de E-mail' : 'Follow-up'}</div>
                  <div><strong>Data:</strong> {format(parseISO(form.date), "dd/MM/yyyy", { locale: ptBR })}</div>
                  <div><strong>Horário:</strong> {selectedTimeSlot}</div>
                  <div><strong>Duração:</strong> {form.duration} minutos</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={createActivityMutation.isPending || !form.title.trim() || !form.date || !selectedTimeSlot}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {createActivityMutation.isPending ? 'Agendando...' : 'Agendar Atividade'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}