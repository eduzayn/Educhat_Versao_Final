import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { User } from 'lucide-react';
import { useSafeAvatarUrl, getAvatarInitials } from '@/shared/lib/utils/avatarUtils';
import { useQuery } from '@tanstack/react-query';

interface ContactAvatarProps {
  src?: string | null;
  name?: string | null;
  contactId?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ContactAvatar({ src, name, contactId, size = 'md', className }: ContactAvatarProps) {
  const [imageError, setImageError] = useState(false);
  
  // Usar cache de avatar se contactId estiver disponível
  const { data: avatarData } = useQuery({
    queryKey: ['contact-avatar', contactId],
    queryFn: async () => {
      if (!contactId) return null;
      const response = await fetch(`/api/contacts/${contactId}/avatar`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!contactId,
    staleTime: 24 * 60 * 60 * 1000, // 24 horas
    gcTime: 24 * 60 * 60 * 1000,
  });

  // Determinar URL do avatar com prioridade para cache
  const avatarUrl = avatarData?.avatarUrl || src;
  const safeAvatarUrl = useSafeAvatarUrl(avatarUrl);
  
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  };

  // Resetar estado de erro quando a URL mudar
  useEffect(() => {
    setImageError(false);
  }, [safeAvatarUrl]);

  // Log para debug (apenas em desenvolvimento)
  useEffect(() => {
    if (avatarData && process.env.NODE_ENV === 'development') {
      console.log(`Avatar cache para ${name}:`, {
        source: avatarData.source,
        cached: avatarData.cached,
        hasUrl: !!avatarData.avatarUrl
      });
    }
  }, [avatarData, name]);

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      {safeAvatarUrl && !imageError && (
        <AvatarImage
          src={safeAvatarUrl}
          alt={name || 'Avatar'}
          onError={() => {
            console.warn(`Falha ao carregar avatar para ${name || 'contato'}`);
            setImageError(true);
          }}
        />
      )}
      <AvatarFallback className="bg-primary/10 text-primary">
        {getAvatarInitials(name) || <User className="h-4 w-4" />}
      </AvatarFallback>
    </Avatar>
  );
}