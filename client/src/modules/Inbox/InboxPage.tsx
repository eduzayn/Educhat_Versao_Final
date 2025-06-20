import { useState, useEffect } from "react";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { Separator } from "@/shared/ui/separator";
import { BackButton } from "@/shared/components/BackButton";
import { ContactDialog } from "@/shared/components/ContactDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import { Link } from "wouter";
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
  Plus,
} from "lucide-react";
import { useInfiniteConversations } from "@/shared/lib/hooks/useInfiniteConversations";
import { useQuery } from "@tanstack/react-query";
import { useMessages } from "@/shared/lib/hooks/useMessages";
import { useChatStore } from "@/shared/store/chatStore";
import { useZApiStore } from "@/shared/store/zapiStore";
import { useMessageSyncListener } from "@/shared/lib/hooks/useMessageSyncListener";
import { useCreateContact } from "@/shared/lib/hooks/useContacts";
import { useToast } from "@/shared/lib/hooks/use-toast";
import { useWebSocket } from "@/shared/lib/hooks/useWebSocket";
import { useMarkConversationRead } from "@/shared/lib/hooks/useMarkConversationRead";
import { useChannels, Channel } from "@/shared/lib/hooks/useChannels";

import { STATUS_CONFIG } from "@/types/chat";

import { MessageInput } from "@/modules/Messages/components/MessageInput";

import { ConversationActionsDropdown } from "@/modules/Inbox/components/ConversationActions";
import { ConversationAssignment } from "@/modules/Inbox/components/ConversationAssignment";
import { ContactSidebar } from "@/modules/Contacts/components/ContactSidebar";
import { ConversationListVirtualized } from "@/modules/Inbox/components/ConversationListVirtualized";
import { ChatHeader } from "@/modules/Inbox/components/ChatHeader";
import { MessagesArea } from "@/modules/Messages/components/MessagesArea";

