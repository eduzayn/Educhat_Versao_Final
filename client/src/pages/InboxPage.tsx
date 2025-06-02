import { useState } from 'react';
import { MessageSquare, Search, Send, Paperclip, Mic, Smile, Image, FileText, Link, X } from 'lucide-react';
import { useConversations } from '@/shared/lib/hooks/useConversations';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { ConversationWithContact } from '@shared/schema';
import { AudioRecorder } from '@/modules/Messages/components/AudioRecorder';

export default function InboxPage() {
  const { 
    data: conversations, 
    isLoading,
    refetch 
  } = useConversations(500);
  
  const queryClient = useQueryClient();
  
  const [activeConversation, setActiveConversation] = useState<ConversationWithContact | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [isAttachmentOpen, setIsAttachmentOpen] = useState(false);
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { phone: string; text: string }) => {
      const response = await fetch('/api/zapi/send-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error('Falha ao enviar mensagem');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      if (activeConversation) {
        queryClient.invalidateQueries({ 
          queryKey: ['/api/messages', activeConversation.contact.phone] 
        });
      }
    }
  });

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeConversation || !activeConversation.contact.phone) return;
    
    try {
      await sendMessageMutation.mutateAsync({
        phone: activeConversation.contact.phone,
        text: newMessage.trim()
      });
      setNewMessage('');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  const handleSelectConversation = (conversation: ConversationWithContact) => {
    setActiveConversation(conversation);
  };

  const handleSendAudio = async (audioBlob: Blob, duration: number) => {
    if (!activeConversation || !activeConversation.contact.phone) return;
    
    setShowAudioRecorder(false);
    console.log('Enviando áudio:', { duration, phone: activeConversation.contact.phone });
    // TODO: Implementar envio de áudio via API
  };

  const handleCancelAudio = () => {
    setShowAudioRecorder(false);
  };

  const handleFileUpload = (type: 'image' | 'document') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = type === 'image' ? 'image/*' : '.pdf,.doc,.docx,.txt';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && activeConversation?.contact.phone) {
        console.log('Enviando arquivo:', { type, fileName: file.name, phone: activeConversation.contact.phone });
        // TODO: Implementar envio de arquivo via API
      }
    };
    input.click();
  };

  const emojis = ['👍', '❤️', '😊', '😂', '😢', '😮', '😡', '🎉'];

  // Filtrar conversas baseado na busca
  const filteredConversations = conversations?.filter(conversation => {
    const matchesSearch = conversation.contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (conversation.contact.phone && conversation.contact.phone.includes(searchTerm));
    return matchesSearch;
  }) || [];

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Carregando conversas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar de conversas */}
      <div className="w-96 border-r border-gray-200 bg-white flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900">Conversas</h1>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-xs text-gray-500">Online</span>
            </div>
          </div>
          
          {/* Busca */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar conversas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Lista de conversas */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length > 0 ? (
            <div className="space-y-1">
              {filteredConversations.map((conversation) => {
                const lastMessage = conversation.messages?.[0];
                
                return (
                  <div
                    key={conversation.id}
                    className={`p-4 cursor-pointer border-l-4 transition-colors ${
                      activeConversation?.id === conversation.id
                        ? 'bg-purple-50 border-purple-500'
                        : 'bg-white border-transparent hover:bg-gray-50'
                    }`}
                    onClick={() => handleSelectConversation(conversation)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-purple-600">
                          {conversation.contact.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {conversation.contact.name}
                          </h3>
                          <span className="text-xs text-gray-400">
                            {conversation.channel === 'whatsapp' ? '📱' : '💬'}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between mt-1">
                          {lastMessage && (
                            <p className="text-sm text-gray-600 truncate flex-1">
                              {lastMessage.content}
                            </p>
                          )}
                          <span className={`text-xs px-2 py-1 rounded-full ml-2 ${
                            conversation.status === 'open' ? 'bg-green-100 text-green-700' :
                            conversation.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {conversation.status === 'open' ? 'Ativa' :
                             conversation.status === 'pending' ? 'Aguardando' : 'Fechada'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">
                {searchTerm ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa disponível'}
              </p>
              {!searchTerm && (
                <p className="text-xs mt-2">Total de conversas: {conversations?.length || 0}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Área principal de chat */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
            {/* Header do chat */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-purple-600">
                      {activeConversation.contact.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  
                  <div>
                    <h2 className="font-semibold text-gray-900 text-base">
                      {activeConversation.contact.name}
                    </h2>
                    <p className="text-xs text-gray-500">{activeConversation.contact.phone || 'Sem telefone'}</p>
                  </div>
                </div>
                
                <div className="text-xs text-gray-500">
                  Canal: {activeConversation.channel}
                </div>
              </div>
            </div>

            {/* Área de mensagens */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4">
                {activeConversation.messages && activeConversation.messages.length > 0 ? (
                  activeConversation.messages.map((message: any) => (
                    <div
                      key={message.id}
                      className={`flex ${message.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.direction === 'outgoing'
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.direction === 'outgoing' ? 'text-purple-100' : 'text-gray-500'
                        }`}>
                          {message.sentAt ? new Date(message.sentAt).toLocaleTimeString('pt-BR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          }) : 'Agora'}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>Nenhuma mensagem ainda</p>
                    <p className="text-xs mt-1">Inicie uma conversa enviando a primeira mensagem</p>
                  </div>
                )}
              </div>
            </div>

            {/* Área de envio de mensagem */}
            <div className="p-4 border-t border-gray-200 bg-white">
              {/* Componente de gravação de áudio */}
              {showAudioRecorder && (
                <div className="mb-4 border rounded-lg p-3 bg-gray-50">
                  <AudioRecorder
                    onSendAudio={handleSendAudio}
                    onCancel={handleCancelAudio}
                  />
                </div>
              )}
              
              {/* Interface de digitação sempre visível */}
              <div className="flex items-end space-x-3">
                {/* Botão de anexo */}
                <div className="relative">
                  <button
                    onClick={() => setIsAttachmentOpen(!isAttachmentOpen)}
                    className="p-2 text-gray-600 hover:text-purple-600 hover:bg-gray-100 rounded-full transition-colors"
                    disabled={!activeConversation?.contact.phone}
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                  
                  {/* Menu de anexos */}
                  {isAttachmentOpen && (
                    <div className="absolute bottom-full left-0 mb-2 bg-white border rounded-lg shadow-lg p-2 space-y-1 z-10">
                      <button
                        onClick={() => {
                          handleFileUpload('image');
                          setIsAttachmentOpen(false);
                        }}
                        className="w-full flex items-center space-x-2 p-2 hover:bg-gray-100 rounded text-sm"
                      >
                        <Image className="w-4 h-4" />
                        <span>Imagem</span>
                      </button>
                      <button
                        onClick={() => {
                          handleFileUpload('document');
                          setIsAttachmentOpen(false);
                        }}
                        className="w-full flex items-center space-x-2 p-2 hover:bg-gray-100 rounded text-sm"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Documento</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Campo de texto */}
                <textarea
                  placeholder="Digite sua mensagem..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="flex-1 resize-none border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={1}
                  disabled={!activeConversation || sendMessageMutation.isPending}
                />

                {/* Botão de áudio */}
                {!showAudioRecorder && (
                  <button
                    onClick={() => setShowAudioRecorder(true)}
                    className="p-2 text-gray-600 hover:text-purple-600 hover:bg-gray-100 rounded-full transition-colors"
                    disabled={!activeConversation?.contact.phone}
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                )}

                {/* Botão de emoji */}
                <div className="relative">
                  <button
                    onClick={() => setIsEmojiOpen(!isEmojiOpen)}
                    className="p-2 text-gray-600 hover:text-purple-600 hover:bg-gray-100 rounded-full transition-colors"
                    disabled={!activeConversation?.contact.phone}
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                  
                  {/* Picker de emojis simples */}
                  {isEmojiOpen && (
                    <div className="absolute bottom-full right-0 mb-2 bg-white border rounded-lg shadow-lg p-2 z-10">
                      <div className="grid grid-cols-4 gap-1">
                        {emojis.map((emoji, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setNewMessage(prev => prev + emoji);
                              setIsEmojiOpen(false);
                            }}
                            className="p-2 hover:bg-gray-100 rounded text-lg"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Botão de envio */}
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || !activeConversation || sendMessageMutation.isPending}
                  className="p-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Selecione uma conversa</h3>
              <p className="text-gray-500">Escolha uma conversa da lista para começar a responder</p>
              <p className="text-xs text-gray-400 mt-2">
                Total disponível: {conversations?.length || 0} conversas
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}