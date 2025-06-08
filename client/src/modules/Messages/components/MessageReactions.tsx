import { useState } from "react";
import { Button } from "@/shared/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/popover";
import { Smile, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/shared/lib/hooks/use-toast";
import type { Message } from "@shared/schema";

interface MessageReactionsProps {
  message: Message;
  conversationId: number;
  contactPhone: string;
}

// Reações comuns para mensagens - sistema simplificado
const COMMON_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "😡", "🔥", "💯", "👏", "🙏"];

export function MessageReactions({
  message,
  conversationId,
  contactPhone,
}: MessageReactionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const hasReaction = false; // Substituir por lógica real

  const sendReactionMutation = useMutation({
    mutationFn: async ({ reaction }: { reaction: string }) => {
      const response = await apiRequest("POST", "/api/zapi/send-reaction", {
        phone: contactPhone,
        messageId: message.id.toString(),
        reaction,
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Reação enviada",
        description: "Sua reação foi enviada com sucesso!",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/conversations", conversationId, "messages"],
      });
      setIsOpen(false);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao enviar reação.",
        variant: "destructive",
      });
    },
  });

  const removeReactionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/zapi/remove-reaction", {
        phone: contactPhone,
        messageId: message.id.toString(),
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Reação removida",
        description: "Sua reação foi removida.",
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/conversations", conversationId, "messages"],
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Falha ao remover reação.",
        variant: "destructive",
      });
    },
  });

  const ReactionButton = ({ emoji }: { emoji: string }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => sendReactionMutation.mutate({ reaction: emoji })}
      disabled={sendReactionMutation.isPending}
      className="h-8 w-8 p-0 text-lg hover:bg-gray-100 transition"
    >
      {emoji}
    </Button>
  );

  return (
    <div className="flex items-center gap-1">
      {hasReaction && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => removeReactionMutation.mutate()}
          disabled={removeReactionMutation.isPending}
          className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
        >
          <X className="w-3 h-3" />
        </Button>
      )}

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            disabled={sendReactionMutation.isPending}
          >
            {sendReactionMutation.isPending ? (
              <div className="w-3 h-3 animate-spin rounded-full border border-gray-400 border-t-transparent" />
            ) : (
              <Smile className="w-3 h-3" />
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-64 p-3" align="start">
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Reações rápidas</h4>
            <div className="grid grid-cols-5 gap-2">
              {COMMON_REACTIONS.map((emoji) => (
                <ReactionButton emoji={emoji} key={emoji} />
              ))}
            </div>
            <p className="text-xs text-gray-500 text-center">
              Reações disponíveis apenas para WhatsApp
            </p>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}