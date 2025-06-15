import { useState } from "react";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/shared/ui/dropdown-menu";

import {
  MoreVertical,
  MailCheck,
  Clock,
  UserCheck,
  Bot,
  Calendar,
  History,
  ArrowRight,
  UserX,
  FileText,
  Search,
  Info,
} from "lucide-react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// TODO: Substituir por hook real
const useToast = () => ({
  toast: ({
    title,
    description,
    variant,
  }: {
    title: string;
    description: string;
    variant?: string;
  }) => console.log(`[${variant || "info"}] ${title}: ${description}`),
});

interface ConversationActionsDropdownProps {
  conversationId: number;
  contactId: number;
  currentStatus?: string | null;
}

export function ConversationActionsDropdown({
  conversationId,
  contactId,
  currentStatus = "open",
}: ConversationActionsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const res = await fetch(`/api/conversations/${conversationId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      toast({
        title: "Status atualizado",
        description: "Conversa atualizada com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao atualizar status",
        description: "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const markAsUnreadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `/api/conversations/${conversationId}/mark-unread`,
        { method: "POST" },
      );
      if (!res.ok) throw new Error();
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/conversations/unread-count"],
      });
      toast({
        title: "Conversa marcada como não lida",
        description: "Essa conversa voltará para o topo da lista.",
      });
    },
    onError: () => {
      toast({
        title: "Erro ao marcar como não lida",
        description: "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (status: string) => {
    updateStatusMutation.mutate(status);
    setIsOpen(false);
  };

  const handleMarkAsUnread = () => {
    markAsUnreadMutation.mutate();
    setIsOpen(false);
  };

  const handlePlaceholderAction = (actionLabel: string) => {
    toast({
      title: "Função em desenvolvimento",
      description: `A funcionalidade "${actionLabel}" será implementada em breve.`,
    });
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-muted/10"
          aria-label="Mais ações"
        >
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        {/* Status e leitura */}
        <DropdownMenuItem onClick={handleMarkAsUnread}>
          <MailCheck className="w-4 h-4 mr-2 text-blue-600" />
          Marcar como não lida
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleStatusChange("pending")}>
          <Clock className="w-4 h-4 mr-2 text-orange-600" />
          Marcar como pendente
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Ações */}
        <DropdownMenuItem onClick={() => handlePlaceholderAction("Seguir")}>
          <UserCheck className="w-4 h-4 mr-2 text-green-600" />
          Seguir
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handlePlaceholderAction("Executar bot")}
        >
          <Bot className="w-4 h-4 mr-2 text-purple-600" />
          Executar bot
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handlePlaceholderAction("Agendar mensagem")}
        >
          <Calendar className="w-4 h-4 mr-2 text-blue-600" />
          Agendar mensagem
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Outros */}
        <DropdownMenuItem
          onClick={() => handlePlaceholderAction("Sincronizar histórico")}
        >
          <History className="w-4 h-4 mr-2 text-gray-600" />
          Sincronizar histórico
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handlePlaceholderAction("Transferir canal")}
        >
          <ArrowRight className="w-4 h-4 mr-2 text-blue-600" />
          Transferir para outro canal
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => handlePlaceholderAction("Bloquear contato")}
        >
          <UserX className="w-4 h-4 mr-2 text-red-600" />
          Bloquear
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handlePlaceholderAction("Exportar CSV")}
        >
          <FileText className="w-4 h-4 mr-2 text-gray-600" />
          Exportar para CSV
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => handlePlaceholderAction("Pesquisar mensagem")}
        >
          <Search className="w-4 h-4 mr-2 text-gray-600" />
          Pesquisar mensagem
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handlePlaceholderAction("Ver informações")}
        >
          <Info className="w-4 h-4 mr-2 text-blue-600" />
          Ver informações
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
