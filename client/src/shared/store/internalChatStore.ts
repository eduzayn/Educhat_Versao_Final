import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface InternalChatMessage {
  id: string;
  channelId: string;
  userId: number;
  userName: string;
  userAvatar?: string;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'reminder';
  timestamp: Date;
  edited?: boolean;
  editedAt?: Date;
  replyTo?: string;
  reactions: Record<string, number[]>;
  isImportant?: boolean;
  reminderDate?: Date;
}

export interface InternalChatChannel {
  id: string;
  name: string;
  description?: string;
  type: 'team' | 'direct' | 'general';
  teamId?: number;
  participants: number[];
  isPrivate: boolean;
  unreadCount: number;
  lastMessage?: InternalChatMessage;
  lastActivity: Date;
}

export interface ChatUser {
  id: number;
  username: string;
  displayName: string;
  avatar?: string;
  roleName?: string;
}

export interface TypingUser {
  userId: number;
  userName: string;
  channelId: string;
  timestamp: Date;
}

interface InternalChatState {
  activeChannel: string | null;
  channels: InternalChatChannel[];
  messages: Record<string, InternalChatMessage[]>;
  channelUsers: Record<string, ChatUser[]>;
  typingUsers: TypingUser[];
  isConnected: boolean;
  isLoading: boolean;
  
  setActiveChannel: (channel: string | null) => void;
  setConnected: (connected: boolean) => void;
  loadChannels: () => Promise<void>;
  loadChannelMessages: (channelId: string) => Promise<void>;
  loadChannelUsers: (channelId: string) => Promise<void>;
  setChannelUsers: (channelId: string, users: ChatUser[]) => void;
  addMessage: (message: InternalChatMessage) => void;
  clearMessages: () => void;
  playNotificationSound: (type?: 'receive' | 'send' | 'join' | 'leave') => void;
}

export const useInternalChatStore = create<InternalChatState>()(
  subscribeWithSelector((set, get) => ({
    activeChannel: null,
    channels: [],
    messages: {},
    channelUsers: {},
    typingUsers: [],
    isConnected: false,
    isLoading: false,

    setActiveChannel: (channel) => {
      set({ activeChannel: channel });
    },

    setConnected: (connected) => {
      set({ isConnected: connected });
    },

    loadChannels: async () => {
      set({ isLoading: true });
      try {
        const response = await fetch('/api/internal-chat/channels');
        if (response.ok) {
          const channels = await response.json();
          const formattedChannels = channels.map((channel: any) => ({
            ...channel,
            lastActivity: new Date()
          }));
          set({ channels: formattedChannels });
        }
      } catch (error) {
        console.error('Erro ao carregar canais:', error);
      } finally {
        set({ isLoading: false });
      }
    },

    loadChannelMessages: async (channelId: string) => {
      try {
        const response = await fetch(`/api/internal-chat/channels/${channelId}/messages`);
        if (response.ok) {
          const messages = await response.json();
          set((state) => ({
            messages: {
              ...state.messages,
              [channelId]: messages
            }
          }));
        }
      } catch (error) {
        console.error('Erro ao carregar mensagens:', error);
      }
    },

    loadChannelUsers: async (channelId: string) => {
      try {
        const response = await fetch(`/api/internal-chat/channels/${channelId}/users`);
        if (response.ok) {
          const users = await response.json();
          set((state) => ({
            channelUsers: {
              ...state.channelUsers,
              [channelId]: users
            }
          }));
        }
      } catch (error) {
        console.error('Erro ao carregar usuários do canal:', error);
      }
    },

    setChannelUsers: (channelId: string, users: ChatUser[]) => set((state) => ({
      channelUsers: {
        ...state.channelUsers,
        [channelId]: users
      }
    })),

    addMessage: (message) => {
      set((state) => ({
        messages: {
          ...state.messages,
          [message.channelId]: [...(state.messages[message.channelId] || []), message]
        }
      }));
    },

    clearMessages: () => {
      set({ messages: {} });
    },

    // Funcionalidades de notificação sonora
    playNotificationSound: (type: 'receive' | 'send' | 'join' | 'leave' = 'receive') => {
      try {
        const audio = new Audio();
        switch (type) {
          case 'receive':
            audio.src = '/sounds/notification.wav';
            break;
          case 'send':
            audio.src = '/sounds/send.wav';
            break;
          case 'join':
            audio.src = '/sounds/join.wav';
            break;
          case 'leave':
            audio.src = '/sounds/leave.wav';
            break;
        }
        audio.volume = 0.3;
        audio.play().catch(() => {
          // Falha silenciosa se o som não puder ser reproduzido
        });
      } catch (error) {
        // Falha silenciosa
      }
    }
  }))
);