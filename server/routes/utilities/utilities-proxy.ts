import { Express, Response } from 'express';

// Cache para URLs expiradas (evita tentativas desnecessárias)
const expiredUrlsCache = new Map<string, number>();
const EXPIRED_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas

// Cache para imagens válidas (curto prazo)
const validImageCache = new Map<string, { data: Buffer; contentType: string; timestamp: number }>();
const VALID_CACHE_TTL = 5 * 60 * 1000; // 5 minutos

function isUrlExpired(url: string): boolean {
  const cached = expiredUrlsCache.get(url);
  if (!cached) return false;
  
  // Se passou do TTL, remover do cache
  if (Date.now() - cached > EXPIRED_CACHE_TTL) {
    expiredUrlsCache.delete(url);
    return false;
  }
  
  return true;
}

function markUrlAsExpired(url: string): void {
  expiredUrlsCache.set(url, Date.now());
}

function getCachedImage(url: string): { data: Buffer; contentType: string } | null {
  const cached = validImageCache.get(url);
  if (!cached) return null;
  
  // Se passou do TTL, remover do cache
  if (Date.now() - cached.timestamp > VALID_CACHE_TTL) {
    validImageCache.delete(url);
    return null;
  }
  
  return { data: cached.data, contentType: cached.contentType };
}

function cacheValidImage(url: string, data: Buffer, contentType: string): void {
  validImageCache.set(url, { data, contentType, timestamp: Date.now() });
}

function createExpiredPlaceholder(): string {
  return `<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#f8fafc;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#f1f5f9;stop-opacity:1" />
      </linearGradient>
      <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
        <circle cx="10" cy="10" r="1" fill="#e2e8f0" opacity="0.5"/>
      </pattern>
    </defs>
    <rect width="300" height="200" fill="url(#bgGrad)" stroke="#e2e8f0" stroke-width="1" rx="8"/>
    <rect width="300" height="200" fill="url(#dots)" opacity="0.3"/>
    <g transform="translate(150, 70)">
      <circle r="25" fill="#cbd5e1" opacity="0.7"/>
      <g transform="translate(-12, -8)">
        <rect x="0" y="0" width="24" height="16" fill="none" stroke="#64748b" stroke-width="2" rx="2"/>
        <circle cx="8" cy="6" r="3" fill="none" stroke="#64748b" stroke-width="1.5"/>
        <polyline points="2,12 8,8 14,12 22,6" fill="none" stroke="#64748b" stroke-width="1.5"/>
      </g>
    </g>
    <text x="150" y="130" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="500" fill="#64748b">
      Imagem não disponível
    </text>
    <text x="150" y="150" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#94a3b8">
      URL do WhatsApp expirou
    </text>
    <text x="150" y="170" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="10" fill="#cbd5e1">
      As imagens do WhatsApp expiram após alguns dias
    </text>
  </svg>`;
}

