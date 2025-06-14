import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { ConversationWithContact, Message, TypingIndicator } from '@/types/chat';

// Tipos unificados para diferentes tipos de chat
export type ChatType = 'external' | 'internal';

export interface UnifiedMessage extends Message {
  chatType: ChatType;
  channelId?: string; // Para chat interno
}

export interface InternalChatMessage {
  id: string;
  content: string;
  userId: number;
  username: string;
  timestamp: Date;
  channelId: string;
  messageType?: string;
  userAvatar?: string;
  edited?: boolean;
  editedAt?: Date;
  isImportant?: boolean;
  reminderDate?: Date;
  replyTo?: string;
  reactions?: Array<{
    emoji: string;
    userIds: number[];
    count: number;
  }>;
}

export interface UnifiedConversation {
  conversation: ConversationWithContact;
  chatType: ChatType;
  channelId?: string; // Para chat interno apenas
}

export interface TypingUser {
  userId: number;
  username: string;
  channelId: string;
  timestamp: Date;
}

export interface ChatUser {
  id: number;
  username: string;
  displayName: string;
  email: string;
  isOnline: boolean;
  lastSeen?: Date;
  avatar?: string;
  roleName?: string;
}

export interface InternalChannel {
  id: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  teamId?: number;
  unreadCount: number;
  lastActivity: Date;
  users: ChatUser[];
  type?: string; // 'direct', 'group', 'team'
  participants?: ChatUser[]; // Alias para users
}

interface UnifiedChatState {
  // Estados compartilhados
  isConnected: boolean;
  soundEnabled: boolean;
  
  // Chat externo (WhatsApp/clientes)
  external: {
    activeConversation: ConversationWithContact | null;
    conversations: ConversationWithContact[];
    messages: Record<number, Message[]>;
    typingIndicators: Record<number, TypingIndicator | null>;
    selectedContactId: number | null;
  };
  
  // Chat interno (equipes)
  internal: {
    activeChannel: string | null;
    channels: InternalChannel[];
    messages: Record<string, UnifiedMessage[]>;
    typingUsers: TypingUser[];
    channelUsers: Record<string, ChatUser[]>;
  };
}

interface UnifiedChatActions {
  // Ações globais
  setConnectionStatus: (isConnected: boolean) => void;
  toggleSound: () => void;
  
  // Ações do chat externo
  setActiveConversation: (conversation: ConversationWithContact | null) => void;
  setSelectedContactId: (contactId: number | null) => void;
  addExternalMessage: (conversationId: number, message: Message) => void;
  setExternalMessages: (conversationId: number, messages: Message[]) => void;
  setExternalTypingIndicator: (conversationId: number, indicator: TypingIndicator | null) => void;
  
  // Ações do chat interno
  setActiveChannel: (channelId: string | null) => void;
  addInternalChannel: (channel: InternalChannel) => void;
  updateInternalChannel: (channelId: string, updates: Partial<InternalChannel>) => void;
  addInternalMessage: (message: UnifiedMessage) => void;
  updateInternalMessage: (messageId: string, updates: Partial<UnifiedMessage>) => void;
  deleteInternalMessage: (messageId: string, channelId: string) => void;
  setInternalTyping: (user: TypingUser) => void;
  removeInternalTyping: (userId: number, channelId: string) => void;
  setChannelUsers: (channelId: string, users: ChatUser[]) => void;
  markChannelAsRead: (channelId: string) => void;
  
  // Métodos utilitários
  getChannelMessages: (channelId: string) => UnifiedMessage[];
  getUnreadTotal: () => number;
  loadChannels: () => Promise<void>;
  loadChannelUsers: (channelId: string) => Promise<void>;
}

type UnifiedChatStore = UnifiedChatState & UnifiedChatActions;

const initialState: UnifiedChatState = {
  isConnected: false,
  soundEnabled: true,
  external: {
    activeConversation: null,
    conversations: [],
    messages: {},
    typingIndicators: {},
    selectedContactId: null,
  },
  internal: {
    activeChannel: null,
    channels: [],
    messages: {},
    typingUsers: [],
    channelUsers: {},
  },
};

