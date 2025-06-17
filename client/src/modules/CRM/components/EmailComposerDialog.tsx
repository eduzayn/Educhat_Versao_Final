import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { Badge } from '@/shared/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Separator } from '@/shared/ui/separator';
import { X, Plus, Users, Package, Send, Paperclip } from 'lucide-react';
import { useAuth } from '@/shared/lib/hooks/useAuth';
import { useToast } from '@/shared/lib/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

interface Contact {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
}

interface ContactGroup {
  id: number;
  name: string;
  type: 'contact_group' | 'product_group';
  members: Contact[];
}

interface EmailComposerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedContact?: Contact;
}

export function EmailComposerDialog({ isOpen, onClose, preSelectedContact }: EmailComposerDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [recipients, setRecipients] = useState<Contact[]>([]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showContactSelector, setShowContactSelector] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string>('');

  // Buscar contatos disponíveis
  const { data: contacts = [] } = useQuery<Contact[]>({
    queryKey: ['/api/contacts/email-list'],
    queryFn: async () => {
      const response = await fetch('/api/contacts/email-list', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Erro ao buscar contatos');
      return response.json();
    },
    enabled: isOpen,
  });

  // Buscar grupos de contatos
  const { data: contactGroups = [] } = useQuery<ContactGroup[]>({
    queryKey: ['/api/contact-groups'],
    queryFn: async () => {
      const response = await fetch('/api/contact-groups', {
        credentials: 'include'
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: isOpen,
  });

  // Pré-selecionar contato se fornecido
  useEffect(() => {
    if (preSelectedContact && preSelectedContact.email) {
      setRecipients([preSelectedContact]);
    }
  }, [preSelectedContact]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setRecipients([]);
      setSubject('');
      setBody('');
      setAttachments([]);
      setSelectedGroup('');
      setShowContactSelector(false);
    }
  }, [isOpen]);

  const addRecipient = (contact: Contact) => {
    if (!contact.email) {
      toast({
        title: "Email não disponível",
        description: `O contato ${contact.name} não possui email cadastrado.`,
        variant: "destructive",
      });
      return;
    }

    if (!recipients.find(r => r.id === contact.id)) {
      setRecipients([...recipients, contact]);
    }
  };

  const removeRecipient = (contactId: number) => {
    setRecipients(recipients.filter(r => r.id !== contactId));
  };

  const addGroupMembers = (groupId: string) => {
    const group = contactGroups.find(g => g.id.toString() === groupId);
    if (group) {
      const newRecipients = [...recipients];
      group.members.forEach(member => {
        if (member.email && !newRecipients.find(r => r.id === member.id)) {
          newRecipients.push(member);
        }
      });
      setRecipients(newRecipients);
      toast({
        title: "Grupo adicionado",
        description: `${group.members.filter(m => m.email).length} contatos adicionados aos destinatários.`,
      });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments([...attachments, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const sendEmail = async () => {
    if (recipients.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um destinatário.",
        variant: "destructive",
      });
      return;
    }

    if (!subject.trim()) {
      toast({
        title: "Erro",
        description: "Informe o assunto do email.",
        variant: "destructive",
      });
      return;
    }

    if (!body.trim()) {
      toast({
        title: "Erro",
        description: "Escreva o conteúdo do email.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('from', (user as any)?.email || '');
      formData.append('to', recipients.map(r => r.email).join(','));
      formData.append('subject', subject);
      formData.append('body', body);
      
      attachments.forEach((file, index) => {
        formData.append(`attachment_${index}`, file);
      });

      const response = await fetch('/api/emails/send', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Falha ao enviar email');
      }

      toast({
        title: "Email enviado",
        description: `Email enviado com sucesso para ${recipients.length} destinatário(s).`,
      });

      onClose();
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      toast({
        title: "Erro",
        description: "Falha ao enviar email. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const userEmail = (user as any)?.email;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enviar Email</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Remetente */}
          <div className="space-y-2">
            <Label htmlFor="from">De:</Label>
            <Input
              id="from"
              value={userEmail || ''}
              disabled
              className="bg-muted"
            />
          </div>

          {/* Destinatários */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Para:</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowContactSelector(!showContactSelector)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Contato
                </Button>
                {contactGroups.length > 0 && (
                  <Select value={selectedGroup} onValueChange={(value) => {
                    setSelectedGroup(value);
                    addGroupMembers(value);
                  }}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Selecionar Grupo">
                        <Users className="h-4 w-4 mr-2" />
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {contactGroups.map((group) => (
                        <SelectItem key={group.id} value={group.id.toString()}>
                          {group.type === 'product_group' ? (
                            <div className="flex items-center">
                              <Package className="h-4 w-4 mr-2" />
                              {group.name}
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-2" />
                              {group.name}
                            </div>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* Lista de destinatários selecionados */}
            {recipients.length > 0 && (
              <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[60px]">
                {recipients.map((recipient) => (
                  <Badge key={recipient.id} variant="secondary" className="flex items-center gap-1">
                    {recipient.name} ({recipient.email})
                    <button
                      onClick={() => removeRecipient(recipient.id)}
                      className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Seletor de contatos */}
            {showContactSelector && (
              <div className="border rounded-md p-3 bg-muted/50 max-h-48 overflow-y-auto">
                <div className="grid grid-cols-2 gap-2">
                  {contacts
                    .filter(contact => contact.email && !recipients.find(r => r.id === contact.id))
                    .map((contact) => (
                      <button
                        key={contact.id}
                        onClick={() => addRecipient(contact)}
                        className="text-left p-2 rounded hover:bg-background border text-sm"
                      >
                        <div className="font-medium">{contact.name}</div>
                        <div className="text-muted-foreground text-xs">{contact.email}</div>
                      </button>
                    ))}
                </div>
                {contacts.filter(c => c.email).length === 0 && (
                  <p className="text-muted-foreground text-sm">Nenhum contato com email cadastrado.</p>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Assunto */}
          <div className="space-y-2">
            <Label htmlFor="subject">Assunto:</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Digite o assunto do email"
            />
          </div>

          {/* Corpo do email */}
          <div className="space-y-2">
            <Label htmlFor="body">Mensagem:</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Digite sua mensagem aqui..."
              rows={8}
              className="resize-none"
            />
          </div>

          {/* Anexos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Anexos:</Label>
              <div>
                <input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <Paperclip className="h-4 w-4 mr-1" />
                  Anexar Arquivo
                </Button>
              </div>
            </div>

            {attachments.length > 0 && (
              <div className="space-y-2">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          {/* Botões de ação */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={sendEmail} disabled={isLoading}>
              <Send className="h-4 w-4 mr-2" />
              {isLoading ? 'Enviando...' : 'Enviar Email'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}