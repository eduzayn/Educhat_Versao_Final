import { create } from 'zustand';

// Store simplificado apenas para estado de UI local (não dados estruturais)
interface ChatUIStore {
  isConnected: boolean;
  setConnectionStatus: (isConnected: boolean) => void;
}

export const useChatUIStore = create<ChatUIStore>((set) => ({
  isConnected: false,
  setConnectionStatus: (isConnected) => set({ isConnected }),
}));

// Exportação de compatibilidade temporária
export const useChatStore = useChatUIStore;
