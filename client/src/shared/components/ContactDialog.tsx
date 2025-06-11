import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';
import { Badge } from '@/shared/ui/badge';
import { X, Plus } from 'lucide-react';
import { useCreateContact } from '@/shared/lib/hooks/useContacts';
import { useToast } from '@/shared/lib/hooks/use-toast';
import { useZApiStore } from '@/shared/store/zapiStore';
import { useActiveWhatsAppChannels } from '@/shared/lib/hooks/useChannels';

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
  const [messageText, setMessageText] = useState('');
  const [selectedChannelId, setSelectedChannelId] = useState<number | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);

  const createContact = useCreateContact();
  const { toast } = useToast();
  const { status: zapiStatus } = useZApiStore();
  const { data: whatsappChannels = [] } = useActiveWhatsAppChannels();
  
  // Debug: Log para verificar canais disponíveis
  console.log('WhatsApp Channels:', whatsappChannels);
  console.log('Form phone:', form.phone);
  console.log('Should show message section:', form.phone.trim() && whatsappChannels.length > 0);

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
    setMessageText('');
    setSelectedChannelId(null);
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

    setSendingMessage(true);

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
      const newContact = await createContact.mutateAsync({
        name: form.name,
        email: form.email || null,
        phone: form.phone || null
      });
      
      // Send welcome message if provided and phone is available
      if (messageText.trim() && form.phone && whatsappChannels.length > 0) {
        let channelToUse = selectedChannelId;
        
        // Use first channel if only one available
        if (!channelToUse && whatsappChannels.length === 1) {
          channelToUse = whatsappChannels[0].id;
        }
        
        // Check if channel is selected when multiple channels exist
        if (!channelToUse && whatsappChannels.length > 1) {
          toast({
            title: "Selecione um canal",
            description: "Por favor, selecione o canal WhatsApp para envio da mensagem.",
            variant: "destructive"
          });
          setSendingMessage(false);
          return;
        }

        try {
          const response = await fetch('/api/zapi/send-message', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              phone: form.phone,
              message: messageText.trim(),
              channelId: channelToUse
            })
          });

          if (!response.ok) {
            throw new Error('Falha no envio da mensagem');
          }

          toast({
            title: "Contato criado e mensagem enviada",
            description: `Contato ${form.name} criado e mensagem de boas-vindas enviada. Continue a conversa na caixa de entrada.`
          });
        } catch (messageError) {
          console.warn('Erro ao enviar mensagem:', messageError);
          toast({
            title: "Contato criado",
            description: "Contato criado com sucesso, mas não foi possível enviar a mensagem inicial.",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Contato criado",
          description: isWhatsAppAvailable && form.phone 
            ? "Contato criado no sistema e adicionado ao WhatsApp." 
            : "Contato criado no sistema."
        });
      }
      
      handleClose();
      onSuccess?.();
      
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar o contato.",
        variant: "destructive"
      });
    } finally {
      setSendingMessage(false);
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

        {/* Seção de Mensagem Inicial */}
        {form.phone.trim() && whatsappChannels.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              💬 Mensagem de Boas-vindas
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Envie uma mensagem inicial para este contato via WhatsApp
            </p>
            
            <div className="space-y-4">
              {/* Seletor de Canal WhatsApp */}
              {whatsappChannels.length > 1 && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Canal WhatsApp
                  </label>
                  <Select 
                    value={selectedChannelId?.toString() || ''} 
                    onValueChange={(value) => setSelectedChannelId(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o canal WhatsApp" />
                    </SelectTrigger>
                    <SelectContent>
                      {whatsappChannels.map((channel) => (
                        <SelectItem key={channel.id} value={channel.id.toString()}>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${channel.connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}`} />
                            {channel.name}
                            {channel.identifier && (
                              <span className="text-xs text-gray-500">({channel.identifier})</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    {whatsappChannels.length} canais WhatsApp disponíveis
                  </p>
                </div>
              )}
              
              {/* Campo de Mensagem */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Mensagem inicial
                </label>
                <Textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Digite uma mensagem de boas-vindas para este contato..."
                  className="min-h-[100px] resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Esta mensagem será enviada imediatamente após criar o contato
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!form.name.trim() || isCreating || sendingMessage}
            className="bg-educhat-primary hover:bg-educhat-secondary"
          >
            {isCreating || sendingMessage ? 'Processando...' : 
              (messageText.trim() && form.phone && whatsappChannels.length > 0) 
                ? 'Criar Contato e Enviar Mensagem' 
                : 'Criar Contato'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}