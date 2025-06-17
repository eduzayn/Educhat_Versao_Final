import { storage } from "../storage";
import { validateZApiCredentials, buildZApiUrl, getZApiHeaders } from "../../utils/zapi";

/**
 * Importa contatos do Z-API
 */
export async function handleImportContacts(req: any, res: any) {
  try {
    console.log('📇 Iniciando importação de contatos Z-API');
    
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
      console.log(`🔄 Processando ${data.length} contatos...`);
      
      for (const zapiContact of data) {
        try {
          // Validar dados básicos do contato
          if (!zapiContact.id) {
            console.warn('⚠️ Contato sem ID, pulando...', zapiContact);
            errorCount++;
            continue;
          }

          const phone = zapiContact.id.replace(/\D/g, '');
          if (!phone || phone.length < 10) {
            console.warn('⚠️ Telefone inválido, pulando...', { id: zapiContact.id, phone });
            errorCount++;
            continue;
          }

          // Verificar se já existe
          const existingContact = await storage.getContact(phone);
          if (existingContact) {
            skippedCount++;
            continue;
          }

          // Criar novo contato
          const contactData = {
            phone: phone,
            name: zapiContact.name || zapiContact.pushname || `WhatsApp ${phone}`,
            profileImageUrl: zapiContact.profilePicUrl || null,
            source: 'zapi_import'
          };

          await storage.createContact(contactData);
          console.log(`✅ Contato importado: ${contactData.name} (${phone})`);
          importedCount++;
          
        } catch (contactError) {
          console.error('❌ Erro ao processar contato individual:', {
            contact: zapiContact,
            error: contactError instanceof Error ? contactError.message : contactError
          });
          errorCount++;
        }
      }
    } else {
      console.error('❌ Formato de dados inválido da Z-API:', typeof data);
      return res.status(500).json({ 
        error: 'Formato de resposta inválido da Z-API',
        details: `Esperado: array, Recebido: ${typeof data}`
      });
    }

    const summary = {
      success: true,
      imported: importedCount,
      skipped: skippedCount,
      errors: errorCount,
      total: data?.length || 0
    };

    console.log(`✅ Importação concluída:`, summary);
    res.json(summary);
    
  } catch (error) {
    console.error('❌ Erro crítico na importação de contatos:', {
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error
    });
    
    let errorMessage = 'Erro interno do servidor';
    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        errorMessage = 'Erro de conexão com a Z-API. Verifique a conectividade';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Timeout na conexão com Z-API. Tente novamente';
      } else {
        errorMessage = error.message;
      }
    }
    
    res.status(500).json({ 
      error: errorMessage,
      details: 'Verifique os logs do servidor para mais informações'
    });
  }
} 