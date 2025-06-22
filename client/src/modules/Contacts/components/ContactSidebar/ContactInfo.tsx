import { Phone, Mail, MapPin, Calendar, Hash } from 'lucide-react';
import { DuplicateContactAlert } from '@/shared/components/DuplicateContactAlert';

interface ContactInfoProps {
  contact: {
    id?: number;
    phone?: string;
    email?: string;
    address?: string;
    createdAt: string;
  };
  channelInfo?: {
    id: number;
    name: string;
    type: string;
  };
}

export function ContactInfo({ contact, channelInfo }: ContactInfoProps) {
  const getChannelIcon = (channelName: string) => {
    if (channelName.toLowerCase().includes('comercial')) {
      return '🟢';
    } else if (channelName.toLowerCase().includes('suporte')) {
      return '🟡';
    } else {
      return '🔵';
    }
  };

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm text-gray-900">Contato</h4>
      
      {/* Canal de origem */}
      {channelInfo && (
        <div className="flex items-center space-x-3 text-sm bg-blue-50 p-2 rounded border">
          <Hash className="w-4 h-4 text-blue-600" />
          <span className="text-gray-700 font-medium">
            <span className="mr-1">{getChannelIcon(channelInfo.name)}</span>
            Canal de origem: {channelInfo.name}
          </span>
        </div>
      )}
      
      {contact.phone && (
        <div className="space-y-2">
          <div className="flex items-center space-x-3 text-sm">
            <Phone className="w-4 h-4 text-gray-400" />
            <span className="text-gray-700">{contact.phone}</span>
          </div>
          {/* Alerta de contato duplicado */}
          <DuplicateContactAlert 
            phone={contact.phone}
            contactId={contact.id}
            mode="card"
            className="ml-7"
          />
        </div>
      )}
      
      {contact.email && (
        <div className="flex items-center space-x-3 text-sm">
          <Mail className="w-4 h-4 text-gray-400" />
          <span className="text-gray-700">{contact.email}</span>
        </div>
      )}
      
      {contact.address && (
        <div className="flex items-center space-x-3 text-sm">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span className="text-gray-700">{contact.address}</span>
        </div>
      )}
      
      <div className="flex items-center space-x-3 text-sm">
        <Calendar className="w-4 h-4 text-gray-400" />
        <span className="text-gray-700">
          Criado em {new Date(contact.createdAt).toLocaleDateString('pt-BR')}
        </span>
      </div>
    </div>
  );
}