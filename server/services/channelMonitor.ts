import { storage } from "../storage/index";

interface ChannelStatus {
  channelId: number;
  isConnected: boolean;
  connectionStatus: string;
  smartphoneConnected?: boolean;
}

class ChannelMonitor {
  private monitorInterval: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL = 60000; // 1 minuto

  start() {
    if (this.monitorInterval) {
      this.stop();
    }

    console.log('🔍 Iniciando monitor de status dos canais');
    
    this.monitorInterval = setInterval(async () => {
      await this.checkAllChannels();
    }, this.CHECK_INTERVAL);

    // Verificação inicial
    setTimeout(() => this.checkAllChannels(), 5000);
  }

  stop() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
      console.log('🛑 Monitor de canais parado');
    }
  }

  private async checkAllChannels() {
    try {
      const channels = await storage.getChannelsByType('whatsapp');
      const activeChannels = channels.filter(ch => ch.isActive && ch.instanceId && ch.token && ch.clientToken);

      if (activeChannels.length === 0) {
        return;
      }

      console.log(`🔍 Verificando status de ${activeChannels.length} canais ativos`);

      const statusChecks = activeChannels.map(channel => this.checkChannelStatus(channel));
      const results = await Promise.allSettled(statusChecks);

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          this.handleStatusUpdate(result.value);
        } else if (result.status === 'rejected') {
          console.warn(`❌ Erro ao verificar canal ${activeChannels[index].id}:`, result.reason);
        }
      });

    } catch (error) {
      console.error('❌ Erro no monitor de canais:', error);
    }
  }

  private async checkChannelStatus(channel: any): Promise<ChannelStatus | null> {
    try {
      const { instanceId, token, clientToken } = channel;
      const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/status`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Client-Token': clientToken,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      if (!response.ok) {
        return {
          channelId: channel.id,
          isConnected: false,
          connectionStatus: 'error'
        };
      }

      const data = await response.json();
      
      return {
        channelId: channel.id,
        isConnected: data.connected || false,
        connectionStatus: data.connected ? 'connected' : 'disconnected',
        smartphoneConnected: data.smartphoneConnected || false
      };

    } catch (error) {
      console.warn(`⚠️ Erro ao verificar canal ${channel.id}:`, error);
      return {
        channelId: channel.id,
        isConnected: false,
        connectionStatus: 'error'
      };
    }
  }

  private async handleStatusUpdate(status: ChannelStatus) {
    try {
      // Buscar status atual do banco
      const currentChannel = await storage.getChannel(status.channelId);
      if (!currentChannel) return;

      // Verificar se houve mudança no status
      const statusChanged = currentChannel.isConnected !== status.isConnected ||
                           currentChannel.connectionStatus !== status.connectionStatus;

      if (statusChanged) {
        console.log(`🔄 Status do canal ${status.channelId} mudou:`, {
          antes: { 
            connected: currentChannel.isConnected, 
            status: currentChannel.connectionStatus 
          },
          depois: { 
            connected: status.isConnected, 
            status: status.connectionStatus 
          }
        });

        // Atualizar no banco
        await storage.updateChannel(status.channelId, {
          isConnected: status.isConnected,
          connectionStatus: status.connectionStatus,
          lastConnectionCheck: new Date()
        });

        // Broadcast via Socket.IO para clientes conectados
        try {
          const { getIOInstance } = await import("../routes/realtime/realtime-broadcast");
          const io = getIOInstance();
          if (io) {
            io.emit('channel_status_update', {
              channelId: status.channelId,
              isConnected: status.isConnected,
              connectionStatus: status.connectionStatus,
              smartphoneConnected: status.smartphoneConnected,
              timestamp: new Date().toISOString()
            });

            console.log(`📡 Status do canal ${status.channelId} enviado via Socket.IO`);
          }
        } catch (error) {
          console.warn('⚠️ Erro ao enviar atualização via Socket.IO:', error);
        }
      }

    } catch (error) {
      console.error(`❌ Erro ao processar atualização do canal ${status.channelId}:`, error);
    }
  }

  // Método para verificação manual de um canal específico
  async checkSingleChannel(channelId: number): Promise<void> {
    try {
      const channel = await storage.getChannel(channelId);
      if (!channel || !channel.isActive) return;

      const status = await this.checkChannelStatus(channel);
      if (status) {
        await this.handleStatusUpdate(status);
      }
    } catch (error) {
      console.error(`❌ Erro ao verificar canal ${channelId}:`, error);
    }
  }
}

export const channelMonitor = new ChannelMonitor();