import type { Express } from "express";
import { storage } from "../../storage/index";

/**
 * Rota para streaming progressivo de áudios - Padrão Chatwoot
 * Permite carregar áudios em partes para melhor performance
 */
export function registerAudioStreamingRoutes(app: Express) {
  
  // Streaming de áudio com suporte a Range requests
  app.get('/api/messages/:id/audio', async (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      const message = await storage.getMessage(messageId);
      
      if (!message || message.messageType !== 'audio') {
        return res.status(404).json({ error: 'Mensagem de áudio não encontrada' });
      }

      // Buscar arquivo de mídia
      const mediaFile = await storage.getMediaFile(messageId);
      if (!mediaFile) {
        return res.status(404).json({ error: 'Arquivo de áudio não encontrado' });
      }

      // Decodificar base64 para buffer
      const audioBuffer = Buffer.from(mediaFile.fileData, 'base64');
      const audioSize = audioBuffer.length;

      // Configurar headers para streaming
      res.set({
        'Content-Type': mediaFile.mimeType || 'audio/webm',
        'Content-Length': audioSize.toString(),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=31536000', // Cache por 1 ano
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Range, Content-Range, Content-Length'
      });

      // Suporte a Range requests para streaming progressivo
      const range = req.headers.range;
      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : audioSize - 1;
        const chunksize = (end - start) + 1;
        
        const chunk = audioBuffer.slice(start, end + 1);
        
        res.status(206).set({
          'Content-Range': `bytes ${start}-${end}/${audioSize}`,
          'Content-Length': chunksize.toString()
        });
        
        res.end(chunk);
      } else {
        // Enviar áudio completo
        res.end(audioBuffer);
      }
      
    } catch (error) {
      console.error('Erro ao servir áudio:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });

  // Endpoint para metadados de áudio
  app.get('/api/messages/:id/audio/metadata', async (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      const message = await storage.getMessage(messageId);
      
      if (!message || message.messageType !== 'audio') {
        return res.status(404).json({ error: 'Mensagem de áudio não encontrada' });
      }

      const mediaFile = await storage.getMediaFile(messageId);
      if (!mediaFile) {
        return res.status(404).json({ error: 'Arquivo de áudio não encontrado' });
      }

      res.json({
        messageId,
        mimeType: mediaFile.mimeType,
        fileSize: mediaFile.fileSize,
        duration: mediaFile.duration,
        fileName: mediaFile.fileName,
        isCompressed: mediaFile.isCompressed,
        compressionQuality: mediaFile.compressionQuality
      });
      
    } catch (error) {
      console.error('Erro ao obter metadados do áudio:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
}