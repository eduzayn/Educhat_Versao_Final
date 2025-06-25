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
  };

  return (
    <Avatar className={className}>
      {!shouldUseFallback && (
        <AvatarImage 
          src={src} 
          alt={alt}
          onError={handleImageError}
          onLoad={() => setHasError(false)}
        />
      )}
      <AvatarFallback className={`text-white font-medium ${fallbackClassName}`}>
        {fallbackText.charAt(0)?.toUpperCase() || '?'}
      </AvatarFallback>
    </Avatar>
  );
}