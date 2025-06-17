import { BaseStorage } from '../base/BaseStorage';

export class ManychatApiOperations extends BaseStorage {
  // Helper methods for testing Manychat API
  async testManychatConnection(apiKey: string): Promise<any> {
    try {
      // Test API key validity using the correct Manychat API format
      const response = await fetch('https://api.manychat.com/fb/page/getInfo', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      // Handle different response codes appropriately
      if (response.status === 401) {
        return {
          success: false,
          error: 'API Key inválida ou expirada. Verifique no painel do Manychat: Settings > API > Gerar nova chave se necessário',
          message: 'Falha na autenticação',
          status: response.status
        };
      }

      if (response.status === 403) {
        return {
          success: false,
          error: 'API Key lacks required permissions',
          message: 'Permission denied',
          status: response.status
        };
      }

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `API responded with status ${response.status}: ${errorText}`,
          message: 'Connection failed',
          status: response.status
        };
      }

      const data = await response.json();
      
      return {
        success: true,
        data: data,
        message: 'Connection successful - API key is valid',
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error occurred',
        message: 'Connection failed'
      };
    }
  }
} 