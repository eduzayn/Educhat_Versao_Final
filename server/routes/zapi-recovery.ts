// Sistema de recuperação de mensagens perdidas da Z-API
import { storage } from "../core/storage";
import { validateZApiCredentials } from '../core/zapi-utils';

export async function recoverMissedMessages(phoneNumber: string, fromDate?: Date) {
  try {
    const credentials = validateZApiCredentials();
    if (!credentials.valid) {
      throw new Error(`Credenciais Z-API inválidas: ${credentials.error}`);
    }

    const { instanceId, token, clientToken } = credentials;
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    
    // Buscar mensagens da Z-API para este número específico
    const startDate = fromDate || new Date(Date.now() - 24 * 60 * 60 * 1000); // Últimas 24h por padrão
    
    console.log(`🔍 Recuperando mensagens perdidas para ${cleanPhone} desde ${startDate.toISOString()}`);
    
    const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/messages`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Client-Token': clientToken || '',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Erro na Z-API: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    let recoveredCount = 0;
    
    if (data && Array.isArray(data)) {
      // Filtrar mensagens do número específico
      const phoneMessages = data.filter((msg: any) => 
        msg.phone === cleanPhone && 
        new Date(msg.timestamp) >= startDate
      );
      
      console.log(`📱 Encontradas ${phoneMessages.length} mensagens na Z-API para ${cleanPhone}`);
      
      // Processar cada mensagem encontrada
      for (const zapiMessage of phoneMessages) {
        try {
          // Verificar se a mensagem já existe no banco
          const existingMessage = await storage.findMessageByWhatsAppId(zapiMessage.messageId);
          
          if (!existingMessage) {
            console.log(`🔄 Processando mensagem perdida: ${zapiMessage.messageId}`);
            
            // Simular webhook para processar a mensagem
            const webhookData = {
              type: 'ReceivedCallback',
              phone: cleanPhone,
              instanceId: instanceId,
              messageId: zapiMessage.messageId,
              timestamp: zapiMessage.timestamp
            };
            
            if (zapiMessage.text) {
              webhookData.text = { message: zapiMessage.text };
            } else if (zapiMessage.image) {
              webhookData.image = zapiMessage.image;
            } else if (zapiMessage.audio) {
              webhookData.audio = zapiMessage.audio;
            }
            
            // Processar via lógica do webhook
            await processWebhookMessage(webhookData);
            recoveredCount++;
          }
        } catch (messageError) {
          console.error(`❌ Erro ao processar mensagem ${zapiMessage.messageId}:`, messageError);
        }
      }
    }
    
    console.log(`✅ Recuperação concluída: ${recoveredCount} mensagens recuperadas para ${cleanPhone}`);
    return { recovered: recoveredCount, total: data?.length || 0 };
    
  } catch (error) {
    console.error(`❌ Erro na recuperação de mensagens para ${phoneNumber}:`, error);
    throw error;
  }
}

// Função auxiliar para processar webhook simulado
async function processWebhookMessage(webhookData: any) {
  // Implementar a mesma lógica do webhook principal
  // Esta seria uma versão simplificada da lógica já existente
  const phone = webhookData.phone;
  const channelName = 'comercial'; // Para a instância comercial
  
  // Buscar ou criar contato
  let contact = await storage.findContactByPhone(phone);
  if (!contact) {
    contact = await storage.createContact({
      name: phone,
      phone: phone,
      email: null,
      isOnline: true,
      canalOrigem: channelName,
      nomeCanal: 'Comercial'
    });
  }
  
  // Buscar ou criar conversa
  let conversation = await storage.getConversationByContactAndChannel(contact.id, channelName);
  if (!conversation) {
    conversation = await storage.createConversation({
      contactId: contact.id,
      channel: channelName,
      status: 'open',
      lastMessageAt: new Date(webhookData.timestamp)
    });
  }
  
  // Determinar conteúdo da mensagem
  let messageContent = '';
  let messageType = 'text';
  
  if (webhookData.text) {
    messageContent = webhookData.text.message;
  } else if (webhookData.image) {
    messageContent = webhookData.image.caption || 'Imagem enviada';
    messageType = 'image';
  } else if (webhookData.audio) {
    messageContent = 'Áudio enviado';
    messageType = 'audio';
  }
  
  // Criar mensagem
  const message = await storage.createMessage({
    conversationId: conversation.id,
    content: messageContent,
    isFromContact: true,
    messageType: messageType as any,
    sentAt: new Date(webhookData.timestamp),
    metadata: webhookData,
    whatsappMessageId: webhookData.messageId
  });
  
  console.log(`✅ Mensagem recuperada: ID ${message.id} na conversa ${conversation.id}`);
  return message;
}