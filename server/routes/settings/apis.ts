import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAuth } from '../conversations/middleware';
import { db } from '../../db';
import { systemSettings } from '../../../shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// Schema para validação das configurações de API
const apiConfigSchema = z.object({
  sendgridApiKey: z.string().optional().default(''),
  isActive: z.boolean().optional().default(false)
});

// Schema para teste do SendGrid
const sendgridTestSchema = z.object({
  apiKey: z.string().min(1, 'Chave da API é obrigatória')
});

// Buscar configurações de APIs
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const settings = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.category, 'api_keys'));

    const config = {
      sendgridApiKey: '',
      isActive: false
    };

    settings.forEach(setting => {
      if (setting.key === 'sendgrid_api_key') {
        config.sendgridApiKey = setting.value || '';
      }
      if (setting.key === 'sendgrid_active') {
        config.isActive = setting.value === 'true';
      }
    });

    res.json(config);
  } catch (error) {
    console.error('Erro ao buscar configurações de APIs:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Salvar configurações de APIs
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const validatedData = apiConfigSchema.parse(req.body);
    
    // Salvar/atualizar SendGrid API Key
    if (validatedData.sendgridApiKey) {
      await db
        .insert(systemSettings)
        .values({
          key: 'sendgrid_api_key',
          value: validatedData.sendgridApiKey,
          type: 'string',
          description: 'Chave da API do SendGrid para envio de emails',
          category: 'api_keys'
        })
        .onConflictDoUpdate({
          target: systemSettings.key,
          set: {
            value: validatedData.sendgridApiKey,
            updatedAt: new Date()
          }
        });

      // Atualizar status ativo
      await db
        .insert(systemSettings)
        .values({
          key: 'sendgrid_active',
          value: validatedData.isActive ? 'true' : 'false',
          type: 'boolean',
          description: 'Status ativo da integração SendGrid',
          category: 'api_keys'
        })
        .onConflictDoUpdate({
          target: systemSettings.key,
          set: {
            value: validatedData.isActive ? 'true' : 'false',
            updatedAt: new Date()
          }
        });

      // Atualizar variável de ambiente em tempo de execução
      process.env.SENDGRID_API_KEY = validatedData.sendgridApiKey;
    }

    console.log('📧 Configurações de APIs salvas com sucesso');
    res.json({ 
      success: true, 
      message: 'Configurações salvas com sucesso' 
    });

  } catch (error) {
    console.error('Erro ao salvar configurações de APIs:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        message: 'Dados inválidos', 
        errors: error.errors 
      });
    } else {
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }
});

// Testar conexão com SendGrid
router.post('/test-sendgrid', requireAuth, async (req: Request, res: Response) => {
  try {
    const { apiKey } = sendgridTestSchema.parse(req.body);
    
    // Testar a API key do SendGrid
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(apiKey);

    // Fazer uma chamada simples para validar a API key
    // Usamos um endpoint que não envia email mas valida a autenticação
    try {
      await sgMail.send({
        to: 'test@example.com',
        from: 'test@example.com',
        subject: 'Test',
        text: 'Test',
        mailSettings: {
          sandboxMode: {
            enable: true
          }
        }
      });

      console.log('✅ Teste do SendGrid bem-sucedido');
      res.json({
        success: true,
        message: 'Conexão com SendGrid estabelecida com sucesso'
      });
    } catch (sendgridError: any) {
      console.error('❌ Erro no teste do SendGrid:', sendgridError.message);
      
      // Verificar se é erro de autenticação
      if (sendgridError.code === 401) {
        res.json({
          success: false,
          message: 'Chave da API inválida'
        });
      } else {
        res.json({
          success: false,
          message: 'Erro na conexão com SendGrid: ' + sendgridError.message
        });
      }
    }

  } catch (error) {
    console.error('Erro ao testar SendGrid:', error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        success: false,
        message: 'Dados inválidos', 
        errors: error.errors 
      });
    } else {
      res.status(500).json({ 
        success: false,
        message: 'Erro interno do servidor' 
      });
    }
  }
});

export default router;