export function InboxPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [channelFilter, setChannelFilter] = useState("all");
  const [canalOrigemFilter, setCanalOrigemFilter] = useState("all");
  const [nomeCanalFilter, setNomeCanalFilter] = useState("all");
  const [teamFilter, setTeamFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");


  const { data: channels = [] } = useChannels();
  const [showMobileChat, setShowMobileChat] = useState(false);

  // Carregar equipes para identificação de canais
  const { data: teams = [] } = useQuery({
    queryKey: ["/api/teams"],
    queryFn: async () => {
      const response = await fetch("/api/teams");
      if (!response.ok) throw new Error("Erro ao carregar equipes");
      return response.json();
    },
  });

  // Integração com Z-API para comunicação em tempo real
  const { status: zapiStatus, isConfigured } = useZApiStore();

  // Inicializar WebSocket para mensagens em tempo real
  useWebSocket();

  // Hook unificado para conversas com busca integrada
  // CORREÇÃO CRÍTICA: Inicializar listener de sincronização de mensagens
  const { triggerMessageRecovery } = useMessageSyncListener();

  const conversationsQuery = useInfiniteConversations(100, {
    searchTerm: searchTerm.trim(),
    periodFilter,
    teamFilter,
    statusFilter,
    agentFilter,
    channelFilter,
    refetchInterval: searchTerm.trim() ? false : 10000,
    staleTime: 5000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Dados consolidados
  const conversations =
    conversationsQuery.data?.pages.flatMap((page) => page.conversations) || [];
  const isLoadingConversations = conversationsQuery.isLoading;
  const hasNextPage = conversationsQuery.hasNextPage;
  const fetchNextPage = conversationsQuery.fetchNextPage;
  const {
    activeConversation,
    setActiveConversation,
    messages: storeMessages,
  } = useChatStore();
  const markAsReadMutation = useMarkConversationRead();

  const handleSelectConversation = (conversation: any) => {
    setActiveConversation(conversation);
    // Marcar como lida na API (store local não precisa mais gerenciar isso)
    markAsReadMutation.mutate(conversation.id);
    setShowMobileChat(true); // Show chat on mobile when conversation is selected
  };

  const { data: messages, isLoading: isLoadingMessages } = useMessages(
    activeConversation?.id || null,
    100,
  ); // Carregar apenas 100 mensagens mais recentes

  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contactNotes, setContactNotes] = useState<any[]>([]);
  const [contactDeals, setContactDeals] = useState<any[]>([]);

  const [newNote, setNewNote] = useState("");
  const [showNoteDialog, setShowNoteDialog] = useState(false);

  // Verificar se WhatsApp está disponível para comunicação
  const isWhatsAppAvailable = Boolean(
    zapiStatus?.connected && zapiStatus?.smartphoneConnected,
  );

  // Buscar negócios, tags e interesses do contato quando a conversa mudar
  useEffect(() => {
    if (activeConversation?.contactId) {
      fetchContactDeals(activeConversation.contactId);
      fetchContactNotes(activeConversation.contactId);

    }
  }, [activeConversation?.contactId]);

  const fetchContactDeals = async (contactId: number) => {
    try {
      const response = await fetch(`/api/contacts/${contactId}/deals`);
      if (response.ok) {
        const data = await response.json();
        setContactDeals(Array.isArray(data.deals) ? data.deals : []);
      }
    } catch (error) {
      console.error("Erro ao buscar negócios do contato:", error);
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
      console.error("Erro ao buscar notas do contato:", error);
      setContactNotes([]);
    }
  };



  const handleAddNote = async () => {
    if (!newNote.trim() || !activeConversation) return;

    try {
      const response = await fetch(
        `/api/contacts/${activeConversation.contactId}/notes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: newNote.trim(),
            authorName: "Atendente Atual", // Em produção, pegar do usuário logado
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Erro ao salvar nota");
      }

      toast({
        title: "Nota adicionada",
        description: "A nota interna foi salva com sucesso.",
      });

      setNewNote("");
      setShowNoteDialog(false);

      // Recarregar as notas do contato
      loadContactNotes();
    } catch (error) {
      console.error("Erro ao adicionar nota:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a nota. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Função para carregar notas do contato
  const loadContactNotes = async () => {
    if (!activeConversation?.contactId) return;

    try {
      const response = await fetch(
        `/api/contacts/${activeConversation.contactId}/notes`,
      );
      if (response.ok) {
        const notes = await response.json();
        setContactNotes(notes);
      }
    } catch (error) {
      console.error("Erro ao carregar notas:", error);
    }
  };

  // Função para editar nota
  const handleEditNote = async (noteId: number, content: string) => {
    if (!activeConversation?.contactId) return;
    
    try {
      const response = await fetch(`/api/contact-notes/${noteId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: content.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao atualizar nota");
      }

      // Recarregar as notas do contato
      fetchContactNotes(activeConversation.contactId);
    } catch (error) {
      console.error("Erro ao editar nota:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a nota. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Função para excluir nota
  const handleDeleteNote = async (noteId: number) => {
    if (!activeConversation?.contactId) return;
    
    try {
      const response = await fetch(`/api/contact-notes/${noteId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erro ao excluir nota");
      }

      // Recarregar as notas do contato
      if (activeConversation?.contactId) {
        fetchContactNotes(activeConversation.contactId);
      }
    } catch (error) {
      console.error("Erro ao excluir nota:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a nota. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Carregar notas quando a conversa ativa mudar
  useEffect(() => {
    loadContactNotes();
  }, [activeConversation?.contactId]);

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
    if (!config) return null;

    return (
      <Badge
        variant="secondary"
        className={`${config.bgColor} ${config.color} text-xs`}
      >
        {config.label}
      </Badge>
    );
  };

  const getChannelInfo = (channel: string) => {
    // Channel info now handled by backend data
    return { icon: "💬", color: "text-gray-500", label: "Canal" };
  };

  // Função removida - agora usamos apenas ícones de canal

  // Função removida - agora usamos apenas ícones de canal

  const formatTime = (date: string | Date) => {
    const dateObj = new Date(date);
    return new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/Sao_Paulo",
    }).format(dateObj);
  };

  // Função para alterar status da conversa
  const handleStatusChange = async (
    conversationId: number,
    newStatus: string,
  ) => {
    try {
      const response = await fetch(
        `/api/conversations/${conversationId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        },
      );

      if (!response.ok) {
        throw new Error("Erro ao atualizar status");
      }

      // Atualizar o estado local imediatamente para melhor UX
      if (activeConversation && activeConversation.id === conversationId) {
        setActiveConversation({
          ...activeConversation,
          status: newStatus,
        });
      }

      // Invalidar cache para recarregar conversas
      conversationsQuery.refetch();

      toast({
        title: "Status atualizado",
        description: `Status da conversa alterado para: ${STATUS_CONFIG[newStatus as keyof typeof STATUS_CONFIG]?.label || newStatus}`,
      });
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status da conversa",
        variant: "destructive",
      });
    }
  };

  if (isLoadingConversations) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-educhat-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 mobile-full-height">
      {/* Lista de Conversas */}
      <div
        className={`w-80 md:w-80 ${showMobileChat ? "mobile-hide" : "mobile-full-width"} bg-white border-r border-gray-200 flex flex-col`}
      >
        {/* Lista de Conversas com Scroll Infinito */}
        <ConversationListVirtualized
          conversations={conversations}
          isLoading={isLoadingConversations}
          hasNextPage={hasNextPage || false}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          channelFilter={channelFilter}
          setChannelFilter={setChannelFilter}
          teamFilter={teamFilter}
          setTeamFilter={setTeamFilter}
          periodFilter={periodFilter}
          setPeriodFilter={setPeriodFilter}
          agentFilter={agentFilter}
          setAgentFilter={setAgentFilter}
          activeConversation={activeConversation}
          onSelectConversation={handleSelectConversation}
          onLoadMore={async () => {
            try {
              await fetchNextPage();
            } catch (error) {
              console.error('Erro ao carregar mais conversas:', error);
            }
          }}
          channels={channels}
          onNewContact={() => setIsModalOpen(true)}
        />
      </div>

      {/* Área de Mensagens */}
      <div
        className={`flex-1 flex flex-col ${showMobileChat ? "mobile-full-width" : "mobile-hide"} md:flex`}
      >
        {activeConversation ? (
          <>
            {/* Header da Conversa */}
            <ChatHeader
              activeConversation={activeConversation}
              showMobileChat={showMobileChat}
              onMobileBackClick={() => setShowMobileChat(false)}
              onStatusChange={handleStatusChange}
              getChannelInfo={getChannelInfo}
            />

            {/* Mensagens */}
            <MessagesArea
              activeConversation={activeConversation}
              getChannelInfo={getChannelInfo}
            />

            {/* Área de Input */}
            <MessageInput conversationId={activeConversation.id} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">
                Selecione uma conversa
              </h3>
              <p>Escolha uma conversa da lista para começar a responder</p>
            </div>
          </div>
        )}
      </div>

      <ContactSidebar
        activeConversation={activeConversation}
        contactNotes={contactNotes}
        contactDeals={contactDeals}
        onAddNote={handleAddNote}
        onEditNote={handleEditNote}
        onDeleteNote={handleDeleteNote}
      />

      <ContactDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          conversationsQuery.refetch();
        }}
      />
    </div>
  );
}
