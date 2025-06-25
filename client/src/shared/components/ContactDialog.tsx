import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';
import { Badge } from '@/shared/ui/badge';
import { X, Plus, Send } from 'lucide-react';
import { useCreateContact } from '@/shared/lib/hooks/useContacts';
import { useToast } from '@/shared/lib/hooks/use-toast';
import { useZApiStore } from '@/shared/store/zapiStore';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

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
  selectedChannelId: string;
  activeMessage: string;
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
    notes: '',
    selectedChannelId: '',
    activeMessage: ''
  });
  const [newTags, setNewTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const createContact = useCreateContact();
  const { toast } = useToast();
  const { status: zapiStatus } = useZApiStore();

  // Buscar canais disponíveis
  const { data: channels = [] } = useQuery({
    queryKey: ['/api/channels'],
    queryFn: async () => {
      const response = await fetch('/api/channels');
      if (!response.ok) throw new Error('Falha ao buscar canais');
      return response.json();
    }
  });

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
      notes: '',
      selectedChannelId: '',
      activeMessage: ''
    });
    setNewTags([]);
    setCurrentTag('');
    setIsSendingMessage(false);
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

    // Validação para mensagem ativa
    const hasValidChannel = form.selectedChannelId && form.selectedChannelId !== 'none';
    
    if (hasValidChannel && !form.activeMessage.trim()) {
      toast({
        title: "Erro",
        description: "Se um canal for selecionado, a mensagem é obrigatória.",
        variant: "destructive"
      });
      return;
    }

    if (form.activeMessage.trim() && !hasValidChannel) {
      toast({
        title: "Erro",
        description: "Se uma mensagem for inserida, é necessário selecionar um canal.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSendingMessage(true);

      // 1. Criar contato no banco primeiro
      const newContact = await createContact.mutateAsync({
        name: form.name,
        email: form.email || null,
        phone: form.phone || null
      });

      // 2. Se tiver mensagem ativa, enviar via Z-API e criar conversa
      if (form.selectedChannelId && form.activeMessage.trim() && form.phone) {
        try {
          // Enviar mensagem via Z-API
          const messageResponse = await apiRequest('POST', '/api/zapi/send-message', {
            phone: form.phone,
            message: form.activeMessage,
            channelId: form.selectedChannelId
          });

          // Criar conversa automaticamente com atribuição ao usuário logado
          const conversationResponse = await apiRequest('POST', '/api/conversations', {
            contactId: newContact.id,
            channel: 'whatsapp',
            status: 'open',
            lastMessageAt: new Date().toISOString(),
            priority: 'medium',
            isRead: false
          });

          // Criar primeira mensagem na conversa
          await apiRequest('POST', `/api/conversations/${conversationResponse.id}/messages`, {
            content: form.activeMessage,
            isFromContact: false,
            messageType: 'text',
            sentAt: new Date().toISOString()
          });

          toast({
            title: "Sucesso",
            description: "Contato criado e mensagem enviada com sucesso! Nova conversa iniciada.",
            variant: "default"
          });
        } catch (messageError) {
          console.error('Erro ao enviar mensagem:', messageError);
          toast({
            title: "Contato criado",
            description: "Contato criado com sucesso, mas houve erro ao enviar a mensagem.",
            variant: "destructive"
          });
        }
      } else {
        // 3. Adicionar ao WhatsApp se disponível (sem mensagem ativa)
        if (form.phone && isWhatsAppAvailable) {
          try {
            const [firstName, ...lastNameParts] = form.name.split(' ');
            const lastName = lastNameParts.join(' ');
            
            await fetch("/api/zapi/contacts/add", {
              method: "POST",
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ firstName, lastName, phone: form.phone })
            });
          } catch (zapiError) {
            console.warn('Z-API error:', zapiError);
          }
        }

        toast({
          title: "Contato criado",
          description: "Contato criado no sistema com sucesso.",
          variant: "default"
        });
      }
      
      handleClose();
      onSuccess?.();
      
    } catch (error) {
      console.error('Erro ao criar contato:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o contato.",
        variant: "destructive"
      });
    } finally {
      setIsSendingMessage(false);
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

          {/* Responsável */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Responsável</label>
            <Input
              value={form.owner}
              onChange={(e) => setForm({ ...form, owner: e.target.value })}
              placeholder="Nome do responsável"
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

          {/* Separador para seção de mensagem ativa */}
          <div className="md:col-span-2">
            <hr className="border-gray-200 my-4" />
            <div className="flex items-center gap-2 mb-4">
              <Send className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Enviar Mensagem Ativa</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Configure um canal e mensagem para enviar automaticamente após criar o contato.
            </p>
          </div>

          {/* Seleção do Canal WhatsApp */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700 mb-2 block">Canal WhatsApp</label>
            <Select 
              value={form.selectedChannelId} 
              onValueChange={(value) => setForm({ ...form, selectedChannelId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um canal (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum canal</SelectItem>
                {channels
                  .filter((channel: any) => channel.type === 'whatsapp' && channel?.id)
                  .map((channel: any) => (
                    <SelectItem key={channel.id} value={channel.id.toString()}>
                      {channel.name || `Canal ${channel.instanceId}`}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Campo de Mensagem Ativa */}
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Mensagem Ativa
              {form.selectedChannelId && <span className="text-red-500 ml-1">*</span>}
            </label>
            <Textarea
              value={form.activeMessage}
              onChange={(e) => setForm({ ...form, activeMessage: e.target.value })}
              placeholder="Digite a mensagem que será enviada automaticamente após criar o contato..."
              rows={4}
              disabled={!form.selectedChannelId}
            />
            {form.selectedChannelId && (
              <p className="text-xs text-gray-500 mt-1">
                Esta mensagem será enviada via WhatsApp e criará uma nova conversa automaticamente.
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!form.name.trim() || isCreating || isSendingMessage}
            className="bg-educhat-primary hover:bg-educhat-secondary"
          >
            {isSendingMessage ? 'Enviando...' : isCreating ? 'Criando...' : 'Criar Contato'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}