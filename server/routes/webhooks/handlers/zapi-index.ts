import type { Express } from "express";
import { handleSendImage, handleSendAudio, handleSendVideo, handleSendDocument, uploadImage, uploadAudio, uploadVideo, uploadDocument } from "./zapi-media";
import { handleSendLink } from "./zapi-link";
import { handleGetStatus } from "./zapi-status";

/**
 * Registra rotas Z-API consolidadas - mídia, links e status
 */
export function registerZApiRoutes(app: Express) {
  // Rotas de mídia
  app.post('/api/zapi/send-image', uploadImage.single('image'), handleSendImage);
  app.post('/api/zapi/send-audio', uploadAudio.single('audio'), handleSendAudio);
  app.post('/api/zapi/send-video', uploadVideo.single('video'), handleSendVideo);
  app.post('/api/zapi/send-document', uploadDocument.single('document'), handleSendDocument);
  
  // Rota de links
  app.post('/api/zapi/send-link', handleSendLink);
  
  // Rota de status
  app.get('/api/zapi/status', handleGetStatus);
} 