export const useUnifiedChatStore = create<UnifiedChatStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    // Ações globais
    setConnectionStatus: (isConnected) => set({ isConnected }),
    
    toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),

    // Ações do chat externo
    setActiveConversation: (conversation) => {
      set((state) => ({
        external: {
          ...state.external,
          activeConversation: conversation,
          selectedContactId: conversation?.contact.id || null,
        },
      }));
    },

    setSelectedContactId: (contactId) => {
      set((state) => ({
        external: {
          ...state.external,
          selectedContactId: contactId,
        },
      }));
    },

    addExternalMessage: (conversationId, message) => {
      set((state) => {
        const conversationMessages = state.external.messages[conversationId] || [];
        return {
          external: {
            ...state.external,
            messages: {
              ...state.external.messages,
              [conversationId]: [...conversationMessages, message],
            },
          },
        };
      });
    },

    setExternalMessages: (conversationId, messages) => {
      set((state) => ({
        external: {
          ...state.external,
          messages: {
            ...state.external.messages,
            [conversationId]: messages,
          },
        },
      }));
    },

    setExternalTypingIndicator: (conversationId, indicator) => {
      set((state) => ({
        external: {
          ...state.external,
          typingIndicators: {
            ...state.external.typingIndicators,
            [conversationId]: indicator,
          },
        },
      }));
    },

    // Ações do chat interno
    setActiveChannel: (channelId) => {
      set((state) => ({
        internal: {
          ...state.internal,
          activeChannel: channelId,
        },
      }));
    },

    addInternalChannel: (channel) => {
      set((state) => ({
        internal: {
          ...state.internal,
          channels: [...state.internal.channels, channel],
        },
      }));
    },

    updateInternalChannel: (channelId, updates) => {
      set((state) => ({
        internal: {
          ...state.internal,
          channels: state.internal.channels.map((channel) =>
            channel.id === channelId ? { ...channel, ...updates } : channel
          ),
        },
      }));
    },

    addInternalMessage: (message) => {
      if (!message.channelId) return;
      
      set((state) => {
        const channelMessages = state.internal.messages[message.channelId!] || [];
        return {
          internal: {
            ...state.internal,
            messages: {
              ...state.internal.messages,
              [message.channelId!]: [...channelMessages, message],
            },
          },
        };
      });
    },

    updateInternalMessage: (messageId, updates) => {
      set((state) => {
        const newMessages = { ...state.internal.messages };
        Object.keys(newMessages).forEach((channelId) => {
          newMessages[channelId] = newMessages[channelId].map((msg) =>
            msg.id.toString() === messageId ? { ...msg, ...updates } : msg
          );
        });
        
        return {
          internal: {
            ...state.internal,
            messages: newMessages,
          },
        };
      });
    },

    deleteInternalMessage: (messageId, channelId) => {
      set((state) => ({
        internal: {
          ...state.internal,
          messages: {
            ...state.internal.messages,
            [channelId]: state.internal.messages[channelId]?.filter(
              (msg) => msg.id.toString() !== messageId
            ) || [],
          },
        },
      }));
    },

    setInternalTyping: (user) => {
      set((state) => {
        const filteredUsers = state.internal.typingUsers.filter(
          (u) => !(u.userId === user.userId && u.channelId === user.channelId)
        );
        return {
          internal: {
            ...state.internal,
            typingUsers: [...filteredUsers, user],
          },
        };
      });
    },

    removeInternalTyping: (userId, channelId) => {
      set((state) => ({
        internal: {
          ...state.internal,
          typingUsers: state.internal.typingUsers.filter(
            (user) => !(user.userId === userId && user.channelId === channelId)
          ),
        },
      }));
    },

    setChannelUsers: (channelId, users) => {
      set((state) => ({
        internal: {
          ...state.internal,
          channelUsers: {
            ...state.internal.channelUsers,
            [channelId]: users,
          },
        },
      }));
    },

    markChannelAsRead: (channelId) => {
      set((state) => ({
        internal: {
          ...state.internal,
          channels: state.internal.channels.map((channel) =>
            channel.id === channelId ? { ...channel, unreadCount: 0 } : channel
          ),
        },
      }));
    },

    // Métodos utilitários
    getChannelMessages: (channelId) => {
      const state = get();
      return state.internal.messages[channelId] || [];
    },

    getUnreadTotal: () => {
      const state = get();
      return state.internal.channels.reduce((total, channel) => total + channel.unreadCount, 0);
    },

    loadChannels: async () => {
      try {
        const response = await fetch('/api/internal-chat/channels');
        if (response.ok) {
          const channels = await response.json();
          const formattedChannels = channels.map((channel: any) => ({
            ...channel,
            lastActivity: new Date(),
            unreadCount: 0,
            users: [],
          }));
          set((state) => ({
            internal: {
              ...state.internal,
              channels: formattedChannels,
            },
          }));
        }
      } catch (error) {
        console.error('Erro ao carregar canais:', error);
      }
    },

    loadChannelUsers: async (channelId: string) => {
      try {
        const response = await fetch(`/api/internal-chat/channels/${channelId}/users`);
        if (response.ok) {
          const users = await response.json();
          get().setChannelUsers(channelId, users);
        }
      } catch (error) {
        console.error('Erro ao carregar usuários do canal:', error);
      }
    },
  }))
);

// Selectors para facilitar o uso
export const useExternalChat = () => {
  return useUnifiedChatStore((state) => ({
    ...state.external,
    isConnected: state.isConnected,
    soundEnabled: state.soundEnabled,
  }));
};

export const useInternalChat = () => {
  return useUnifiedChatStore((state) => ({
    ...state.internal,
    isConnected: state.isConnected,
    soundEnabled: state.soundEnabled,
  }));
};