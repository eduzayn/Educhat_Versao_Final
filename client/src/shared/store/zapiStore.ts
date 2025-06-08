import { create } from 'zustand';

interface ZApiStatus {
  connected: boolean;
  session: boolean;
  smartphoneConnected: boolean;
  lastUpdated: Date;
}

interface ZApiState {
  status: ZApiStatus | null;
  isConfigured: boolean;
  instanceId: string | null;
  connectionMonitorActive: boolean;
  monitorInterval: NodeJS.Timeout | null;
  setStatus: (status: ZApiStatus) => void;
  setConfigured: (configured: boolean, instanceId?: string) => void;
  startConnectionMonitor: () => void;
  stopConnectionMonitor: () => void;
  checkConnection: () => Promise<void>;
  restoreConnection: () => Promise<void>;
}

export const useZApiStore = create<ZApiState>((set, get) => ({
  status: null,
  isConfigured: false,
  instanceId: null,
  connectionMonitorActive: false,
  monitorInterval: null,

  setStatus: (status: ZApiStatus) => {
    const newStatus = { ...status, lastUpdated: new Date() };
    set({ status: newStatus });
    
    // Salvar no localStorage para persistência (throttle para reduzir I/O)
    const saveToStorage = () => {
      localStorage.setItem('zapi-status', JSON.stringify(newStatus));
    };
    
    // Debounce localStorage writes
    clearTimeout((globalThis as any).zapiStorageTimeout);
    (globalThis as any).zapiStorageTimeout = setTimeout(saveToStorage, 1000);
    
    // Se conectado, marcar como configurado
    if (status.connected) {
      const currentState = get();
      if (!currentState.isConfigured) {
        get().setConfigured(true);
      }
    }
  },

  setConfigured: (configured: boolean, instanceId?: string) => {
    const currentState = get();
    
    // Evitar atualizações desnecessárias que causam loops
    if (currentState.isConfigured === configured && currentState.instanceId === (instanceId || null)) {
      return;
    }
    
    set({ 
      isConfigured: configured,
      instanceId: instanceId || null
    });
    
    // Salvar no localStorage
    localStorage.setItem('zapi-configured', JSON.stringify({
      isConfigured: configured,
      instanceId: instanceId || null
    }));
  },

  startConnectionMonitor: () => {
    const { monitorInterval, checkConnection } = get();
    
    // Parar monitor existente se houver
    if (monitorInterval) {
      clearInterval(monitorInterval);
    }
    
    // Verificar imediatamente
    checkConnection();
    
    // Configurar novo monitor a cada 60 segundos para reduzir carga significativamente
    const interval = setInterval(() => {
      checkConnection();
    }, 60000);
    
    set({ 
      connectionMonitorActive: true,
      monitorInterval: interval 
    });
  },

  stopConnectionMonitor: () => {
    const { monitorInterval } = get();
    
    if (monitorInterval) {
      clearInterval(monitorInterval);
    }
    
    set({ 
      connectionMonitorActive: false,
      monitorInterval: null 
    });
  },

  checkConnection: async () => {
    try {
      const response = await fetch('/api/zapi/status');
      if (response.ok) {
        const status = await response.json();
        const currentStatus = get().status;
        
        // Só atualizar se houver mudança significativa no status
        if (!currentStatus || 
            currentStatus.connected !== status.connected || 
            currentStatus.session !== status.session ||
            currentStatus.smartphoneConnected !== status.smartphoneConnected) {
          get().setStatus(status);
        }
      }
    } catch (error) {
      // Silenciosamente lidar com erros de conectividade sem logs excessivos
      const currentStatus = get().status;
      if (currentStatus?.connected) {
        // Só logar se estava conectado e agora falhou
        console.warn('Erro de conectividade Z-API (será reativado automaticamente):', (error as Error)?.message || 'Network error');
      }
    }
  },

  restoreConnection: async () => {
    try {
      // Primeiro, tentar recuperar dados do localStorage se ainda não estiverem carregados
      const { status, isConfigured } = get();
      
      if (!status && !isConfigured) {
        initializeFromLocalStorage();
      }
      
      // Verificar conexão atual
      await get().checkConnection();
      
      // Se configurado, iniciar monitoramento
      const currentState = get();
      if (currentState.isConfigured && !currentState.connectionMonitorActive) {
        get().startConnectionMonitor();
      }
    } catch (error) {
      console.error('Erro ao restaurar conexão Z-API:', error);
    }
  }
}));

// Função para inicializar dados do localStorage
const initializeFromLocalStorage = () => {
  if (typeof window === 'undefined') return;

  try {
    const savedConfig = localStorage.getItem('zapi-configured');
    
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      useZApiStore.setState({ 
        isConfigured: config.isConfigured,
        instanceId: config.instanceId 
      });
      
      // Se configurado, iniciar monitoramento automaticamente
      if (config.isConfigured) {
        setTimeout(() => {
          const store = useZApiStore.getState();
          if (!store.connectionMonitorActive) {
            store.startConnectionMonitor();
          }
        }, 100);
      }
    }
  } catch (error) {
    console.error('Erro ao recuperar dados do localStorage:', error);
    // Limpar dados corrompidos
    localStorage.removeItem('zapi-status');
    localStorage.removeItem('zapi-configured');
  }
};

// Inicializar com dados do localStorage
initializeFromLocalStorage();