export function registerProxyRoutes(app: Express) {
  // Sistema robusto de proxy para imagens WhatsApp - REST: GET /api/proxy/whatsapp-image
  app.get('/api/proxy/whatsapp-image', async (req, res) => {
    try {
      const { url } = req.query;
      
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'URL é obrigatória' });
      }

      // Verificar se é uma URL válida do WhatsApp
      if (!url.includes('pps.whatsapp.net') && !url.includes('mmg.whatsapp.net') && !url.includes('media.whatsapp.net')) {
        return res.status(400).json({ error: 'URL não é do WhatsApp' });
      }

      // Verificar cache de URLs expiradas primeiro
      if (isUrlExpired(url)) {
        console.log('⚡ URL já conhecida como expirada - retornando placeholder imediatamente');
        const placeholderSvg = createExpiredPlaceholder();
        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.send(placeholderSvg);
      }

      // Verificar cache de imagens válidas
      const cachedImage = getCachedImage(url);
      if (cachedImage) {
        console.log('⚡ Imagem encontrada no cache - retornando imediatamente');
        res.setHeader('Content-Type', cachedImage.contentType);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        return res.send(cachedImage.data);
      }

      console.log('🖼️ Tentando carregar imagem WhatsApp:', url.substring(0, 100) + '...');

      // Estratégias de requisição com diferentes User-Agents e headers
      const strategies = [
        {
          name: 'WhatsApp Web',
          headers: {
            'User-Agent': 'WhatsApp/2.23.24.76 A',
            'Accept': 'image/webp,image/apng,image/jpeg,image/png,image/*,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Referer': 'https://web.whatsapp.com/',
            'Origin': 'https://web.whatsapp.com',
            'Sec-Fetch-Dest': 'image',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'cross-site',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          },
          timeout: 8000
        },
        {
          name: 'Chrome Desktop',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
            'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Pragma': 'no-cache'
          },
          timeout: 10000
        },
        {
          name: 'Safari Mobile',
          headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
            'Accept': 'image/png,image/svg+xml,image/*;q=0.8,video/*;q=0.8,*/*;q=0.5',
            'Accept-Language': 'pt-BR,pt;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive'
          },
          timeout: 12000
        }
      ];

      let lastError: Error | null = null;

      // Tentar cada estratégia
      for (const strategy of strategies) {
        try {
          console.log(`🔄 Tentando estratégia: ${strategy.name}`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), strategy.timeout);

          const response = await fetch(url, {
            method: 'GET',
            headers: strategy.headers as any,
            signal: controller.signal,
            redirect: 'follow'
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            console.log(`✅ Sucesso com estratégia: ${strategy.name}`);
            
            const contentType = response.headers.get('content-type') || 'image/jpeg';
            const contentLength = response.headers.get('content-length');
            
            res.setHeader('Content-Type', contentType);
            res.setHeader('Cache-Control', 'public, max-age=86400');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
            
            if (contentLength) {
              res.setHeader('Content-Length', contentLength);
            }

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            
            // Cache da imagem válida
            cacheValidImage(url, buffer, contentType);
            
            return res.send(buffer);
          }

          // URL expirou (404, 403, 410)
          if (response.status === 404 || response.status === 403 || response.status === 410) {
            console.log(`⚠️ URL WhatsApp expirada (${response.status}) com ${strategy.name} - parando tentativas`);
            // Marcar URL como expirada e parar tentativas imediatamente
            markUrlAsExpired(url);
            
            // Retornar placeholder imediatamente sem tentar outras estratégias
            const placeholderSvg = createExpiredPlaceholder();
            res.setHeader('Content-Type', 'image/svg+xml');
            res.setHeader('Cache-Control', 'public, max-age=3600');
            res.setHeader('Access-Control-Allow-Origin', '*');
            return res.send(placeholderSvg);
          }

          console.log(`⚠️ Falha ${response.status} com ${strategy.name}`);
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);

        } catch (error) {
          lastError = error as Error;
          console.log(`❌ Estratégia ${strategy.name} falhou: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
          continue;
        }
      }

      // Todas as estratégias falharam - URL definitivamente expirada
      console.log('⚠️ Todas as tentativas falharam - URL WhatsApp expirada, retornando placeholder');
      
      // Garantir que a URL seja marcada como expirada
      markUrlAsExpired(url);
      
      const placeholderSvg = createExpiredPlaceholder();
      
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.send(placeholderSvg);

    } catch (error) {
      console.error('❌ Erro crítico no proxy WhatsApp:', error);
      
      // Placeholder para erro de sistema
      const errorSvg = `<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200">
        <rect width="300" height="200" fill="#fef2f2" stroke="#fecaca" stroke-width="1" rx="8"/>
        <g transform="translate(150, 70)">
          <circle r="25" fill="#f87171"/>
          <g transform="translate(-8, -8)" stroke="#dc2626" stroke-width="3" fill="none">
            <line x1="0" y1="0" x2="16" y2="16"/>
            <line x1="16" y1="0" x2="0" y2="16"/>
          </g>
        </g>
        <text x="150" y="130" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="500" fill="#dc2626">
          Erro ao carregar imagem
        </text>
        <text x="150" y="150" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#ef4444">
          Falha no sistema de proxy
        </text>
      </svg>`;
      
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.send(errorSvg);
    }
  });

  // Endpoint de proxy genérico para mídia - REST: GET /api/proxy/media
  app.get('/api/proxy/media', async (req, res) => {
    try {
      const { url } = req.query;
      
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'URL é obrigatória' });
      }

      // Fazer requisição para a URL original
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'image/*,*/*',
          'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      const buffer = await response.arrayBuffer();

      // Configurar headers de resposta
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Length', buffer.byteLength);

      res.send(Buffer.from(buffer));

    } catch (error) {
      console.error('❌ Erro no proxy de mídia:', error);
      res.status(500).json({ 
        error: 'Falha ao carregar mídia',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  });
} 