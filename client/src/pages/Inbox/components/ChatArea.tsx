import { useState, useRef, useEffect } from 'react';
import { Button } from '@/shared/ui/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/ui/avatar';
import { Badge } from '@/shared/ui/ui/badge';
import { ArrowLeft, Phone, Mail, MapPin, Calendar, Tag, MessageSquare, Clock, CheckCircle, AlertCircle, User } from 'lucide-react';
import { useMessages } from '@/shared/lib/hooks/useMessages';
import { useChatStore } from '@/shared/store/store/chatStore';
import { MessageBubble } from '@/modules/Messages/components/MessageBubble';
import { InputArea } from '@/modules/Messages/components/InputArea';
import { ChatHeader } from './ChatHeader';
import { CourseDetectionCard } from './CourseDetectionCard';
import { ConversationAssignmentDropdown } from './ConversationAssignmentDropdown';
import type { ConversationWithContact } from '@shared/schema';

interface ChatAreaProps {
  conversation: ConversationWithContact | null;
  onBack: () => void;
  showBackButton?: boolean;
}

export function ChatArea({ conversation, onBack, showBackButton = false }: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages: storeMessages } = useChatStore();
  
  const { 
    data: apiMessages, 
    isLoading: isLoadingMessages 
  } = useMessages(conversation?.id || 0);

  // Combinar mensagens do store (tempo real) com mensagens da API
  const allMessages = conversation?.id ? [
    ...(apiMessages || []),
    ...(storeMessages[conversation.id] || [])
  ].sort((a, b) => new Date(a.sentAt || 0).getTime() - new Date(b.sentAt || 0).getTime()) : [];

  // Remover duplicatas baseado no ID da mensagem
  const uniqueMessages = allMessages.filter((message, index, self) => 
    index === self.findIndex(m => m.id === message.id)
  );

  // Auto-scroll para a última mensagem
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [uniqueMessages]);

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Selecione uma conversa</h3>
          <p className="text-gray-500">Escolha uma conversa da lista para começar a responder</p>
        </div>
      </div>
    );
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <CheckCircle className="w-3 h-3" />;
      case 'pending': return <Clock className="w-3 h-3" />;
      case 'resolved': return <AlertCircle className="w-3 h-3" />;
      default: return <MessageSquare className="w-3 h-3" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return 'Aberta';
      case 'pending': return 'Pendente';
      case 'resolved': return 'Resolvida';
      default: return 'Desconhecido';
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header do Chat */}
      <ChatHeader 
        conversation={conversation}
        onBack={onBack}
        showBackButton={showBackButton}
      />

      {/* Layout Principal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Área de Mensagens */}
        <div className="flex-1 flex flex-col">
          {/* Lista de Mensagens */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {isLoadingMessages ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-500"></div>
              </div>
            ) : uniqueMessages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Nenhuma mensagem ainda</p>
                <p className="text-sm">Inicie a conversa enviando uma mensagem</p>
              </div>
            ) : (
              <>
                {uniqueMessages.map((message, index) => (
                  <div 
                    key={`${message.id}-${index}`}
                    className={`flex mb-4 ${message.isFromContact ? 'justify-start' : 'justify-end'}`}
                  >
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.isFromContact 
                        ? 'bg-gray-200 text-gray-800' 
                        : 'bg-blue-500 text-white'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.isFromContact ? 'text-gray-500' : 'text-blue-100'
                      }`}>
                        {message.sentAt ? new Date(message.sentAt).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : ''}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input de Mensagem */}
          <div className="border-t border-gray-200 p-4">
            <div className="text-sm text-gray-500 text-center">
              Área de input de mensagem - será integrada com componente existente
            </div>
          </div>
        </div>

        {/* Sidebar de Informações do Contato */}
        <div className="w-80 border-l border-gray-200 bg-gray-50 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Informações do Contato */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Informações do Contato
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={conversation.contact?.profileImageUrl || ''} />
                    <AvatarFallback className="bg-gray-200 text-gray-600">
                      {conversation.contact?.name?.charAt(0)?.toUpperCase() || 'C'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-gray-900">{conversation.contact?.name}</h3>
                    <p className="text-sm text-gray-500">Contato</p>
                  </div>
                </div>

                {conversation.contact?.phone && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{conversation.contact.phone}</span>
                  </div>
                )}

                {conversation.contact?.email && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{conversation.contact.email}</span>
                  </div>
                )}

                {conversation.contact?.location && (
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{conversation.contact.location}</span>
                  </div>
                )}

                {conversation.contact?.createdAt && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>Criado em {formatDate(conversation.contact.createdAt)}</span>
                  </div>
                )}

                {/* Tags do Contato */}
                {conversation.contact?.tags && Array.isArray(conversation.contact.tags) && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <Tag className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">Tags:</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {conversation.contact.tags.map((tag: string, index: number) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status da Conversa */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Status da Conversa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  <Badge className={`text-xs ${getStatusColor(conversation.status || 'open')}`}>
                    {getStatusIcon(conversation.status || 'open')}
                    <span className="ml-1">{getStatusText(conversation.status || 'open')}</span>
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Canal:</span>
                  <Badge variant="outline" className="text-xs">
                    {conversation.channel === 'whatsapp' ? '📱 WhatsApp' : 
                     conversation.channel === 'instagram' ? '📷 Instagram' :
                     conversation.channel === 'email' ? '📧 Email' : '💬 Chat'}
                  </Badge>
                </div>

                {conversation.createdAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Iniciada em:</span>
                    <span className="text-sm">{formatDate(conversation.createdAt)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}