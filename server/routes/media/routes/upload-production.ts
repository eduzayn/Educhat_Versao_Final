import { Router } from 'express';
import multer from 'multer';
import { db } from '../../../db';
import { messages, mediaFiles, conversations, contacts, type InsertMediaFile } from '../../../../shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// Configuração do multer para armazenar em memória
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB máximo
  }
});

/**
 * Rota de upload de mídia para produção
 * Armazena arquivos diretamente no banco de dados PostgreSQL
 */
router.post('/upload-production', upload.single('file'), async (req, res) => {
  try {
    const { conversationId } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    if (!conversationId) {
      return res.status(400).json({ error: 'ID da conversa é obrigatório' });
    }

    console.log(`🚀 [UPLOAD-PROD] Processando arquivo: ${file.originalname} (${file.size} bytes)`);

    // Determinar tipo de mídia baseado no MIME type
    let mediaType = 'document';
    if (file.mimetype.startsWith('image/')) {
      mediaType = 'image';
    } else if (file.mimetype.startsWith('video/')) {
      mediaType = 'video';
    } else if (file.mimetype.startsWith('audio/')) {
      mediaType = 'audio';
    }

    // Converter arquivo para base64
    const fileBase64 = file.buffer.toString('base64');
    const dataUrl = `data:${file.mimetype};base64,${fileBase64}`;

    // Criar mensagem no banco
    const [newMessage] = await db.insert(messages).values({
      conversationId: parseInt(conversationId),
      content: `${getMediaEmoji(mediaType)} ${file.originalname}`,
      isFromContact: false,
      messageType: mediaType,
      metadata: {
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        mediaType: mediaType,
        sentViaZapi: false,
        productionStorage: true // indica que usa armazenamento de produção
      }
    }).returning();

    if (!newMessage) {
      return res.status(500).json({ error: 'Erro ao criar mensagem' });
    }

    // Armazenar arquivo no banco de dados
    const [savedMediaFile] = await db.insert(mediaFiles).values({
      messageId: newMessage.id,
      fileName: generateUniqueFileName(file.originalname),
      originalName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      fileData: fileBase64, // apenas base64, sem data URL prefix
      mediaType: mediaType,
      isCompressed: false,
      zapiSent: false
    }).returning();

    if (!savedMediaFile) {
      // Limpar mensagem se falhar ao salvar mídia
      await db.delete(messages).where(eq(messages.id, newMessage.id));
      return res.status(500).json({ error: 'Erro ao salvar arquivo de mídia' });
    }

    console.log(`✅ [UPLOAD-PROD] Arquivo salvo no banco: ID ${savedMediaFile.id}`);

    // Buscar dados da conversa para envio via Z-API
    const [conversation] = await db
      .select({
        id: conversations.id,
        contactId: conversations.contactId,
        phone: contacts.phone,
        contactName: contacts.name
      })
      .from(conversations)
      .innerJoin(contacts, eq(conversations.contactId, contacts.id))
      .where(eq(conversations.id, parseInt(conversationId)));

    if (conversation?.phone) {
      console.log(`📤 [UPLOAD-PROD] Enviando via Z-API para ${conversation.phone}`);
      
      try {
        // Implementar envio Z-API futuramente
        console.log(`📤 [UPLOAD-PROD] Z-API integration pending for ${conversation.phone}`);
      } catch (zapiError) {
        console.error(`❌ [UPLOAD-PROD] Erro no envio Z-API:`, zapiError);
      }
    }

    // Retornar resposta de sucesso
    res.json({
      success: true,
      message: newMessage,
      mediaFile: {
        id: savedMediaFile.id,
        fileName: savedMediaFile.fileName,
        originalName: savedMediaFile.originalName,
        fileSize: savedMediaFile.fileSize,
        mimeType: savedMediaFile.mimeType,
        mediaType: savedMediaFile.mediaType
      },
      url: `/api/media/serve/${savedMediaFile.id}` // URL para servir o arquivo
    });

  } catch (error) {
    console.error('❌ [UPLOAD-PROD] Erro no upload:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
});

/**
 * Rota para servir arquivos de mídia do banco de dados
 */
router.get('/serve/:mediaId', async (req, res) => {
  try {
    const { mediaId } = req.params;

    const [mediaFile] = await db
      .select()
      .from(mediaFiles)
      .where(eq(mediaFiles.id, parseInt(mediaId)));

    if (!mediaFile) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    // Converter base64 de volta para buffer
    const buffer = Buffer.from(mediaFile.fileData, 'base64');

    // Definir headers apropriados
    res.set({
      'Content-Type': mediaFile.mimeType,
      'Content-Length': buffer.length.toString(),
      'Content-Disposition': `inline; filename="${mediaFile.originalName}"`,
      'Cache-Control': 'public, max-age=31536000', // Cache por 1 ano
      'ETag': `"${mediaFile.id}-${mediaFile.updatedAt?.getTime()}"`
    });

    res.send(buffer);

  } catch (error) {
    console.error('❌ [SERVE] Erro ao servir mídia:', error);
    res.status(500).json({ error: 'Erro ao carregar arquivo' });
  }
});

// Funções auxiliares
function getMediaEmoji(mediaType: string): string {
  switch (mediaType) {
    case 'image': return '🖼️';
    case 'video': return '🎥';
    case 'audio': return '🎵';
    case 'document': return '📄';
    default: return '📎';
  }
}

function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000);
  const extension = originalName.split('.').pop() || 'bin';
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
  return `${timestamp}-${random}-${nameWithoutExt}.${extension}`;
}

export default router;