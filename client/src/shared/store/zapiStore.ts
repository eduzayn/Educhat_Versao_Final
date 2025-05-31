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
    
    // Salvar no localStorage para persistência
    localStorage.setItem('zapi-status', JSON.stringify(newStatus));
    
    // Se conectado, marcar como configurado
    if (status.connected) {
      get().setConfigured(true);
    }
  },

  setConfigured: (configured: boolean, instanceId?: string) => {
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
    
    // Configurar novo monitor a cada 3 segundos
    const interval = setInterval(() => {
      checkConnection();
    }, 3000);
    
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
        get().setStatus(status);
      }
    } catch (error) {
      console.error('Erro ao verificar status Z-API:', error);
    }
  },

  restoreConnection: async () => {
    try {
      // Tentar verificar conexão existente
      await get().checkConnection();
      
      // Se não há configuração salva, não fazer nada
      const { isConfigured } = get();
      if (isConfigured) {
        get().startConnectionMonitor();
      }
    } catch (error) {
      console.error('Erro ao restaurar conexão Z-API:', error);
    }
  }
}));

// Inicializar com dados do localStorage ao carregar
if (typeof window !== 'undefined') {
  const savedStatus = localStorage.getItem('zapi-status');
  const savedConfig = localStorage.getItem('zapi-configured');
  
  if (savedStatus) {
    try {
      const status = JSON.parse(savedStatus);
      useZApiStore.setState({ status });
    } catch (error) {
      console.error('Erro ao recuperar status do localStorage:', error);
    }
  }
  
  if (savedConfig) {
    try {
      const config = JSON.parse(savedConfig);
      useZApiStore.setState({ 
        isConfigured: config.isConfigured,
        instanceId: config.instanceId 
      });
    } catch (error) {
      console.error('Erro ao recuperar configuração do localStorage:', error);
    }
  }
}