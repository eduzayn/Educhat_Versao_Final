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
  reactions: Record<string, number[]>; // emoji -> userIds
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

export interface TypingUser {
  userId: number;
  userName: string;
  channelId: string;
  timestamp: Date;
}

export interface ChatUser {
  id: number;
  username: string;
  displayName: string;
  avatar?: string;
  roleName?: string;
}

interface AudioSettings {
  enabled: boolean;
  volume: number;
  sendSound: string;
  receiveSound: string;
  playOnTyping: boolean;
  onlyWhenInactive: boolean;
}

interface InternalChatStore {
  // Estado
  activeChannel: string | null;
  channels: InternalChatChannel[];
  messages: Record<string, InternalChatMessage[]>;
  typingUsers: TypingUser[];
  isConnected: boolean;
  soundEnabled: boolean;
  audioSettings: AudioSettings;
  channelUsers: Record<string, ChatUser[]>;
  
  // Ações
  setActiveChannel: (channelId: string | null) => void;
  addChannel: (channel: InternalChatChannel) => void;
  updateChannel: (channelId: string, updates: Partial<InternalChatChannel>) => void;
  addMessage: (message: InternalChatMessage) => void;
  updateMessage: (messageId: string, updates: Partial<InternalChatMessage>) => void;
  deleteMessage: (messageId: string, channelId: string) => void;
  addReaction: (messageId: string, channelId: string, emoji: string, userId: number) => void;
  removeReaction: (messageId: string, channelId: string, emoji: string, userId: number) => void;
  setTyping: (user: TypingUser) => void;
  removeTyping: (userId: number, channelId: string) => void;
  setConnected: (connected: boolean) => void;
  toggleSound: () => void;
  updateAudioSettings: (settings: Partial<AudioSettings>) => void;
  playNotificationSound: (type: 'send' | 'receive') => void;
  markChannelAsRead: (channelId: string) => void;
  getChannelMessages: (channelId: string) => InternalChatMessage[];
  getUnreadTotal: () => number;
  loadChannels: () => Promise<void>;
  loadChannelUsers: (channelId: string) => Promise<void>;
  setChannelUsers: (channelId: string, users: ChatUser[]) => void;
}

// Configurações padrão de áudio
const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  enabled: true,
  volume: 70,
  sendSound: 'notification-pop.mp3',
  receiveSound: 'notification-ding.mp3',
  playOnTyping: false,
  onlyWhenInactive: true
};

