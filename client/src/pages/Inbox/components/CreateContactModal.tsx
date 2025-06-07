import { useState } from 'react';
import { Button } from '@/shared/ui/ui/button';
import { Badge } from '@/shared/ui/ui/badge';
import { Input } from '@/shared/ui/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/ui/dialog';
import { Textarea } from '@/shared/ui/ui/textarea';
import { X, Plus } from 'lucide-react';
import { useCreateContact } from '@/shared/lib/hooks/useContacts';
import { useToast } from '@/shared/lib/hooks/use-toast';
import { useZApiStore } from '@/shared/store/zapiStore';

interface CreateContactModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateContactModal({ isOpen, onOpenChange }: CreateContactModalProps) {
  const [createForm, setCreateForm] = useState({
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

  const handleAddTag = () => {
    if (currentTag.trim() && !newTags.includes(currentTag.trim())) {
      setNewTags([...newTags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setNewTags(newTags.filter(tag => tag !== tagToRemove));
  };

  const handleCreateContact = async () => {
    try {
      // First, try to add contact to Z-API WhatsApp
      if (createForm.phone && isWhatsAppAvailable) {
        try {
          const [firstName, ...lastNameParts] = createForm.name.split(' ');
          const lastName = lastNameParts.join(' ');
          
          const response = await fetch("/api/zapi/contacts/add", {
            method: "POST",
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              firstName,
              lastName,
              phone: createForm.phone
            })
          });
          
          if (!response.ok) {
            throw new Error(`Failed to add contact to WhatsApp: ${response.status}`);
          }
          
          toast({
            title: "Contato adicionado ao WhatsApp",
            description: "O contato foi adicionado à sua agenda do WhatsApp."
          });
        } catch (zapiError) {
          toast({
            title: "Aviso",
            description: "Contato criado no sistema, mas não foi possível adicionar ao WhatsApp.",
            variant: "destructive"
          });
        }
      }
      
      // Then create in local database
      await createContact.mutateAsync({
        name: createForm.name,
        email: createForm.email,
        phone: createForm.phone
      });
      
      toast({
        title: "Contato criado",
        description: isWhatsAppAvailable && createForm.phone 
          ? "Contato criado no sistema e adicionado ao WhatsApp." 
          : "Contato criado no sistema."
      });
      
      onOpenChange(false);
      setCreateForm({ 
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
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar o contato.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Contato</DialogTitle>
        </DialogHeader>
        
        {/* Aviso sobre WhatsApp */}
        {isWhatsAppAvailable && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
            <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
            <span className="text-green-700 text-sm">
              Contatos com telefone serão automaticamente adicionados ao seu WhatsApp
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nome completo */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Nome completo</label>
            <Input
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              placeholder="Nome do contato"
            />
          </div>

          {/* Email e Telefone */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Email</label>
            <Input
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              placeholder="email@exemplo.com"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Telefone</label>
            <Input
              value={createForm.phone}
              onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
              placeholder="+55 11 99999-9999"
            />
          </div>

          {/* Empresa e Tipo de contato */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Empresa</label>
            <Input
              value={createForm.company}
              onChange={(e) => setCreateForm({ ...createForm, company: e.target.value })}
              placeholder="Nome da empresa"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Tipo de contato</label>
            <Select value={createForm.contactType} onValueChange={(value) => setCreateForm({ ...createForm, contactType: value })}>
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

          {/* Endereço */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Endereço</label>
            <Input
              value={createForm.address}
              onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
              placeholder="Rua, número, complemento"
            />
          </div>

          {/* Proprietário */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Proprietário</label>
            <Select value={createForm.owner} onValueChange={(value) => setCreateForm({ ...createForm, owner: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o proprietário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="João da Silva">João da Silva</SelectItem>
                <SelectItem value="Maria Santos">Maria Santos</SelectItem>
                <SelectItem value="Pedro Oliveira">Pedro Oliveira</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Tags</label>
            <div className="space-y-2">
              {newTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {newTags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <X 
                        className="w-3 h-3 cursor-pointer hover:text-red-500" 
                        onClick={() => handleRemoveTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  placeholder="Nova tag"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  className="flex-1"
                />
                <Button type="button" onClick={handleAddTag} variant="outline" size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {newTags.length === 0 && (
                <p className="text-sm text-gray-500">Nenhuma tag adicionada</p>
              )}
            </div>
          </div>

          {/* Notas */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Notas</label>
            <Textarea
              value={createForm.notes}
              onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
              placeholder="Adicione observações importantes sobre este contato"
              rows={4}
              className="resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleCreateContact} 
            disabled={!createForm.name.trim()}
            className="bg-educhat-primary hover:bg-educhat-primary/90"
          >
            Criar Contato
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}