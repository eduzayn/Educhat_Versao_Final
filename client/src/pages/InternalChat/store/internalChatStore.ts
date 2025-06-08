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

interface InternalChatStore {
  // Estado
  activeChannel: string | null;
  channels: InternalChatChannel[];
  messages: Record<string, InternalChatMessage[]>;
  typingUsers: TypingUser[];
  isConnected: boolean;
  soundEnabled: boolean;
  
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
  markChannelAsRead: (channelId: string) => void;
  getChannelMessages: (channelId: string) => InternalChatMessage[];
  getUnreadTotal: () => number;
}

export const useInternalChatStore = create<InternalChatStore>()(
  subscribeWithSelector((set, get) => ({
    // Estado inicial
    activeChannel: null,
    channels: [],
    messages: {},
    typingUsers: [],
    isConnected: true,
    soundEnabled: true,

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