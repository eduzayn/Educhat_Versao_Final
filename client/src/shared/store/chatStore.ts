import { create } from 'zustand';
import type { ChatState, ConversationWithContact, Message, TypingIndicator } from '@/types/chat';

interface ChatStore extends ChatState {
  setConversations: (conversations: ConversationWithContact[]) => void;
  setActiveConversation: (conversation: ConversationWithContact | null) => void;
  addMessage: (conversationId: number, message: Message) => void;
  setMessages: (conversationId: number, messages: Message[]) => void;
  setTypingIndicator: (conversationId: number, indicator: TypingIndicator | null) => void;
  setConnectionStatus: (isConnected: boolean) => void;
  setSelectedContactId: (contactId: number | null) => void;
  updateConversationLastMessage: (conversationId: number, message: Message) => void;
  markConversationAsRead: (conversationId: number) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: {},
  typingIndicators: {},
  isConnected: false,
  selectedContactId: null,

  setConversations: (conversations) => set({ conversations }),

  setActiveConversation: (conversation) => {
    set({ activeConversation: conversation });
    if (conversation) {
      set({ selectedContactId: conversation.contact.id });
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

  updateConversationLastMessage: (conversationId, message) => {
    const { conversations } = get();
    const updatedConversations = conversations.map(conv => {
      if (conv.id === conversationId) {
        return {
          ...conv,
          lastMessageAt: message.sentAt || new Date(),
          messages: [message],
          unreadCount: (conv.unreadCount || 0) + (message.isFromContact ? 1 : 0),
        };
      }
      return conv;
    });
    
    // Reordenar conversas por data da última mensagem
    const sortedConversations = updatedConversations.sort((a, b) => {
      const dateA = new Date(a.lastMessageAt || 0);
      const dateB = new Date(b.lastMessageAt || 0);
      return dateB.getTime() - dateA.getTime();
    });
    
    set({ conversations: sortedConversations });
  },

  markConversationAsRead: (conversationId) => {
    const { conversations } = get();
    const updatedConversations = conversations.map(conv => {
      if (conv.id === conversationId) {
        return {
          ...conv,
          unreadCount: 0,
        };
      }
      return conv;
    });
    
    set({ conversations: updatedConversations });
  },
}));
