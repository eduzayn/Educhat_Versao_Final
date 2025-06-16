import type { Request, Response } from "express";
import { storage } from "../../../storage";
import { validateZApiCredentials, buildZApiUrl, getZApiHeaders } from "../../../utils/zapi";

/**
 * Handler para envio de links via Z-API
 */
export async function handleSendLink(req: Request, res: Response) {
  try {
    console.log('🔗 Recebendo solicitação de envio de link:', req.body);
    
    const { phone, url: linkUrl, text, conversationId } = req.body;
    
    if (!phone || !linkUrl) {
      return res.status(400).json({ 
        error: 'Phone e URL são obrigatórios' 
      });
    }

    const credentials = validateZApiCredentials();
    if (!credentials.valid) {
      return res.status(400).json({ error: credentials.error });
    }

    const { instanceId, token, clientToken } = credentials;
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Preparar payload para Z-API
    const payload = {
      phone: cleanPhone,
      message: text || linkUrl
    };

    const url = buildZApiUrl(instanceId, token, 'send-text');
    console.log('🔗 Enviando link via Z-API:', { 
      url: url.replace(token, '****'), 
      phone: cleanPhone,
      linkUrl,
      hasText: !!text
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Token': clientToken,
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    console.log('📥 Resposta Z-API (link):', {
      status: response.status,
      statusText: response.statusText,
      body: responseText.substring(0, 200) + '...'
    });

    if (!response.ok) {
      console.error('❌ Erro na Z-API (link):', responseText);
      throw new Error(`Erro na API Z-API: ${response.status} - ${response.statusText}`);
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Erro ao parsear resposta JSON (link):', parseError);
      throw new Error(`Resposta inválida da Z-API: ${responseText}`);
    }

    console.log('✅ Link enviado com sucesso via Z-API:', data);
    
    // Salvar mensagem no banco de dados se conversationId foi fornecido
    if (conversationId) {
      try {
        await storage.createMessage({
          conversationId: parseInt(conversationId),
          content: text || linkUrl,
          isFromContact: false,
          messageType: 'text',
          sentAt: new Date(),
          metadata: {
            zaapId: data.messageId || data.id,
            linkSent: true,
            linkUrl: linkUrl,
            originalContent: text || linkUrl
          }
        });

        // Broadcast para WebSocket
        const { broadcast } = await import('../../realtime');
        broadcast(parseInt(conversationId), {
          type: 'message_sent',
          conversationId: parseInt(conversationId)
        });
      } catch (dbError) {
        console.error('❌ Erro ao salvar mensagem de link no banco:', dbError);
      }
    }

    res.json(data);
  } catch (error) {
    console.error('❌ Erro ao enviar link via Z-API:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Erro interno do servidor' 
    });
  }
} 