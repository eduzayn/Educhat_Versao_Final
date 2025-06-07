// Movido de server/zapi-connection.ts para consolidação
import fetch from 'node-fetch';

const ZAPI_BASE_URL = 'https://api.z-api.io';

export interface ZApiCredentials {
  instanceId: string;
  token: string;
  clientToken: string;
}

export interface ZApiResponse {
  connected: boolean;
  session: boolean;
  smartphoneConnected?: boolean;
  error?: string;
  created?: number;
}

export interface ZApiMessage {
  phone: string;
  message: string;
}

export class ZApiConnection {
  private credentials: ZApiCredentials;

  constructor(credentials: ZApiCredentials) {
    this.credentials = credentials;
  }

  private getApiUrl(endpoint: string): string {
    const { instanceId, token } = this.credentials;
    return `${ZAPI_BASE_URL}/instances/${instanceId}/token/${token}/${endpoint}`;
  }

  async getStatus(): Promise<ZApiResponse> {
    try {
      const response = await fetch(this.getApiUrl('status'));
      const data = await response.json() as ZApiResponse;
      return data;
    } catch (error) {
      console.error('Erro ao obter status da Z-API:', error);
      throw error;
    }
  }

  async sendMessage(message: ZApiMessage): Promise<any> {
    try {
      const response = await fetch(this.getApiUrl('send-text'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Client-Token': this.credentials.clientToken,
        },
        body: JSON.stringify(message),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao enviar mensagem via Z-API:', error);
      throw error;
    }
  }

  async sendMedia(data: { phone: string; image?: string; caption?: string; document?: string; fileName?: string }): Promise<any> {
    try {
      const endpoint = data.image ? 'send-image' : 'send-document';
      const response = await fetch(this.getApiUrl(endpoint), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Client-Token': this.credentials.clientToken,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Erro ao enviar mídia via Z-API:', error);
      throw error;
    }
  }

  async getQRCode(): Promise<string> {
    try {
      const response = await fetch(this.getApiUrl('qr-code'));
      const data = await response.json() as { value: string };
      return data.value;
    } catch (error) {
      console.error('Erro ao obter QR Code da Z-API:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await fetch(this.getApiUrl('disconnect'), {
        method: 'POST',
        headers: {
          'Client-Token': this.credentials.clientToken,
        },
      });
    } catch (error) {
      console.error('Erro ao desconectar da Z-API:', error);
      throw error;
    }
  }

  async restart(): Promise<void> {
    try {
      await fetch(this.getApiUrl('restart'), {
        method: 'POST',
        headers: {
          'Client-Token': this.credentials.clientToken,
        },
      });
    } catch (error) {
      console.error('Erro ao reiniciar Z-API:', error);
      throw error;
    }
  }
}