/**
 * Sistema de fallback para Socket.IO xhr poll error em produção Replit
 * Implementa reconexão inteligente com priorização de WebSocket
 */

import { io, Socket } from 'socket.io-client';

interface SocketFallbackConfig {
  url: string;
  maxRetries: number;
  retryDelay: number;
  forceWebSocket?: boolean;
}

export class SocketFallback {
  private socket: Socket | null = null;
  private config: SocketFallbackConfig;
  private retryCount = 0;
  private isReconnecting = false;

  constructor(config: SocketFallbackConfig) {
    this.config = config;
  }

  connect(): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    const isReplit = window.location.hostname.includes('replit.app') || 
                     window.location.hostname.includes('replit.dev');
    
    // Forçar WebSocket em produção Replit para evitar transport errors
    const transports = this.config.forceWebSocket || isReplit ? 
      ['websocket'] : ['websocket'];

    console.log(`🔌 Conectando Socket.IO (tentativa ${this.retryCount + 1}) com transports:`, transports);

    this.socket = io(this.config.url, {
      transports,
      upgrade: false, // Desabilitar upgrades para evitar instabilidades
      rememberUpgrade: false,
      timeout: 30000,
      reconnection: false, // Controle manual de reconexão
      autoConnect: true,
      forceNew: true,
      withCredentials: false,
      // Headers para WebSocket em produção
      extraHeaders: isReplit ? {
        'Connection': 'Upgrade',
        'Upgrade': 'websocket'
      } : {}
    });

    this.setupEventHandlers();
    return this.socket;
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Socket.IO conectado com sucesso');
      this.retryCount = 0;
      this.isReconnecting = false;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket.IO desconectado:', reason);
      
      // Reconexão automática apenas para problemas específicos
      if (this.shouldRetry(reason)) {
        this.handleReconnection(reason);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Erro de conexão Socket.IO:', error.message);
      
      if (error.message.includes('xhr poll error')) {
        console.log('🔧 xhr poll error detectado - forçando WebSocket only');
        this.config.forceWebSocket = true;
      }
      
      this.handleReconnection('connect_error');
    });
  }

  private shouldRetry(reason: string): boolean {
    // Não reconectar se desconectado intencionalmente
    if (reason === 'io client disconnect') {
      return false;
    }

    // Reconectar para problemas de rede/transporte
    return this.retryCount < this.config.maxRetries && !this.isReconnecting;
  }

  private async handleReconnection(reason: string) {
    if (this.isReconnecting || this.retryCount >= this.config.maxRetries) {
      return;
    }

    this.isReconnecting = true;
    this.retryCount++;

    console.log(`🔄 Tentando reconexão ${this.retryCount}/${this.config.maxRetries} (motivo: ${reason})`);

    // Limpar socket anterior
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
    }

    // Aguardar antes de reconectar
    await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));

    // Tentar reconexão
    this.connect();
  }

  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.retryCount = 0;
    this.isReconnecting = false;
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}