import type { Request, Response } from "express";
import { validateZApiCredentials, buildZApiUrl, getZApiHeaders } from "../../../utils/zapi";

// Cache para o status Z-API (reduzido para 5 segundos para melhor responsividade)
let statusCache: { data: any; timestamp: number } | null = null;
const CACHE_DURATION = 5000; // 5 segundos

/**
 * Obtém status da conexão Z-API - OTIMIZADO com cache e timeout
 */
export async function handleGetStatus(req: Request, res: Response) {
  const startTime = Date.now();
  
  try {
    // Verificar cache primeiro para resposta instantânea
    const now = Date.now();
    if (statusCache && (now - statusCache.timestamp) < CACHE_DURATION) {
      const duration = Date.now() - startTime;
      console.log(`✅ Z-API status (cache) em ${duration}ms`);
      return res.json(statusCache.data);
    }

    const credentials = validateZApiCredentials();
    if (!credentials.valid) {
      return res.status(400).json({ error: credentials.error });
    }

    const { instanceId, token, clientToken } = credentials;
    const url = buildZApiUrl(instanceId, token, 'status');
    
    // Implementar timeout robusto para evitar 502
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6 segundos máximo
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: getZApiHeaders(clientToken),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Erro na API Z-API: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      
      // Atualizar cache apenas com dados válidos
      statusCache = { data, timestamp: now };
      
      const duration = Date.now() - startTime;
      console.log(`✅ Z-API status atualizado em ${duration}ms`);
      
      // Headers otimizados para cache
      res.set({
        'Cache-Control': 'public, max-age=5',
        'ETag': `"${Date.now()}"`,
        'Last-Modified': new Date().toUTCString()
      });
      
      res.json(data);
      
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      // Se foi timeout/abort, usar cache antigo se disponível
      if (fetchError.name === 'AbortError' && statusCache) {
        console.warn('⚠️ Z-API timeout, usando cache anterior');
        return res.json({
          ...statusCache.data,
          warning: 'Status pode estar desatualizado (timeout)'
        });
      }
      
      throw fetchError;
    }
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Erro ao obter status Z-API (${duration}ms):`, error);
    
    // Fallback para evitar 502 - retornar status padrão
    if (!res.headersSent) {
      res.status(200).json({ 
        connected: false,
        session: false,
        error: 'Temporariamente indisponível',
        fallback: true,
        timestamp: new Date().toISOString()
      });
    }
  }
} 