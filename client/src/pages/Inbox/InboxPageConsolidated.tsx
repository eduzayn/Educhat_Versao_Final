import { useState, useEffect } from 'react';
import { Button } from '@/shared/ui/ui/button';
import { Badge } from '@/shared/ui/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/ui/tabs';
import { Input } from '@/shared/ui/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/ui/avatar';
import { Separator } from '@/shared/ui/ui/separator';
import { BackButton } from '@/shared/components/BackButton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/ui/ui/form';
import { Link } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertContactSchema } from '@shared/schema';
import type { InsertContact } from '@shared/schema';
import { 
  Search, 
  Filter,
  X, 
  MoreVertical, 
  Send, 
  Paperclip, 
  Smile,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Tag,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Plus
} from 'lucide-react';
import { useConversations } from '@/shared/lib/hooks/useConversations';
import { useMessages } from '@/shared/lib/hooks/useMessages';
import { useChatStore } from '@/shared/store/store/chatStore';
import { useZApiStore } from '@/shared/store/zapiStore';
import { useGlobalZApiMonitor } from '@/shared/lib/hooks/useGlobalZApiMonitor';
import { useCreateContact } from '@/shared/lib/hooks/useContacts';
import { useToast } from '@/shared/lib/hooks/use-toast';
import { useWebSocket } from '@/shared/lib/hooks/useWebSocket';
import { useMarkConversationRead } from '@/shared/lib/hooks/useMarkConversationRead';
import { useChannels } from '@/shared/lib/hooks/useChannels';
import { Textarea } from '@/shared/ui/ui/textarea';
import { CHANNELS, STATUS_CONFIG } from '@/types/chat';
import { useQuery } from '@tanstack/react-query';
import { MessageBubble } from '@/modules/Messages/components/MessageBubble';
import { InputArea } from '@/modules/Messages/components/InputArea';
import { ZApiStatusIndicator } from '@/modules/Settings/ChannelsSettings/components/ZApiStatusIndicator';
import { ConversationActionsDropdown } from './components/ConversationActionsDropdown';
import { ConversationAssignmentDropdown } from './components/ConversationAssignmentDropdown';
import { CreateContactModal } from './components/CreateContactModal';
import { ContactSidebar } from './components/ContactSidebar';
import { ConversationPanel } from './components/ConversationPanel';
import { ChatHeader } from './components/ChatHeader';
import { MessagesArea } from './components/MessagesArea';

