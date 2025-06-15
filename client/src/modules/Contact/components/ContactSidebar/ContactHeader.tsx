import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Badge } from '@/shared/ui/badge';
import { useMediaUrl } from '@/shared/lib/utils/whatsappProxy';

interface ContactHeaderProps {
  contact: {
    name: string;
    profileImageUrl?: string;
    isOnline?: boolean;
  };
}

export function ContactHeader({ contact }: ContactHeaderProps) {
  const proxiedProfileImageUrl = useMediaUrl(contact.profileImageUrl);

  return (
    <div className="text-center">
      <Avatar className="w-16 h-16 mx-auto mb-3">
        <AvatarImage src={proxiedProfileImageUrl || ''} />
        <AvatarFallback className="text-lg font-semibold">
          {contact.name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <h3 className="font-semibold text-lg text-gray-900 mb-1">
        {contact.name}
      </h3>
      
      <div className="flex items-center justify-center space-x-2">
        <Badge 
          variant={contact.isOnline ? "default" : "secondary"}
          className="text-xs"
        >
          {contact.isOnline ? 'Online' : 'Offline'}
        </Badge>
      </div>
    </div>
  );
}