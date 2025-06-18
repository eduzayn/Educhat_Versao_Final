import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Edit, Check, X } from 'lucide-react';
import { useMediaUrl } from '@/shared/lib/utils/whatsappProxy';
import { useUpdateContact } from '@/shared/lib/hooks/useContacts';
import { useToast } from '@/shared/lib/hooks/use-toast';

interface ContactHeaderProps {
  contact: {
    id: number;
    name: string;
    profileImageUrl?: string;
    isOnline?: boolean;
  };
}

export function ContactHeader({ contact }: ContactHeaderProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(contact.name);
  
  const proxiedProfileImageUrl = useMediaUrl(contact.profileImageUrl);
  const updateContactMutation = useUpdateContact();
  const { toast } = useToast();

  const handleEditStart = () => {
    setIsEditingName(true);
    setEditedName(contact.name);
  };

  const handleEditSave = async () => {
    if (editedName.trim() === contact.name) {
      setIsEditingName(false);
      return;
    }

    if (!editedName.trim()) {
      toast({
        title: "Nome inválido",
        description: "O nome do contato não pode estar vazio.",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateContactMutation.mutateAsync({
        id: contact.id,
        data: { name: editedName.trim() }
      });
      
      toast({
        title: "Nome atualizado",
        description: "O nome do contato foi atualizado com sucesso.",
      });
      
      setIsEditingName(false);
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar o nome do contato.",
        variant: "destructive",
      });
    }
  };

  const handleEditCancel = () => {
    setEditedName(contact.name);
    setIsEditingName(false);
  };

  return (
    <div className="text-center">
      <Avatar className="w-16 h-16 mx-auto mb-3">
        <AvatarImage src={proxiedProfileImageUrl || ''} />
        <AvatarFallback className="text-lg font-semibold">
          {contact.name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <div className="mb-1">
        {isEditingName ? (
          <div className="flex items-center justify-center space-x-1 max-w-xs mx-auto">
            <Input
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              className="text-center text-lg font-semibold h-8 px-2"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleEditSave();
                if (e.key === 'Escape') handleEditCancel();
              }}
              autoFocus
            />
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={handleEditSave}
              disabled={updateContactMutation.isPending}
            >
              <Check className="h-3 w-3 text-green-600" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={handleEditCancel}
            >
              <X className="h-3 w-3 text-red-600" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-1 group">
            <h3 className="font-semibold text-lg text-gray-900">
              {contact.name}
            </h3>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleEditStart}
            >
              <Edit className="h-3 w-3 text-gray-500" />
            </Button>
          </div>
        )}
      </div>
      
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