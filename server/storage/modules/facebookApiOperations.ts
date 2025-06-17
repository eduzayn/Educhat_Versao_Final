import { BaseStorage } from '../base/BaseStorage';

export class FacebookApiOperations extends BaseStorage {
  async testFacebookConnection(accessToken: string): Promise<any> {
    const response = await fetch(`https://graph.facebook.com/me?access_token=${accessToken}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    if (response.status === 401) {
      return { success: false, error: 'Token de acesso inválido ou expirado.', message: 'Falha na autenticação', status: response.status };
    }
    if (response.status === 403) {
      return { success: false, error: 'Permissões insuficientes.', message: 'Acesso negado', status: response.status };
    }
    if (!response.ok) {
      const errorData = await response.text();
      return { success: false, error: `API Facebook retornou erro ${response.status}: ${errorData}`, message: 'Falha na conexão', status: response.status };
    }
    const data = await response.json();
    return { success: true, data, message: 'Conexão estabelecida com sucesso', status: response.status };
  }

  async sendMessage(pageAccessToken: string, recipientId: string, message: string, platform: 'facebook' | 'instagram' = 'facebook'): Promise<any> {
    const url = 'https://graph.facebook.com/v18.0/me/messages';
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${pageAccessToken}` },
      body: JSON.stringify({ recipient: { id: recipientId }, message: { text: message } })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(`Facebook API Error: ${result.error?.message || 'Unknown error'}`);
    return result;
  }

  async replyToComment(pageAccessToken: string, commentId: string, message: string): Promise<any> {
    const response = await fetch(`https://graph.facebook.com/v18.0/${commentId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${pageAccessToken}` },
      body: JSON.stringify({ message })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(`Facebook API Error: ${result.error?.message || 'Unknown error'}`);
    return result;
  }
} 