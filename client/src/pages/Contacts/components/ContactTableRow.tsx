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
        {type || 'Não definido'}
      </Badge>
    );
  };

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelect(contact.id, !!checked)}
        />
      </td>
      
      <td className="px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Avatar className="w-10 h-10">
              <AvatarImage src={contact.profileImageUrl || ''} />
              <AvatarFallback className="bg-educhat-primary text-white">
                {contact.name?.charAt(0)?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            
            {isWhatsAppAvailable && contact.phone && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute -bottom-1 -right-1 h-6 w-6 p-0 rounded-full bg-white border border-gray-200 hover:bg-gray-50"
                onClick={handleUpdatePhoto}
                disabled={updatingPhoto}
                title="Atualizar foto do WhatsApp"
              >
                <Camera className={`w-3 h-3 ${updatingPhoto ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
          
          <div>
            <div className="font-medium text-gray-900">{contact.name}</div>
            {contact.company && (
              <div className="text-sm text-gray-500">{contact.company}</div>
            )}
          </div>
        </div>
      </td>
      
      <td className="px-6 py-4">
        <div className="text-sm text-gray-900">{contact.email || '-'}</div>
      </td>
      
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-900">
            {contact.phone || '-'}
          </span>
          {contact.phone && (
            <Phone className="w-4 h-4 text-green-500" title="WhatsApp disponível" />
          )}
        </div>
      </td>
      
      <td className="px-6 py-4">
        {getContactTypeBadge(contact.contactType)}
      </td>
      
      <td className="px-6 py-4">
        <div className="text-sm text-gray-900">{contact.owner || '-'}</div>
      </td>
      
      <td className="px-6 py-4">
        <div className="text-sm text-gray-500">
          {contact.createdAt ? new Date(contact.createdAt).toLocaleDateString('pt-BR') : '-'}
        </div>
      </td>
      
      <td className="px-6 py-4">
        <div className="flex justify-end">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView(contact)}
              className="text-blue-600 hover:text-blue-700"
            >
              <Eye className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(contact)}
              className="text-gray-600 hover:text-gray-700"
            >
              <Edit className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(contact)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </td>
    </tr>
  );
}