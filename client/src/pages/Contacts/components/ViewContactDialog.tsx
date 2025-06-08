import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../dialog';
import { Avatar, AvatarImage, AvatarFallback } from '../../avatar';
import { Badge } from '../../badge';
import { Button } from '../../button';
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
              <AvatarImage src={contact.profileImageUrl || ''} />
              <AvatarFallback className="bg-educhat-primary text-white text-2xl">
                {contact.name?.charAt(0)?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900">{contact.name}</h3>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary">
                  {(contact as any).contactType || 'Contato'}
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

            {(contact as any).company && (
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Building className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Empresa</p>
                  <p className="text-gray-900">{(contact as any).company}</p>
                </div>
              </div>
            )}

            {contact.location && (
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <MapPin className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Localização</p>
                  <p className="text-gray-900">{contact.location}</p>
                </div>
              </div>
            )}

            {(contact as any).owner && (
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <User className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Responsável</p>
                  <p className="text-gray-900">{(contact as any).owner}</p>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Calendar className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-700">Criado em</p>
                <p className="text-gray-900">
                  {contact.createdAt ? new Date(contact.createdAt).toLocaleDateString('pt-BR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'Data não disponível'}
                </p>
              </div>
            </div>
          </div>

          {/* Metadata do WhatsApp */}
          {metadata && (
            <div className="border-t pt-6">
              <h4 className="font-semibold text-gray-900 mb-3">Informações do WhatsApp</h4>
              <div className="space-y-2 text-sm">
                {metadata.status && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-medium">{metadata.status}</span>
                  </div>
                )}
                {metadata.lastSeen && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Visto por último:</span>
                    <span className="font-medium">{new Date(metadata.lastSeen).toLocaleString('pt-BR')}</span>
                  </div>
                )}
                {metadata.isOnline !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Online:</span>
                    <Badge variant={metadata.isOnline ? "default" : "secondary"}>
                      {metadata.isOnline ? 'Sim' : 'Não'}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Observações */}
          {(contact as any).notes && (
            <div className="border-t pt-6">
              <h4 className="font-semibold text-gray-900 mb-3">Observações</h4>
              <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                {(contact as any).notes}
              </p>
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-3 pt-4 border-t">
            {contact.phone && onStartChat && (
              <Button 
                onClick={handleStartChat}
                className="flex-1 bg-educhat-primary hover:bg-educhat-secondary"
              >
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