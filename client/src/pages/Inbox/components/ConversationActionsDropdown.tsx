import { useState } from 'react';
import { Button } from '@/shared/ui/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/shared/ui/ui/dropdown-menu';
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
  Info
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
// Hook simples para toast
const useToast = () => ({
  toast: ({ title, description, variant }: { title: string; description: string; variant?: string }) => {
    console.log(`${title}: ${description}`);
    // Implementar toast real posteriormente
  }
});

interface ConversationActionsDropdownProps {
  conversationId: number;
  contactId: number;
  currentStatus?: string;
}

export function ConversationActionsDropdown({ 
  conversationId, 
  contactId, 
  currentStatus = 'open' 
}: ConversationActionsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mutation para atualizar status da conversa
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const response = await fetch(`/api/conversations/${conversationId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!response.ok) throw new Error('Erro ao atualizar status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      toast({
        title: "Status atualizado",
        description: "O status da conversa foi atualizado com sucesso."
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status da conversa.",
        variant: "destructive"
      });
    }
  });

  // Mutation para marcar como não lida
  const markAsUnreadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/conversations/${conversationId}/mark-unread`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (!response.ok) throw new Error('Erro ao marcar como não lida');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      toast({
        title: "Marcado como não lida",
        description: "A conversa foi marcada como não lida."
      });
    }
  });

  const handleStatusChange = (status: string) => {
    updateStatusMutation.mutate(status);
    setIsOpen(false);
  };

  const handleMarkAsUnread = () => {
    markAsUnreadMutation.mutate();
    setIsOpen(false);
  };

  const handleAction = (action: string) => {
    // Implementar outras ações conforme necessário
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: `A ação "${action}" será implementada em breve.`
    });
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        {/* Status da conversa */}
        <DropdownMenuItem onClick={() => handleMarkAsUnread()}>
          <MailCheck className="w-4 h-4 mr-2" />
          Marcar como não lida
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleStatusChange('pending')}>
          <Clock className="w-4 h-4 mr-2" />
          Desmarcar como pendente
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Ações do usuário */}
        <DropdownMenuItem onClick={() => handleAction('seguir')}>
          <UserCheck className="w-4 h-4 mr-2" />
          Seguir
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleAction('executar-bot')}>
          <Bot className="w-4 h-4 mr-2" />
          Executar bot
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleAction('agendar-mensagem')}>
          <Calendar className="w-4 h-4 mr-2" />
          Agendar mensagem
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Histórico e transferência */}
        <DropdownMenuItem onClick={() => handleAction('sincronizar-historico')}>
          <History className="w-4 h-4 mr-2" />
          Sincronizar histórico
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleAction('transferir-canal')}>
          <ArrowRight className="w-4 h-4 mr-2" />
          Transferir para outro canal
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Ações restritivas */}
        <DropdownMenuItem onClick={() => handleAction('bloquear')}>
          <UserX className="w-4 h-4 mr-2" />
          Bloquear
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleAction('exportar-csv')}>
          <FileText className="w-4 h-4 mr-2" />
          Exportar para CSV
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Informações */}
        <DropdownMenuItem onClick={() => handleAction('pesquisar-mensagem')}>
          <Search className="w-4 h-4 mr-2" />
          Pesquisar mensagem
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => handleAction('ver-informacoes')}>
          <Info className="w-4 h-4 mr-2" />
          Ver informações
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}