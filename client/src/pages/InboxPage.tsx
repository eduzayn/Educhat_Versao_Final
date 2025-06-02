import { useState } from 'react';
import { MessageSquare, Search, Send } from 'lucide-react';
import { useConversations } from '@/shared/lib/hooks/useConversations';
import type { ConversationWithContact } from '@shared/schema';

export default function InboxPage() {
  const { 
    data: conversations, 
    isLoading,
    refetch 
  } = useConversations(100);
  
  const [activeConversation, setActiveConversation] = useState<ConversationWithContact | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState('');

  const handleSelectConversation = (conversation: ConversationWithContact) => {
    setActiveConversation(conversation);
  };

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
              <div className="flex items-end space-x-2">
                <textarea
                  placeholder="Digite sua mensagem..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      console.log('Enviando mensagem:', newMessage);
                      setNewMessage('');
                    }
                  }}
                  className="flex-1 min-h-[40px] max-h-32 resize-none p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button
                  onClick={() => {
                    console.log('Enviando mensagem:', newMessage);
                    setNewMessage('');
                  }}
                  disabled={!newMessage.trim()}
                  className="h-10 px-4 bg-purple-500 text-white rounded-md hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                >
                  <Send className="w-4 h-4" />
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