import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { Badge } from '@/shared/ui/badge';
import { Eye, Edit, Trash2, Phone, Camera } from 'lucide-react';
import { ContactAvatar } from '@/shared/ui/ContactAvatar';
import type { Contact } from '@shared/schema';

interface ContactTableRowProps {
  contact: Contact;
  isSelected: boolean;
  onSelect: (contactId: number, selected: boolean) => void;
  onView: (contact: Contact) => void;
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
  onUpdatePhoto: (contactId: number) => void;
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
      await onUpdatePhoto(contact.id);
    } finally {
      setUpdatingPhoto(false);
    }
  };

  const getContactTypeBadge = (tags: string[] | null) => {
    const type = tags && tags.length > 0 ? tags[0] : null;
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      'Lead': 'default',
      'Cliente': 'secondary',
      'Parceiro': 'outline',
      'Fornecedor': 'destructive'
    };
    
    return (
      <Badge variant={variants[type || ''] || 'default'}>
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
            <ContactAvatar
              src={contact.profileImageUrl}
              name={contact.name}
              size="md"
              className="w-10 h-10"
            />
            
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
            {contact.location && (
              <div className="text-sm text-gray-500">{contact.location}</div>
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
            <Phone className="w-4 h-4 text-green-500" />
          )}
        </div>
      </td>
      
      <td className="px-6 py-4">
        {getContactTypeBadge(contact.tags)}
      </td>
      
      <td className="px-6 py-4">
        <div className="text-sm text-gray-900">{contact.location || '-'}</div>
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