import { create } from 'zustand';
import type { ConversationWithContact, TypingIndicator } from '@/types/chat';

interface ChatStore {
  activeConversation: ConversationWithContact | null;
  typingIndicators: Record<number, TypingIndicator>;
  isConnected: boolean;
  selectedContactId: number | null;
  
  setActiveConversation: (conversation: ConversationWithContact | null) => void;
  setTypingIndicator: (conversationId: number, indicator: TypingIndicator | null) => void;
  setConnectionStatus: (isConnected: boolean) => void;
  setSelectedContactId: (contactId: number | null) => void;
  markConversationAsRead: (conversationId: number) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  activeConversation: null,
  typingIndicators: {},
  isConnected: false,
  selectedContactId: null,

  setActiveConversation: (conversation) => {
    set({ activeConversation: conversation });
    if (conversation) {
      set({ selectedContactId: conversation.contact.id });
    }
  },

  setTypingIndicator: (conversationId, indicator) => {
    const { typingIndicators } = get();
    
    if (indicator) {
      set({
        typingIndicators: {
          ...typingIndicators,
          [conversationId]: indicator,
        },
      });
    } else {
      const newIndicators = { ...typingIndicators };
      delete newIndicators[conversationId];
      set({ typingIndicators: newIndicators });
    }
  },

  setConnectionStatus: (isConnected) => set({ isConnected }),

  setSelectedContactId: (contactId) => set({ selectedContactId: contactId }),

  // Função simplificada - apenas para compatibilidade, não gerencia estado
  markConversationAsRead: (conversationId) => {
    // Esta função agora apenas exists para compatibilidade
    // O estado real é gerenciado pelo TanStack Query
    console.log(`Marcando conversa ${conversationId} como lida (compatibilidade)`);
  },
}));
