import { useState } from 'react';
import { Button } from '@/shared/ui/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/shared/ui/ui/avatar';
import { Checkbox } from '@/shared/ui/ui/checkbox';
import { Badge } from '@/shared/ui/ui/badge';
import { Eye, Edit, Trash2, Phone, Camera } from 'lucide-react';
import type { Contact } from '@shared/schema';

interface ContactTableRowProps {
  contact: Contact;
  isSelected: boolean;
  onSelect: (contactId: number, selected: boolean) => void;
  onView: (contact: Contact) => void;
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
  onUpdatePhoto: (phone: string) => void;
  isWhatsAppAvailable: boolean;
}

export function ContactTableRow({
  contact,
  isSelected,
  onSelect,
  onView,
  onEdit,
  onDelete,
  onUpdatePhoto,
  isWhatsAppAvailable
}: ContactTableRowProps) {
  const [updatingPhoto, setUpdatingPhoto] = useState(false);

  const handleUpdatePhoto = async () => {
    if (!contact.phone) return;
    
    setUpdatingPhoto(true);
    try {
      await onUpdatePhoto(contact.phone);
    } finally {
      setUpdatingPhoto(false);
    }
  };

  const getContactTypeBadge = (type: string | null) => {
    const variants = {
      'Lead': 'default',
      'Cliente': 'secondary',
      'Parceiro': 'outline',
      'Fornecedor': 'destructive'
    };
    
    return (
      <Badge variant={variants[type as keyof typeof variants] || 'default'}>
        {type || 'Sem tipo'}
      </Badge>
    );
  };

  const getStatusBadge = (status: string | null) => {
    const statusConfig = {
      'Ativo': { variant: 'default', color: 'bg-green-100 text-green-800' },
      'Inativo': { variant: 'secondary', color: 'bg-gray-100 text-gray-800' },
      'Bloqueado': { variant: 'destructive', color: 'bg-red-100 text-red-800' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['Inativo'];
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {status || 'Inativo'}
      </span>
    );
  };

  const formatPhone = (phone: string | null) => {
    if (!phone) return 'Não informado';
    
    // Formatar telefone brasileiro
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelect(contact.id, !!checked)}
        />
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <Avatar className="h-10 w-10">
              <AvatarImage src={contact.profilePicture || ''} alt={contact.name} />
              <AvatarFallback className="bg-blue-100 text-blue-600">
                {getInitials(contact.name)}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{contact.name}</div>
            {contact.company && (
              <div className="text-sm text-gray-500">{contact.company}</div>
            )}
          </div>
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">
          {contact.email || 'Não informado'}
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">
          {formatPhone(contact.phone)}
        </div>
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        {getContactTypeBadge(contact.type)}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap">
        {getStatusBadge(contact.status)}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(contact)}
            className="text-blue-600 hover:text-blue-900"
          >
            <Eye className="w-4 h-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(contact)}
            className="text-gray-600 hover:text-gray-900"
          >
            <Edit className="w-4 h-4" />
          </Button>
          
          {contact.phone && isWhatsAppAvailable && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUpdatePhoto}
              disabled={updatingPhoto}
              className="text-green-600 hover:text-green-900"
              title="Atualizar foto do WhatsApp"
            >
              <Camera className={`w-4 h-4 ${updatingPhoto ? 'animate-spin' : ''}`} />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(contact)}
            className="text-red-600 hover:text-red-900"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
}