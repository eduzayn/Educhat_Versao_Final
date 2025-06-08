import { useState } from 'react';
import { Button } from '../../button';
import { Input } from '../../input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../select';
import { Textarea } from '../../textarea';
import { Badge } from '../../badge';
import { X, Plus } from 'lucide-react';
import { useCreateContact } from '@/shared/lib/hooks/useContacts';
import { useToast } from '@/shared/lib/hooks/use-toast';
import { useZApiStore } from '../../store/zapiStore';

interface ContactDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ContactForm {
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  contactType: string;
  owner: string;
  notes: string;
}

export function ContactDialog({ isOpen, onClose, onSuccess }: ContactDialogProps) {
  const [form, setForm] = useState<ContactForm>({
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

  const createContact = useCreateContact();
  const { toast } = useToast();
  const { status: zapiStatus } = useZApiStore();

  const isWhatsAppAvailable = zapiStatus?.connected && zapiStatus?.smartphoneConnected;
  const isCreating = createContact.isPending;

  const resetForm = () => {
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
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

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
        description: "Nome é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Add contact to Z-API WhatsApp if available
      if (form.phone && isWhatsAppAvailable) {
        try {
          const [firstName, ...lastNameParts] = form.name.split(' ');
          const lastName = lastNameParts.join(' ');
          
          const response = await fetch("/api/zapi/contacts/add", {
            method: "POST",
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              firstName,
              lastName,
              phone: form.phone
            })
          });
          
          if (!response.ok) {
            console.warn('Failed to add contact to WhatsApp:', response.status);
          }
        } catch (zapiError) {
          console.warn('Z-API error:', zapiError);
        }
      }
      
      // Create in local database
      await createContact.mutateAsync({
        name: form.name,
        email: form.email || null,
        phone: form.phone || null
      });
      
      toast({
        title: "Contato criado",
        description: isWhatsAppAvailable && form.phone 
          ? "Contato criado no sistema e adicionado ao WhatsApp." 
          : "Contato criado no sistema."
      });
      
      handleClose();
      onSuccess?.();
      
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar o contato.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
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

          {/* Email */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Email</label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="email@exemplo.com"
            />
          </div>

          {/* Telefone */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Telefone</label>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+55 11 99999-9999"
            />
          </div>

          {/* Empresa */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Empresa</label>
            <Input
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              placeholder="Nome da empresa"
            />
          </div>

          {/* Tipo de contato */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Tipo de contato</label>
            <Select 
              value={form.contactType} 
              onValueChange={(value) => setForm({ ...form, contactType: value })}
            >
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

          {/* Responsável */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Responsável</label>
            <Input
              value={form.owner}
              onChange={(e) => setForm({ ...form, owner: e.target.value })}
              placeholder="Nome do responsável"
            />
          </div>

          {/* Endereço */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Endereço</label>
            <Input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Endereço completo"
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
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {newTags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <X 
                    className="w-3 h-3 cursor-pointer hover:text-red-500" 
                    onClick={() => handleRemoveTag(tag)}
                  />
                </Badge>
              ))}
            </div>
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
            disabled={!form.name.trim() || isCreating}
            className="bg-educhat-primary hover:bg-educhat-secondary"
          >
            {isCreating ? 'Criando...' : 'Criar Contato'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}