export const useInternalChatStore = create<InternalChatStore>()(
  subscribeWithSelector((set, get) => ({
    // Estado inicial
    activeChannel: null,
    channels: [],
    messages: {},
    typingUsers: [],
    isConnected: true,
    soundEnabled: true,
    audioSettings: DEFAULT_AUDIO_SETTINGS,
    channelUsers: {},

    // Ações
    setActiveChannel: (channelId) => set({ activeChannel: channelId }),
    
    addChannel: (channel) => set((state) => ({
      channels: [...state.channels, channel]
    })),
    
    updateChannel: (channelId, updates) => set((state) => ({
      channels: state.channels.map(channel =>
        channel.id === channelId ? { ...channel, ...updates } : channel
      )
    })),
    
    addMessage: (message) => set((state) => {
      const channelMessages = state.messages[message.channelId] || [];
      const newMessages = {
        ...state.messages,
        [message.channelId]: [...channelMessages, message]
      };
      
      // Atualizar última mensagem e atividade do canal
      const updatedChannels = state.channels.map(channel =>
        channel.id === message.channelId 
          ? { 
              ...channel, 
              lastMessage: message,
              lastActivity: message.timestamp,
              unreadCount: channel.id === state.activeChannel ? 0 : channel.unreadCount + 1
            }
          : channel
      );
      
      return {
        messages: newMessages,
        channels: updatedChannels
      };
    }),
    
    updateMessage: (messageId, updates) => set((state) => {
      const newMessages = { ...state.messages };
      Object.keys(newMessages).forEach(channelId => {
        newMessages[channelId] = newMessages[channelId].map(msg =>
          msg.id === messageId ? { ...msg, ...updates } : msg
        );
      });
      return { messages: newMessages };
    }),
    
    deleteMessage: (messageId, channelId) => set((state) => ({
      messages: {
        ...state.messages,
        [channelId]: state.messages[channelId]?.filter(msg => msg.id !== messageId) || []
      }
    })),
    
    addReaction: (messageId, channelId, emoji, userId) => set((state) => {
      const newMessages = { ...state.messages };
      if (newMessages[channelId]) {
        newMessages[channelId] = newMessages[channelId].map(msg => {
          if (msg.id === messageId) {
            const reactions = { ...msg.reactions };
            if (!reactions[emoji]) reactions[emoji] = [];
            if (!reactions[emoji].includes(userId)) {
              reactions[emoji].push(userId);
            }
            return { ...msg, reactions };
          }
          return msg;
        });
      }
      return { messages: newMessages };
    }),
    
    removeReaction: (messageId, channelId, emoji, userId) => set((state) => {
      const newMessages = { ...state.messages };
      if (newMessages[channelId]) {
        newMessages[channelId] = newMessages[channelId].map(msg => {
          if (msg.id === messageId) {
            const reactions = { ...msg.reactions };
            if (reactions[emoji]) {
              reactions[emoji] = reactions[emoji].filter(id => id !== userId);
              if (reactions[emoji].length === 0) {
                delete reactions[emoji];
              }
            }
            return { ...msg, reactions };
          }
          return msg;
        });
      }
      return { messages: newMessages };
    }),
    
    setTyping: (user) => set((state) => {
      const existingIndex = state.typingUsers.findIndex(
        u => u.userId === user.userId && u.channelId === user.channelId
      );
      if (existingIndex >= 0) {
        const newTypingUsers = [...state.typingUsers];
        newTypingUsers[existingIndex] = user;
        return { typingUsers: newTypingUsers };
      } else {
        return { typingUsers: [...state.typingUsers, user] };
      }
    }),
    
    removeTyping: (userId, channelId) => set((state) => ({
      typingUsers: state.typingUsers.filter(
        u => !(u.userId === userId && u.channelId === channelId)
      )
    })),
    
    setConnected: (connected) => set({ isConnected: connected }),
    
    toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
    
    // Atualizar configurações de áudio
    updateAudioSettings: (newSettings) => {
      const updatedSettings = { ...get().audioSettings, ...newSettings };
      set({ audioSettings: updatedSettings });
      
      // Salvar no localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('internal-chat-audio-settings', JSON.stringify(updatedSettings));
      }
    },

    // Reproduzir som de notificação
    playNotificationSound: (type: 'send' | 'receive') => {
      const { audioSettings } = get();
      
      if (!audioSettings.enabled) return;
      
      // Verificar se deve tocar apenas quando inativo
      if (audioSettings.onlyWhenInactive && !document.hidden) return;
      
      const soundFile = type === 'send' ? audioSettings.sendSound : audioSettings.receiveSound;
      
      if (!soundFile) return;
      
      try {
        const audio = new Audio(`/sounds/${soundFile}`);
        audio.volume = audioSettings.volume / 100;
        audio.play().catch(error => {
          console.warn('Erro ao reproduzir som:', error);
        });
      } catch (error) {
        console.warn('Erro ao criar áudio:', error);
      }
    },
    
    markChannelAsRead: (channelId) => set((state) => ({
      channels: state.channels.map(channel =>
        channel.id === channelId ? { ...channel, unreadCount: 0 } : channel
      )
    })),
    
    getChannelMessages: (channelId) => {
      const state = get();
      return state.messages[channelId] || [];
    },
    
    getUnreadTotal: () => {
      const state = get();
      return state.channels.reduce((total, channel) => total + channel.unreadCount, 0);
    },

    // Carregar canais baseados nas equipes do usuário
    loadChannels: async () => {
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
      }
    },

    // Carregar usuários de um canal específico
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

    // Definir usuários de um canal
    setChannelUsers: (channelId: string, users: ChatUser[]) => set((state) => ({
      channelUsers: {
        ...state.channelUsers,
        [channelId]: users
      }
    })),
  }))
);

// Cleanup de usuários digitando antigos (mais de 10 segundos)
setInterval(() => {
  const { typingUsers, removeTyping } = useInternalChatStore.getState();
  const now = new Date();
  typingUsers.forEach(user => {
    if (now.getTime() - user.timestamp.getTime() > 10000) {
      removeTyping(user.userId, user.channelId);
    }
  });
}, 5000);