export function InboxPageConsolidated() {
  const [activeTab, setActiveTab] = useState('inbox');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [canalOrigemFilter, setCanalOrigemFilter] = useState('all');
  const [nomeCanalFilter, setNomeCanalFilter] = useState('all');
  const { data: channels = [] } = useChannels();
  const [showMobileChat, setShowMobileChat] = useState(false);
  
  // Carregar equipes para identificação de canais
  const { data: teams = [] } = useQuery({
    queryKey: ['/api/teams'],
    queryFn: async () => {
      const response = await fetch('/api/teams');
      if (!response.ok) throw new Error('Erro ao carregar equipes');
      return response.json();
    }
  });
  
  // Integração com Z-API para comunicação em tempo real - PRESERVADA
  const { status: zapiStatus, isConfigured } = useZApiStore();
  useGlobalZApiMonitor();
  
  // Inicializar WebSocket para mensagens em tempo real - PRESERVADA
  useWebSocket();
  
  const { 
    data: conversations, 
    isLoading, 
    refetch 
  } = useConversations(1000, { 
    refetchInterval: false, // Desabilitar polling - usar WebSocket para tempo real
    staleTime: 30000 // Cache por 30 segundos para melhor performance
  }); // Carregar 1000 contatos
  const { activeConversation, setActiveConversation, markConversationAsRead, messages: storeMessages } = useChatStore();
  const markAsReadMutation = useMarkConversationRead();

  const handleSelectConversation = (conversation: any) => {
    setActiveConversation(conversation);
    // Marcar como lida tanto no store local quanto na API
    markConversationAsRead(conversation.id);
    markAsReadMutation.mutate(conversation.id);
    setShowMobileChat(true); // Show chat on mobile when conversation is selected
  };
  
  const { 
    data: messages, 
    isLoading: isLoadingMessages
  } = useMessages(activeConversation?.id || null, 100); // Carregar apenas 100 mensagens mais recentes
  

  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contactNotes, setContactNotes] = useState<any[]>([]);
  const [contactDeals, setContactDeals] = useState<any[]>([]);
  const [contactInterests, setContactInterests] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [showNoteDialog, setShowNoteDialog] = useState(false);

  // Verificar se WhatsApp está disponível para comunicação - PRESERVADA
  const isWhatsAppAvailable = zapiStatus?.connected && zapiStatus?.smartphoneConnected;

  // Buscar negócios, tags e interesses do contato quando a conversa mudar
  useEffect(() => {
    if (activeConversation?.contactId) {
      fetchContactDeals(activeConversation.contactId);
      fetchContactNotes(activeConversation.contactId);
      fetchContactInterests(activeConversation.contactId);
    }
  }, [activeConversation?.contactId]);

  const fetchContactDeals = async (contactId: number) => {
    try {
      const response = await fetch(`/api/deals?contactId=${contactId}`);
      if (response.ok) {
        const deals = await response.json();
        setContactDeals(Array.isArray(deals) ? deals : []);
      }
    } catch (error) {
      console.error('Erro ao buscar negócios do contato:', error);
      setContactDeals([]);
    }
  };

  const fetchContactNotes = async (contactId: number) => {
    try {
      const response = await fetch(`/api/contacts/${contactId}/notes`);
      if (response.ok) {
        const notes = await response.json();
        setContactNotes(Array.isArray(notes) ? notes : []);
      }
    } catch (error) {
      console.error('Erro ao buscar notas do contato:', error);
      setContactNotes([]);
    }
  };

  const fetchContactInterests = async (contactId: number) => {
    try {
      const response = await fetch(`/api/contacts/${contactId}/interests`);
      if (response.ok) {
        const interests = await response.json();
        setContactInterests(Array.isArray(interests) ? interests : []);
      }
    } catch (error) {
      console.error('Erro ao buscar interesses do contato:', error);
      setContactInterests([]);
    }
  };

  const saveNote = async () => {
    if (!newNote.trim() || !activeConversation?.contactId) return;

    try {
      const response = await fetch(`/api/contacts/${activeConversation.contactId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newNote,
          contactId: activeConversation.contactId
        }),
      });

      if (response.ok) {
        await fetchContactNotes(activeConversation.contactId);
        setNewNote('');
        setShowNoteDialog(false);
        toast({
          title: "Nota salva",
          description: "A nota foi adicionada com sucesso.",
        });
      }
    } catch (error) {
      console.error('Erro ao salvar nota:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a nota.",
        variant: "destructive",
      });
    }
  };

  const deleteNote = async (noteId: number) => {
    try {
      const response = await fetch(`/api/contacts/notes/${noteId}`, {
        method: 'DELETE',
      });

      if (response.ok && activeConversation?.contactId) {
        await fetchContactNotes(activeConversation.contactId);
        toast({
          title: "Nota excluída",
          description: "A nota foi removida com sucesso.",
        });
      }
    } catch (error) {
      console.error('Erro ao excluir nota:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a nota.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 mobile-full-height">
      {/* Lista de Conversas - Componente Consolidado */}
      <div className={`w-80 md:w-80 ${showMobileChat ? 'mobile-hide' : 'mobile-full-width'} bg-white border-r border-gray-200 flex flex-col`}>
        <ConversationPanel
          conversations={conversations || []}
          isLoading={isLoading}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          channelFilter={channelFilter}
          setChannelFilter={setChannelFilter}
          canalOrigemFilter={canalOrigemFilter}
          setCanalOrigemFilter={setCanalOrigemFilter}
          nomeCanalFilter={nomeCanalFilter}
          setNomeCanalFilter={setNomeCanalFilter}
          activeConversation={activeConversation}
          onSelectConversation={handleSelectConversation}
          channels={channels}
          teams={teams}
          refetch={refetch}
        />
      </div>

      {/* Área Principal da Conversa */}
      <div className={`flex-1 ${!showMobileChat ? 'mobile-hide' : 'mobile-full-width'} flex flex-col`}>
        {activeConversation ? (
          <>
            {/* Header do Chat */}
            <ChatHeader
              activeConversation={activeConversation}
              showMobileChat={showMobileChat}
              onMobileBackClick={() => setShowMobileChat(false)}
              onStatusChange={(conversationId: number, newStatus: string) => {
                // Implementar mudança de status
                console.log('Status change:', conversationId, newStatus);
              }}
              getChannelInfo={(channel: string) => {
                const channelConfig = CHANNELS[channel as keyof typeof CHANNELS];
                return channelConfig || { icon: '📱', color: 'bg-gray-500', label: channel };
              }}
            />

            {/* Área de Mensagens */}
            <div className="flex-1 flex">
              <div className="flex-1 flex flex-col">
                <MessagesArea
                  messages={messages || []}
                  isLoadingMessages={isLoadingMessages}
                  activeConversation={activeConversation}
                  getChannelInfo={(channel: string) => {
                    const channelConfig = CHANNELS[channel as keyof typeof CHANNELS];
                    return channelConfig || { icon: '📱', color: 'bg-gray-500', label: channel };
                  }}
                />

                {/* Input de Mensagem */}
                <div className="border-t border-gray-200 bg-white">
                  <InputArea />
                </div>
              </div>

              {/* Sidebar de Contato */}
              {activeConversation.contact && (
                <ContactSidebar />
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Selecione uma conversa
              </h3>
              <p className="text-gray-500 max-w-sm">
                Escolha uma conversa da lista para começar a visualizar e responder mensagens
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modais */}
      <CreateContactModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          refetch();
        }}
      />

      {/* Modal para Adicionar Nota */}
      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Nota</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Digite sua nota..."
              rows={4}
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowNoteDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={saveNote} disabled={!newNote.trim()}>
                Salvar Nota
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Indicador de Status Z-API */}
      <div className="fixed bottom-4 right-4 z-50">
        <ZApiStatusIndicator />
      </div>
    </div>
  );
}