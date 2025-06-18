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

interface CreateDealDialogProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedContactId?: number;
}

export function CreateDealDialog({ isOpen, onClose, preselectedContactId }: CreateDealDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [form, setForm] = useState({
    name: '',
    contactId: preselectedContactId || 0 as number,
    teamType: 'comercial',
    stage: 'prospecting',
    value: '',
    probability: '10',
    expectedCloseDate: '',
    course: '',
    category: '',
    notes: ''
  });

  const [openContactSelect, setOpenContactSelect] = useState(false);

  // Buscar contatos para seleção
  const { data: contacts = [] } = useQuery<Array<{id: number, name: string, phone?: string, email?: string}>>({
    queryKey: ['/api/contacts/search'],
    enabled: isOpen && !preselectedContactId,
  });

  // Buscar categorias e cursos
  const { data: categories } = useQuery({
    queryKey: ['/api/courses/categories'],
    enabled: isOpen,
  });

  // Mutation para criar negócio
  const createDealMutation = useMutation({
    mutationFn: async (dealData: any) => {
      const response = await fetch('/api/deals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dealData),
      });
      if (!response.ok) {
        throw new Error('Erro ao criar negócio');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Negócio criado",
        description: "O negócio foi criado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível criar o negócio.",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setForm({
      name: '',
      contactId: (preselectedContactId as number) || 0,
      teamType: 'comercial',
      stage: 'prospecting',
      value: '',
      probability: '10',
      expectedCloseDate: '',
      course: '',
      category: '',
      notes: ''
    });
    setOpenContactSelect(false);
    onClose();
  };

  const handleSubmit = () => {
    if (!form.name.trim() || !form.contactId) {
      toast({
        title: "Erro",
        description: "Nome do negócio e contato são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    const dealData = {
      name: form.name,
      contactId: form.contactId,
      teamType: form.teamType,
      stage: form.stage,
      value: form.value ? Math.round(parseFloat(form.value) * 100) : 0, // converter para centavos
      probability: parseInt(form.probability),
      expectedCloseDate: form.expectedCloseDate || null,
      course: form.course || null,
      category: form.category || null,
      notes: form.notes || null,
    };

    createDealMutation.mutate(dealData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Negócio</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-6">
          {/* Nome do negócio */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Nome do Negócio *
            </label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Matrícula João Silva - Administração"
            />
          </div>

          {/* Contato */}
          {!preselectedContactId && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Contato *
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Equipe */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Equipe
              </label>
              <Select value={form.teamType} onValueChange={(value) => setForm({ ...form, teamType: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comercial">Comercial</SelectItem>
                  <SelectItem value="suporte">Suporte</SelectItem>
                  <SelectItem value="cobranca">Cobrança</SelectItem>
                  <SelectItem value="secretaria">Secretaria</SelectItem>
                  <SelectItem value="tutoria">Tutoria</SelectItem>
                  <SelectItem value="financeiro">Financeiro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Estágio */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Estágio
              </label>
              <Select value={form.stage} onValueChange={(value) => setForm({ ...form, stage: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prospecting">Prospecção</SelectItem>
                  <SelectItem value="qualification">Qualificação</SelectItem>
                  <SelectItem value="proposal">Proposta</SelectItem>
                  <SelectItem value="negotiation">Negociação</SelectItem>
                  <SelectItem value="closed_won">Fechado - Ganho</SelectItem>
                  <SelectItem value="closed_lost">Fechado - Perdido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Valor */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Valor (R$)
              </label>
              <Input
                type="number"
                step="0.01"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                placeholder="0,00"
              />
            </div>

            {/* Probabilidade */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Probabilidade (%)
              </label>
              <Select value={form.probability} onValueChange={(value) => setForm({ ...form, probability: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10%</SelectItem>
                  <SelectItem value="25">25%</SelectItem>
                  <SelectItem value="50">50%</SelectItem>
                  <SelectItem value="75">75%</SelectItem>
                  <SelectItem value="90">90%</SelectItem>
                  <SelectItem value="100">100%</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Categoria */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Categoria
              </label>
              <Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(categories) && categories.map((category: string) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Data prevista */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Data Prevista de Fechamento
              </label>
              <Input
                type="date"
                value={form.expectedCloseDate}
                onChange={(e) => setForm({ ...form, expectedCloseDate: e.target.value })}
              />
            </div>
          </div>

          {/* Curso */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Curso de Interesse
            </label>
            <Input
              value={form.course}
              onChange={(e) => setForm({ ...form, course: e.target.value })}
              placeholder="Ex: Administração, Direito, Enfermagem..."
            />
          </div>

          {/* Observações */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Observações
            </label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Observações sobre o negócio..."
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={createDealMutation.isPending || !form.name.trim() || !form.contactId}
          >
            {createDealMutation.isPending ? 'Criando...' : 'Criar Negócio'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}