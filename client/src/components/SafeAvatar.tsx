import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';

interface SafeAvatarProps {
  src?: string | null;
  alt?: string;
  fallbackText?: string;
  className?: string;
  fallbackClassName?: string;
}

/**
 * Componente Avatar com fallback automático para URLs do WhatsApp que retornam 403
 * Substitui automaticamente por avatar com iniciais quando a imagem falha ao carregar
 */
export function SafeAvatar({ 
  src, 
  alt = "Avatar", 
  fallbackText = "?", 
  className = "",
  fallbackClassName = ""
}: SafeAvatarProps) {
  const [hasError, setHasError] = useState(false);
  
  // Se já teve erro ou não tem src, usar fallback diretamente
  const shouldUseFallback = hasError || !src || src.trim() === '';
  
  const handleImageError = () => {
    setHasError(true);
    // Silenciar completamente erros de imagem do WhatsApp para evitar spam no console
    if (src?.includes('pps.whatsapp.net')) {
      // Não fazer log de erros 403/404 do WhatsApp - são esperados
      return;
    }
    console.debug('Avatar image failed to load:', src);
  };

  const handleImageLoad = () => {
    setHasError(false);
  };

  return (
    <Avatar className={className}>
      {!shouldUseFallback && (
        <AvatarImage 
          src={src} 
          alt={alt}
          onError={handleImageError}
          onLoad={handleImageLoad}
          loading="lazy"
        />
      )}
      <AvatarFallback className={`text-white font-medium ${fallbackClassName || 'bg-gray-500'}`}>
        {fallbackText.charAt(0)?.toUpperCase() || '?'}
      </AvatarFallback>
    </Avatar>
  );
}