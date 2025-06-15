import { Phone, Mail, MapPin, Calendar } from 'lucide-react';

interface ContactInfoProps {
  contact: {
    phone?: string;
    email?: string;
    address?: string;
    createdAt: string;
  };
}

export function ContactInfo({ contact }: ContactInfoProps) {
  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm text-gray-900">Contato</h4>
      
      {contact.phone && (
        <div className="flex items-center space-x-3 text-sm">
          <Phone className="w-4 h-4 text-gray-400" />
          <span className="text-gray-700">{contact.phone}</span>
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