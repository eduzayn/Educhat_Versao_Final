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

// Exportação de compatibilidade temporária - apenas estado de conexão
export const useChatStore = () => {
  const { isConnected, setConnectionStatus } = useChatUIStore();
  return {
    isConnected,
    setConnectionStatus,
    // Funções removidas - não usam mais estado estrutural
    activeConversation: null,
    setActiveConversation: () => {},
    selectedContactId: null,
    setSelectedContactId: () => {},
    typingIndicators: {},
    setTypingIndicator: () => {},
    markConversationAsRead: () => {}
  };
};
