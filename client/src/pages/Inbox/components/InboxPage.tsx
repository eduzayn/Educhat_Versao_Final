import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { MessagesList } from './MessagesList';
import { MessageInput } from './MessageInput';
import { ConversationList } from './ConversationList';
import { ChatHeader } from './ChatHeader';
import { SidebarConversations } from './SidebarConversations';
import type { Conversation, Message } from '@shared/schema';

export function InboxPage() {
  const [location] = useLocation();
  const conversationId = location.includes('/inbox/') ? 
    parseInt(location.split('/inbox/')[1]) : null;

  const { data: conversations = [] } = useQuery({
    queryKey: ['/api/conversations'],
    queryFn: async () => {
      const response = await fetch('/api/conversations');
      if (!response.ok) throw new Error('Failed to fetch conversations');
      return response.json();
    },
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['/api/conversations', conversationId, 'messages'],
    queryFn: async () => {
      if (!conversationId) return [];
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      return response.json();
    },
    enabled: !!conversationId,
  });

  const selectedConversation = conversations.find((c: Conversation) => c.id === conversationId);

  if (!conversationId) {
    return (
      <div className="flex h-screen">
        <div className="w-80 border-r">
          <SidebarConversations conversations={conversations} />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Selecione uma conversa para começar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <div className="w-80 border-r">
        <SidebarConversations conversations={conversations} />
      </div>
      <div className="flex-1 flex flex-col">
        {selectedConversation && <ChatHeader conversation={selectedConversation} />}
        <div className="flex-1 overflow-hidden">
          <MessagesList messages={messages} />
        </div>
        <MessageInput conversationId={conversationId} />
      </div>
    </div>
  );
}