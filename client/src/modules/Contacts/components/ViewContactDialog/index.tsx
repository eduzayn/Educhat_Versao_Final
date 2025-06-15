import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import {
  Phone,
  Mail,
  MapPin,
  Building,
  User,
  Calendar,
  MessageSquare,
} from "lucide-react";
import type { Contact } from "@shared/schema";

interface ViewContactDialogProps {
  contact: Contact | null;
  isOpen: boolean;
  onClose: () => void;
  onStartChat?: (contact: Contact) => void;
  metadata?: {
    status?: string;
    lastSeen?: string | Date;
    isOnline?: boolean;
  };
}

export function ViewContactDialog({
  contact,
  isOpen,
  onClose,
  onStartChat,
  metadata,
}: ViewContactDialogProps) {
  if (!contact) return null;

  const {
    name = "Contato",
    phone,
    email,
    location,
    profileImageUrl,
    createdAt,
  } = contact;

  const company = (contact as any)?.company;
  const owner = (contact as any)?.owner;
  const notes = (contact as any)?.notes;
  const contactType = (contact as any)?.contactType || "Contato";

  const handleStartChat = () => {
    onStartChat?.(contact);
    onClose();
  };

  const formatDate = (date?: string | Date) => {
    if (!date) return "Data não disponível";
    return new Date(date).toLocaleDateString("pt-BR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Detalhes do Contato
          </DialogTitle>
          <DialogDescription>
            Visualize as informações completas do contato e histórico de
            interações.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Avatar e nome */}
          <div className="flex items-center space-x-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={profileImageUrl || ""} />
              <AvatarFallback className="bg-educhat-primary text-white text-2xl">
                {name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900">{name}</h3>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary">{contactType}</Badge>
                {phone && (
                  <Badge
                    variant="outline"
                    className="text-green-600 border-green-200"
                  >
                    WhatsApp
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Campos básicos */}
          <div className="grid grid-cols-1 gap-4">
            {phone && (
              <InfoRow icon={<Phone />} label="Telefone" value={phone} />
            )}
            {email && <InfoRow icon={<Mail />} label="Email" value={email} />}
            {company && (
              <InfoRow icon={<Building />} label="Empresa" value={company} />
            )}
            {location && (
              <InfoRow icon={<MapPin />} label="Localização" value={location} />
            )}
            {owner && (
              <InfoRow icon={<User />} label="Responsável" value={owner} />
            )}
            <InfoRow
              icon={<Calendar />}
              label="Criado em"
              value={formatDate(createdAt)}
            />
          </div>

          {/* Metadados do WhatsApp */}
          {metadata && (
            <div className="border-t pt-6">
              <h4 className="font-semibold text-gray-900 mb-3">
                Informações do WhatsApp
              </h4>
              <div className="space-y-2 text-sm">
                {metadata.status && (
                  <MetaItem label="Status" value={metadata.status} />
                )}
                {metadata.lastSeen && (
                  <MetaItem
                    label="Visto por último"
                    value={new Date(metadata.lastSeen).toLocaleString("pt-BR")}
                  />
                )}
                {"isOnline" in metadata && (
                  <MetaItem
                    label="Online"
                    value={
                      <Badge
                        variant={metadata.isOnline ? "default" : "secondary"}
                      >
                        {metadata.isOnline ? "Sim" : "Não"}
                      </Badge>
                    }
                  />
                )}
              </div>
            </div>
          )}

          {/* Notas */}
          {notes && (
            <div className="border-t pt-6">
              <h4 className="font-semibold text-gray-900 mb-3">Observações</h4>
              <p className="text-gray-700 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                {notes}
              </p>
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-3 pt-4 border-t">
            {phone && onStartChat && (
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

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
      <div className="text-gray-500">{icon}</div>
      <div>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <p className="text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-600">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}