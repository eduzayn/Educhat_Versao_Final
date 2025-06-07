import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { registerInternalChatRoutes } from "./internal-chat-routes";
import { registerMediaRoutes } from "./media-routes";
import { ZApiModule } from "./zapi-module";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
import fs from "fs";
import cors from "cors";

// Garantir que o diretório de uploads exista
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`Diretório de uploads criado: ${uploadsDir}`);
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configuração de CORS adequada para produção
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://educhat.com.br', 
        'https://www.educhat.com.br', 
        ...(process.env.RENDER_EXTERNAL_URL ? [process.env.RENDER_EXTERNAL_URL] : [])
      ] 
    : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Health check endpoint is handled in routes.ts

// Servir arquivos estáticos de upload
app.use('/uploads', express.static('uploads'));

// Registrar webhook Z-API ANTES dos middlewares de autenticação
app.post('/api/zapi/webhook', async (req, res) => {
  try {
    console.log('📨 Webhook Z-API recebido:', req.body);
    
    const webhookData = req.body;
    
    // Processar apenas mensagens recebidas
    if (webhookData.type === 'ReceivedCallback' && !webhookData.fromMe) {
      await processWebhookMessage(webhookData);
    }
    
    res.json({ success: true, type: webhookData.type || 'unknown' });
  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

async function processWebhookMessage(data: any) {
  try {
    // Verificar se storage está disponível
    const storage = (global as any).storage;
    if (!storage) {
      console.log('⏳ Storage não disponível ainda, webhook será processado depois');
      return;
    }
    
    const phone = data.phone;
    const messageContent = data.text?.message || '';
    const hasMedia = !!(data.image || data.audio || data.video || data.document);
    
    if (!phone || (!messageContent && !hasMedia)) {
      console.log('❌ Dados incompletos no webhook');
      return;
    }
    
    // Buscar ou criar contato
    let contact = await storage.getContactByPhone(phone);
    if (!contact) {
      contact = await storage.createContact({
        name: data.chatName || phone,
        phone: phone,
        channel: 'whatsapp'
      });
    }
    
    // Buscar ou criar conversa
    let conversation = await storage.getConversationByContactId(contact.id);
    if (!conversation) {
      conversation = await storage.createConversation({
        contactId: contact.id,
        status: 'active'
      });
    }
    
    // Determinar conteúdo da mensagem
    let content = messageContent;
    let messageType = 'text';
    
    if (hasMedia) {
      if (data.image) {
        messageType = 'image';
        content = data.image.caption || 'Imagem';
      } else if (data.audio) {
        messageType = 'audio';
        content = 'Áudio';
      } else if (data.video) {
        messageType = 'video';
        content = data.video.caption || 'Vídeo';
      } else if (data.document) {
        messageType = 'document';
        content = data.document.filename || 'Documento';
      }
    }
    
    // Criar mensagem
    await storage.createMessage({
      conversationId: conversation.id,
      content: content,
      isFromContact: true,
      type: messageType,
      externalMessageId: data.messageId
    });
    
    console.log('✅ Mensagem processada com sucesso:', {
      contact: contact.name,
      conversation: conversation.id,
      content: content.substring(0, 50)
    });
    
  } catch (error) {
    console.error('❌ Erro ao processar mensagem do webhook:', error);
  }
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);
  registerInternalChatRoutes(app);
  registerMediaRoutes(app);



  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Error:", err);
    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use PORT environment variable for production (Railway) or default to 5000 for development
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
