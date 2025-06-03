import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/shared/ui/ui/avatar';
import { Badge } from '@/shared/ui/ui/badge';
import { Button } from '@/shared/ui/ui/button';
import { Phone, Mail, MapPin, Building, User, Calendar, MessageSquare } from 'lucide-react';
import type { Contact } from '@shared/schema';

interface ViewContactDialogProps {
  contact: Contact | null;
  isOpen: boolean;
  onClose: () => void;
  onStartChat?: (contact: Contact) => void;
  metadata?: any;
}

export function ViewContactDialog({
  contact,
  isOpen,
  onClose,
  onStartChat,
  metadata
}: ViewContactDialogProps) {
  if (!contact) return null;

  const handleStartChat = () => {
    if (onStartChat) {
      onStartChat(contact);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Detalhes do Contato</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Avatar e informações principais */}
          <div className="flex items-center space-x-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={contact.profilePicture || ''} />
              <AvatarFallback className="bg-blue-100 text-blue-600 text-2xl">
                {contact.name?.charAt(0)?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900">{contact.name}</h3>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary">
                  {contact.type || 'Contato'}
                </Badge>
                {contact.phone && (
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    WhatsApp
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Informações de contato */}
          <div className="grid grid-cols-1 gap-4">
            {contact.phone && (
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Telefone</p>
                  <p className="text-gray-900">{contact.phone}</p>
                </div>
              </div>
            )}

            {contact.email && (
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Email</p>
                  <p className="text-gray-900">{contact.email}</p>
                </div>
              </div>
            )}

            {contact.company && (
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Building className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Empresa</p>
                  <p className="text-gray-900">{contact.company}</p>
                </div>
              </div>
            )}

            {contact.address && (
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <MapPin className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Endereço</p>
                  <p className="text-gray-900">{contact.address}</p>
                </div>
              </div>
            )}

            {contact.tags && contact.tags.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {contact.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {contact.notes && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Observações</p>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-900 whitespace-pre-wrap">{contact.notes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Metadados do WhatsApp */}
          {metadata && (
            <div className="border-t pt-4">
              <h4 className="text-lg font-semibold mb-3">Informações do WhatsApp</h4>
              <div className="space-y-2 text-sm">
                {metadata.pushname && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nome no WhatsApp:</span>
                    <span className="font-medium">{metadata.pushname}</span>
                  </div>
                )}
                {metadata.status && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-medium">{metadata.status}</span>
                  </div>
                )}
                {metadata.isBusiness && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Conta Business:</span>
                    <Badge variant="secondary">Sim</Badge>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-3 pt-4 border-t">
            {contact.phone && onStartChat && (
              <Button onClick={handleStartChat} className="flex-1">
                <MessageSquare className="w-4 h-4 mr-2" />
                Iniciar Conversa
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}