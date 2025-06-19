/**
 * Componente para exibir mídia do WhatsApp com fallback automático para proxy
 * Trata erros 403 e URLs expiradas automaticamente
 */

import { useState, useEffect } from 'react';
import { ImageIcon, AlertCircle } from 'lucide-react';

interface MediaViewerProps {
  src: string;
  alt?: string;
  className?: string;
  fallbackText?: string;
}

export function MediaViewer({ src, alt, className = '', fallbackText = 'Mídia não disponível' }: MediaViewerProps) {
  const [imageSrc, setImageSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [useProxy, setUseProxy] = useState(false);

  // Reset states when src changes
  useEffect(() => {
    setImageSrc(src);
    setHasError(false);
    setIsLoading(true);
    setUseProxy(false);
  }, [src]);

  const handleImageError = async () => {
    if (useProxy) {
      // Se já está usando proxy e ainda falhou, mostrar fallback
      setHasError(true);
      setIsLoading(false);
      return;
    }

    // Tentar usar o proxy
    if (src.includes('whatsapp.net') || src.includes('wa.me')) {
      console.log('🖼️ Erro ao carregar mídia diretamente, tentando via proxy:', src);
      
      const proxyUrl = `/api/media-proxy?url=${encodeURIComponent(src)}`;
      setImageSrc(proxyUrl);
      setUseProxy(true);
      setIsLoading(true);
    } else {
      setHasError(true);
      setIsLoading(false);
    }
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  if (hasError) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg p-4 ${className}`}>
        <AlertCircle className="h-8 w-8 text-gray-400 mb-2" />
        <span className="text-sm text-gray-500 text-center">
          {fallbackText}
        </span>
        {useProxy && (
          <span className="text-xs text-gray-400 mt-1">
            (URL expirada)
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
          <ImageIcon className="h-8 w-8 text-gray-400 animate-pulse" />
        </div>
      )}
      <img
        src={imageSrc}
        alt={alt || 'Mídia do WhatsApp'}
        onError={handleImageError}
        onLoad={handleImageLoad}
        className={`${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200 max-w-full h-auto rounded-lg`}
        loading="lazy"
      />
      {useProxy && !hasError && (
        <div className="absolute top-2 right-2">
          <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full opacity-75">
            Via Proxy
          </div>
        </div>
      )}
    </div>
  );
}