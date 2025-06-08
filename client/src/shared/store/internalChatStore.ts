import { create } from 'zustand';

interface InternalChatState {
  activeChannel: string | null;
  channels: any[];
  messages: any[];
  isLoading: boolean;
  setActiveChannel: (channel: string | null) => void;
  loadChannels: () => Promise<void>;
  addMessage: (message: any) => void;
  clearMessages: () => void;
}

export const useInternalChatStore = create<InternalChatState>((set, get) => ({
  activeChannel: null,
  channels: [],
  messages: [],
  isLoading: false,

  setActiveChannel: (channel) => {
    set({ activeChannel: channel });
  },

  loadChannels: async () => {
    set({ isLoading: true });
    try {
      // Implementação para carregar canais
      set({ isLoading: false });
    } catch (error) {
      set({ isLoading: false });
    }
  },

  addMessage: (message) => {
    set(state => ({
      messages: [...state.messages, message]
    }));
  },

  clearMessages: () => {
    set({ messages: [] });
  }
}));