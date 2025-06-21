/**
 * Sistema de Webhooks Consolidado - EduChat
 * Arquivo principal que integra todos os handlers modulares
 * CONSOLIDADO: Removida duplicação da função processZApiWebhook
 */

import type { Express } from "express";
import { storage } from "../../storage/index";
import { validateZApiCredentials, buildZApiUrl, getZApiHeaders } from "../../utils/zapi";
import { webhookHealthMonitor, validateWebhookData } from "../../webhookHealthCheck";
import { gamificationService } from "../../services/gamificationService";
import { dealAutomationService } from "../../services/dealAutomationService";
import { logger } from "../../utils/logger";

// Importar handlers modulares consolidados
import { registerSocialWebhookRoutes } from './handlers/social';
import { registerIntegrationRoutes, assignTeamManually } from './handlers/integration';
import { autoAssignIfNeeded } from '../../services/immediate-ai-assignment.js';
import { processZApiWebhook } from './webhooks-zapi';

/**
 * CONSOLIDADO: Usando handler específico de webhooks-zapi.ts
 * Removida duplicação da função processZApiWebhook local
 */

/**
 * Importa contatos do Z-API
 */
async function handleImportContacts(req: any, res: any) {
  try {
    logger.info('Iniciando importação de contatos Z-API');
    
    // Validar credenciais Z-API
    const credentials = validateZApiCredentials();
    if (!credentials.valid) {
      console.error('❌ Credenciais Z-API inválidas:', credentials.error);
      return res.status(400).json({ 
        error: `Configuração Z-API inválida: ${credentials.error}`,
        details: 'Verifique as variáveis de ambiente ZAPI_INSTANCE_ID, ZAPI_TOKEN e ZAPI_CLIENT_TOKEN'
      });
    }

    const { instanceId, token, clientToken } = credentials;
    console.log(`🔗 Conectando à Z-API - Instance: ${instanceId}`);
    
    const url = buildZApiUrl(instanceId, token, 'contacts');
    console.log(`📡 URL da requisição: ${url}`);
    
    const headers = getZApiHeaders(clientToken);
    console.log('📋 Headers configurados para requisição');
    
    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });

    console.log(`📊 Status da resposta Z-API: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erro na resposta Z-API: ${response.status} - ${errorText}`);
      
      let errorMessage = 'Erro na conexão com WhatsApp';
      if (response.status === 401) {
        errorMessage = 'Token de autenticação inválido ou expirado';
      } else if (response.status === 403) {
        errorMessage = 'Acesso negado. Verifique as permissões do token';
      } else if (response.status === 404) {
        errorMessage = 'Instância do WhatsApp não encontrada';
      } else if (response.status >= 500) {
        errorMessage = 'Erro interno do servidor Z-API';
      }
      
      return res.status(response.status).json({ 
        error: errorMessage,
        details: `Status: ${response.status} - ${response.statusText}`
      });
    }

    const data = await response.json();
    console.log(`📦 Dados recebidos da Z-API:`, {
      isArray: Array.isArray(data),
      length: data?.length || 0,
      type: typeof data
    });

    let importedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    if (data && Array.isArray(data)) {
      console.log(`📋 Processando ${data.length} contatos da Z-API...`);
      
      for (const contact of data) {
        try {
          if (!contact.id || !contact.phone) {
            console.log('⚠️ Contato ignorado - dados incompletos:', { id: contact.id, phone: contact.phone });
            skippedCount++;
            continue;
          }
          
          // Normalizar o telefone (remover caracteres especiais)
          const normalizedPhone = contact.phone.replace(/\D/g, '');
          
          // Verificar se o contato já existe
          const existingContact = await storage.contact.getContactByPhone(normalizedPhone);
          if (existingContact) {
            console.log(`📞 Contato já existe: ${normalizedPhone}`);
            skippedCount++;
            continue;
          }
          
          // Criar novo contato
          const contactData = {
            name: contact.pushname || contact.name || `Contato ${normalizedPhone}`,
            phone: normalizedPhone,
            channel: 'whatsapp',
            lastMessageAt: new Date(),
            isActive: true,
            tags: [],
            metadata: {
              zapiId: contact.id,
              pushname: contact.pushname,
              importedAt: new Date().toISOString()
            }
          };
          
          await storage.contact.createContact(contactData);
          console.log(`✅ Contato importado: ${contactData.name} (${normalizedPhone})`);
          importedCount++;
          
        } catch (contactError) {
          console.error(`❌ Erro ao processar contato ${contact.phone}:`, contactError);
          errorCount++;
        }
      }
    } else {
      console.log('⚠️ Nenhum contato encontrado na resposta da Z-API');
    }

    const summary = {
      success: true,
      importedCount,
      skippedCount,
      errorCount,
      totalProcessed: importedCount + skippedCount + errorCount,
      message: `Importação concluída: ${importedCount} importados, ${skippedCount} já existiam, ${errorCount} erros`
    };

    console.log('📊 Resumo da importação:', summary);
    res.json(summary);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('❌ Erro geral na importação de contatos:', error);
    
    res.status(500).json({ 
      success: false,
      error: 'Erro interno durante a importação',
      details: errorMessage
    });
  }
}

/**
 * Obtém QR Code para conexão WhatsApp
 */
async function handleGetQRCode(req: any, res: any) {
  try {
    const credentials = validateZApiCredentials();
    if (!credentials.valid) {
      return res.status(400).json({ error: credentials.error });
    }

    const { instanceId, token, clientToken } = credentials;
    const url = buildZApiUrl(instanceId, token, 'qr-code');
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getZApiHeaders(clientToken)
    });

    if (!response.ok) {
      throw new Error(`Erro na API Z-API: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.connected === true) {
      return res.json({ 
        connected: true, 
        message: 'WhatsApp já está conectado' 
      });
    }
    
    if (data.value) {
      return res.json({ 
        qrCode: data.value,
        connected: false 
      });
    }
    
    res.status(400).json({ 
      error: 'QR Code não disponível. Verifique as credenciais da Z-API.' 
    });
    
  } catch (error) {
    console.error('❌ Erro ao obter QR Code:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Erro interno do servidor' 
    });
  }
}

/**
 * Registra todas as rotas de webhooks
 */
export function registerWebhookRoutes(app: Express) {
  // Webhook principal Z-API (ambas as rotas para compatibilidade)
  const webhookHandler = async (req: any, res: any) => {
    console.log('📨 Webhook recebido:', JSON.stringify(req.body, null, 2));
    
    try {
      const result = await processZApiWebhook(req.body);
      
      if (result.success) {
        res.status(200).json({ 
          success: true, 
          message: 'Webhook processado com sucesso',
          type: result.type 
        });
      } else {
        res.status(400).json({ 
          success: false, 
          error: result.error || 'Erro no processamento do webhook' 
        });
      }
    } catch (error) {
      console.error('❌ Erro crítico no webhook:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro interno do servidor' 
      });
    }
  };

  app.post('/api/webhook', webhookHandler);
  app.post('/api/zapi/webhook', webhookHandler);

  // Importação de contatos
  app.post('/api/zapi/import-contacts', handleImportContacts);

  // QR Code para conexão
  app.get('/api/zapi/qr-code', handleGetQRCode);

  // Registrar rotas modulares
  registerSocialWebhookRoutes(app);
  registerIntegrationRoutes(app);

  console.log('✅ Sistema de webhooks consolidado registrado com sucesso');
}