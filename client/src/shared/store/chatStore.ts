import { create } from 'zustand';
import type { ChatState, ConversationWithContact, Message, TypingIndicator } from '@/types/chat';

interface ChatStore extends ChatState {
  setActiveConversation: (conversation: ConversationWithContact | null) => void;
  updateActiveConversationAssignment: (assignedTeamId: number | null, assignedUserId: number | null) => void;
  addMessage: (conversationId: number, message: Message) => void;
  setMessages: (conversationId: number, messages: Message[]) => void;
  setTypingIndicator: (conversationId: number, indicator: TypingIndicator | null) => void;
  setConnectionStatus: (isConnected: boolean) => void;
  setSelectedContactId: (contactId: number | null) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  conversations: [], // Mantido por compatibilidade, mas será removido gradualmente
  activeConversation: null,
  messages: {},
  typingIndicators: {},
  isConnected: false,
  selectedContactId: null,

  setActiveConversation: (conversation) => {
    set({ activeConversation: conversation });
    if (conversation) {
      set({ selectedContactId: conversation.contact.id });
    }
  },

  updateActiveConversationAssignment: (assignedTeamId, assignedUserId) => {
    const { activeConversation } = get();
    if (activeConversation) {
      set({
        activeConversation: {
          ...activeConversation,
          assignedTeamId,
          assignedUserId,
          updatedAt: new Date(),
        },
      });
    }
  },

  addMessage: (conversationId, message) => {
    const { messages } = get();
    const conversationMessages = messages[conversationId] || [];
    
    set({
      messages: {
        ...messages,
        [conversationId]: [...conversationMessages, message],
      },
    });
  },

  setMessages: (conversationId, newMessages) => {
    const { messages } = get();
    set({
      messages: {
        ...messages,
        [conversationId]: newMessages,
      },
    });
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
}));
