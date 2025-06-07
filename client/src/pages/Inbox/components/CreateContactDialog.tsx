import { useState } from 'react';
import { Button } from '@/shared/ui/ui/button';
import { Input } from '@/shared/ui/ui/input';
import { Textarea } from '@/shared/ui/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/ui/dialog';
import { Badge } from '@/shared/ui/ui/badge';
import { X } from 'lucide-react';
import { useCreateContact } from '@/shared/lib/hooks/useContacts';
import { useToast } from '@/shared/lib/hooks/use-toast';
import { useZApiStore } from '@/shared/store/zapiStore';
import type { InsertContact } from '@shared/schema';

interface CreateContactDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function CreateContactDialog({ isOpen, onOpenChange, trigger }: CreateContactDialogProps) {
  const { toast } = useToast();
  const createContact = useCreateContact();
  const { isConfigured: isWhatsAppAvailable } = useZApiStore();
  
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    contactType: 'Lead',
    owner: '',
    notes: ''
  });
  
  const [newTags, setNewTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');

  const handleAddTag = () => {
    if (currentTag.trim() && !newTags.includes(currentTag.trim())) {
      setNewTags([...newTags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setNewTags(newTags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome é obrigatório",
        variant: "destructive",
      });
      return;
    }

    try {
      const contactData: InsertContact = {
        name: form.name.trim(),
        email: form.email || null,
        phone: form.phone || null,
        tags: newTags.length > 0 ? newTags : null,
      };

      await createContact.mutateAsync(contactData);
      
      toast({
        title: "Sucesso",
        description: "Contato criado com sucesso!",
      });

      // Reset form
      setForm({
        name: '',
        email: '',
        phone: '',
        company: '',
        address: '',
        contactType: 'Lead',
        owner: '',
        notes: ''
      });
      setNewTags([]);
      setCurrentTag('');
      onOpenChange(false);
      
    } catch (error) {
      console.error('Erro ao criar contato:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar contato. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setForm({
      name: '',
      email: '',
      phone: '',
      company: '',
      address: '',
      contactType: 'Lead',
      owner: '',
      notes: ''
    });
    setNewTags([]);
    setCurrentTag('');
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Novo Contato</DialogTitle>
          {isWhatsAppAvailable && (
            <p className="text-sm text-green-600 bg-green-50 p-2 rounded-md mt-2">
              ✓ Contatos com telefone serão automaticamente adicionados ao seu WhatsApp
            </p>
          )}
          {!isWhatsAppAvailable && (
            <p className="text-sm text-gray-500 bg-gray-50 p-2 rounded-md mt-2">
              ⚠ WhatsApp não conectado. Configure nas Configurações → Canais para sincronização automática
            </p>
          )}
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {/* Nome completo */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Nome completo</label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nome do contato"
              className="w-full"
            />
          </div>

          {/* E-mail e Telefone */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">E-mail</label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="email@exemplo.com"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Telefone</label>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="(00) 00000-0000"
            />
          </div>

          {/* Empresa e Tipo de contato */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Empresa</label>
            <Input
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              placeholder="Nome da empresa"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Tipo de contato</label>
            <Select value={form.contactType} onValueChange={(value) => setForm({ ...form, contactType: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Lead">Lead</SelectItem>
                <SelectItem value="Cliente">Cliente</SelectItem>
                <SelectItem value="Parceiro">Parceiro</SelectItem>
                <SelectItem value="Fornecedor">Fornecedor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Endereço e Proprietário */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Endereço</label>
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Endereço completo"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Proprietário</label>
            <Input
              value={form.owner}
              onChange={(e) => setForm({ ...form, owner: e.target.value })}
              placeholder="Responsável pelo contato"
            />
          </div>

          {/* Tags */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Tags</label>
            <div className="flex gap-2 mb-2">
              <Input
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite uma tag e pressione Enter"
                className="flex-1"
              />
              <Button 
                type="button" 
                onClick={handleAddTag}
                variant="outline"
                size="sm"
              >
                Adicionar
              </Button>
            </div>
            
            {newTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {newTags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Observações */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Observações</label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Observações adicionais sobre o contato..."
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
            disabled={!form.name.trim() || createContact.isPending}
            className="bg-educhat-primary hover:bg-educhat-secondary"
          >
            {createContact.isPending ? 'Criando...' : 'Criar Contato'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}