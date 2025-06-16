import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { User } from 'lucide-react';
import { useSafeAvatarUrl, getAvatarInitials } from '@/shared/lib/utils/avatarUtils';

interface ContactAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ContactAvatar({ src, name, size = 'md', className }: ContactAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const safeAvatarUrl = useSafeAvatarUrl(src);
  
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  };

  const shouldShowImage = safeAvatarUrl && !imageError;

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      {shouldShowImage && (
        <AvatarImage
          src={safeAvatarUrl || undefined}
          alt={name || 'Avatar'}
          onError={() => setImageError(true)}
        />
      )}
      <AvatarFallback className="bg-primary/10 text-primary">
        {getAvatarInitials(name) || <User className="h-4 w-4" />}
      </AvatarFallback>
    </Avatar>
  );
}