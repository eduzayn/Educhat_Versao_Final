import { Express, Response } from 'express';
import { AuthenticatedRequest } from '../../core/permissions';
import { storage } from "../../storage/index";
import { validateZApiCredentials } from '../../utils/zapi';

export function registerZApiRoutes(app: Express) {
  // Cache para o status Z-API (10 segundos)
  let statusCache: { data: any; timestamp: number } | null = null;
  const CACHE_DURATION = 10000; // 10 segundos para reduzir ainda mais a carga

  // Z-API Status endpoint - REST: GET /api/zapi/status
  app.get('/api/zapi/status', async (req, res) => {
    try {
      // Verificar cache primeiro
      const now = Date.now();
      if (statusCache && (now - statusCache.timestamp) < CACHE_DURATION) {
        return res.json(statusCache.data);
      }

      const credentials = validateZApiCredentials();
      if (!credentials.valid) {
        return res.status(400).json({ error: credentials.error });
      }

      const { instanceId, token, clientToken } = credentials;
      const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/status`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Client-Token': clientToken || '',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro na API Z-API: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      
      // Atualizar cache
      statusCache = { data, timestamp: now };
      
      // Só logar se houver mudança de status ou erro real
      if (data.error && data.error !== 'You are already connected.') {
        console.log('⚠️ Z-API Status:', data);
      }
      
      res.json(data);
      
    } catch (error) {
      console.error('Erro ao obter status Z-API:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });

  // Send message via Z-API - REST: POST /api/zapi/send-message
  app.post('/api/zapi/send-message', async (req, res) => {
    try {
      console.log('📤 Enviando mensagem via Z-API:', req.body);
      
      const { phone, message, conversationId, channelId } = req.body;
      
      if (!phone || !message) {
        return res.status(400).json({ 
          error: 'Phone e message são obrigatórios' 
        });
      }

      let credentials;
      
      // Se channelId foi fornecido, buscar credenciais específicas do canal
      if (channelId) {
        try {
          const channel = await storage.getChannel(channelId);
          if (!channel || !channel.isActive || channel.type !== 'whatsapp') {
            return res.status(400).json({ 
              error: 'Canal WhatsApp não encontrado ou inativo' 
            });
          }
          
          const config = (channel.configuration as any) || {};
          credentials = {
            valid: true,
            instanceId: config.instanceId || channel.instanceId,
            token: config.token || channel.token,
            clientToken: config.clientToken || channel.clientToken
          };
          
          if (!credentials.instanceId || !credentials.token || !credentials.clientToken) {
            return res.status(400).json({ 
              error: 'Canal WhatsApp não configurado corretamente' 
            });
          }
          
          console.log(`📱 Usando canal específico: ${channel.name} (ID: ${channelId})`);
        } catch (error) {
          console.error('❌ Erro ao buscar canal:', error);
          return res.status(500).json({ 
            error: 'Erro ao buscar configurações do canal' 
          });
        }
      } else {
        // Fallback para credenciais padrão (compatibilidade)
        credentials = validateZApiCredentials();
        if (!credentials.valid) {
          return res.status(400).json({ error: credentials.error });
        }
        console.log('📱 Usando credenciais padrão Z-API');
      }

      const { instanceId, token, clientToken } = credentials;
      const cleanPhone = phone.replace(/\D/g, '');
      
      const payload = {
        phone: cleanPhone,
        message: message.toString()
      };

      const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`;
      console.log('📤 Enviando para Z-API:', { url: url.replace(token!, '****'), payload });

      // Configurar timeout de 15 segundos para requisições Z-API (otimizado para velocidade)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      let data;

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Client-Token': clientToken || '',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        const responseText = await response.text();
        console.log('📥 Resposta Z-API:', {
          status: response.status,
          statusText: response.statusText,
          body: responseText
        });

        if (!response.ok) {
          console.error('❌ Erro na Z-API:', responseText);
          throw new Error(`Erro na API Z-API: ${response.status} - ${response.statusText}`);
        }

        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('❌ Erro ao parsear resposta JSON:', parseError);
          throw new Error(`Resposta inválida da Z-API: ${responseText}`);
        }
        
        console.log('✅ Mensagem enviada com sucesso via Z-API:', data);
        
      } catch (fetchError) {
        clearTimeout(timeoutId);
        
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          throw new Error('Timeout: Requisição cancelada após 15 segundos');
        }
        
        throw fetchError;
      }

      // Se conversationId foi fornecido, atualizar metadados em background (não bloqueia resposta)
      if (conversationId && data) {
        setImmediate(async () => {
          try {
            const messages = await storage.messages.getMessages(parseInt(conversationId));
            const recentMessage = messages
              .filter(msg => !msg.isFromContact && !(msg.metadata as any)?.zaapId)
              .sort((a, b) => new Date(b.sentAt || new Date()).getTime() - new Date(a.sentAt || new Date()).getTime())[0];
            
            if (recentMessage) {
              await storage.messages.updateMessage(recentMessage.id, {
                metadata: {
                  ...(recentMessage.metadata as any || {}),
                  zaapId: data.messageId || data.id,
                  messageId: data.messageId || data.id,
                  phone: cleanPhone,
                  instanceId: instanceId
                }
              });
              console.log('✅ Metadados Z-API atualizados na mensagem:', recentMessage.id);
            }
          } catch (dbError) {
            console.error('❌ Erro ao atualizar metadados da mensagem:', dbError);
          }
        });
      }
      
      // Resposta imediata para o frontend (otimização de velocidade)
      res.json(data);
      
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem via Z-API:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      });
    }
  });
}