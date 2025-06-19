/**
 * Proxy para URLs de mídia do WhatsApp
 * Trata problemas de CORS e permissões de acesso
 */

import type { Express, Request, Response } from "express";
import axios from "axios";

export function registerMediaProxyRoutes(app: Express) {
  
  // Proxy para URLs de mídia do WhatsApp
  app.get('/api/media-proxy', async (req: Request, res: Response) => {
    try {
      const { url } = req.query;
      
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'URL é obrigatória' });
      }
      
      // Verificar se é uma URL válida do WhatsApp
      if (!url.includes('whatsapp.net') && !url.includes('wa.me')) {
        return res.status(400).json({ error: 'URL deve ser do WhatsApp' });
      }
      
      console.log('🖼️ Tentando acessar mídia via proxy:', url);
      
      // Fazer requisição com headers apropriados
      const response = await axios.get(url, {
        responseType: 'stream',
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'image/*,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        validateStatus: (status) => {
          return status < 500; // Aceitar códigos até 499
        }
      });
      
      if (response.status === 403) {
        console.warn('⚠️ Acesso negado para mídia:', url);
        return res.status(404).json({ 
          error: 'Mídia não disponível',
          reason: 'expired_or_restricted'
        });
      }
      
      if (response.status !== 200) {
        console.warn('⚠️ Erro ao acessar mídia:', response.status, url);
        return res.status(404).json({ 
          error: 'Mídia não encontrada',
          status: response.status
        });
      }
      
      // Definir headers de resposta
      const contentType = response.headers['content-type'] || 'application/octet-stream';
      const contentLength = response.headers['content-length'];
      
      res.set({
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600', // Cache por 1 hora
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      
      if (contentLength) {
        res.set('Content-Length', contentLength);
      }
      
      // Pipe da resposta
      response.data.pipe(res);
      
      console.log('✅ Mídia servida via proxy:', url);
      
    } catch (error: any) {
      console.error('❌ Erro no proxy de mídia:', error.message);
      
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        return res.status(404).json({ 
          error: 'Mídia não encontrada',
          reason: 'network_error'
        });
      }
      
      if (error.response?.status === 403) {
        return res.status(404).json({ 
          error: 'Mídia não disponível',
          reason: 'access_denied'
        });
      }
      
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        reason: 'proxy_error'
      });
    }
  });
  
  // Endpoint para verificar se uma URL de mídia está acessível
  app.post('/api/media/check', async (req: Request, res: Response) => {
    try {
      const { url } = req.body;
      
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'URL é obrigatória' });
      }
      
      console.log('🔍 Verificando disponibilidade de mídia:', url);
      
      const response = await axios.head(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': '*/*'
        },
        validateStatus: () => true // Aceitar qualquer status
      });
      
      const isAvailable = response.status === 200;
      const contentType = response.headers['content-type'] || '';
      const contentLength = response.headers['content-length'] || 0;
      
      res.json({
        available: isAvailable,
        status: response.status,
        contentType,
        contentLength: parseInt(contentLength.toString()) || 0,
        useProxy: response.status === 403 || response.status === 401
      });
      
    } catch (error: any) {
      console.error('❌ Erro ao verificar mídia:', error.message);
      
      res.json({
        available: false,
        status: 0,
        error: error.message,
        useProxy: true
      });
    }
  });
}