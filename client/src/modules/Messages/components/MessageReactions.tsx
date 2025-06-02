import { useState } from "react";
import { Button } from "@/shared/ui/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/ui/popover";
import { cn } from "@/lib/utils";
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

const REACTION_CATEGORIES = {
  emotions: {
    label: "Emoções",
    reactions: ["😀", "😂", "😊", "😇", "😍", "😎", "🥳", "🤓"],
  },
  feelings: {
    label: "Sentimentos",
    reactions: ["😢", "😭", "😡", "😳", "🥶", "😱", "🤯", "🤔"],
  },
  gestures: {
    label: "Gestos",
    reactions: ["👍", "👎", "👌", "✌️", "👏", "🙏", "💪"],
  },
  hearts: {
    label: "Corações",
    reactions: ["❤️", "🧡", "💛", "💚", "💙", "💜", "💔", "💕"],
  },
};

const COMMON_REACTIONS = ["❤️", "👍", "😂", "😮", "😢", "😡"];

export function MessageReactions({
  message,
  conversationId,
  contactPhone,
}: MessageReactionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("emotions");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const hasReaction = false; // Substituir por lógica real (ex: message.reactions.includes(...))

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
        description: "A reação foi removida com sucesso!",
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

  const handleReaction = (emoji: string) => {
    sendReactionMutation.mutate({ reaction: emoji });
  };

  const ReactionButton = ({ emoji }: { emoji: string }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleReaction(emoji)}
      disabled={sendReactionMutation.isPending}
      className="h-8 w-8 p-0 text-lg hover:bg-gray-100 transition"
    >
      {emoji}
    </Button>
  );

  const ReactionCategoryButton = ({
    keyName,
    label,
  }: {
    keyName: string;
    label: string;
  }) => (
    <Button
      key={keyName}
      variant={activeCategory === keyName ? "default" : "ghost"}
      size="sm"
      onClick={() => setActiveCategory(keyName)}
      className={cn(
        "text-xs px-2 py-1 h-7",
        activeCategory === keyName && "bg-educhat-primary text-white",
      )}
    >
      {label}
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

        <PopoverContent className="w-96 p-0" align="start">
          <div className="p-3">
            {/* Categorias */}
            <div className="flex flex-wrap gap-1 mb-3 border-b pb-2">
              {Object.entries(REACTION_CATEGORIES).map(([key, value]) => (
                <ReactionCategoryButton
                  keyName={key}
                  label={value.label}
                  key={key}
                />
              ))}
            </div>

            {/* Reações principais */}
            <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
              {REACTION_CATEGORIES[
                activeCategory as keyof typeof REACTION_CATEGORIES
              ].reactions.map((emoji) => (
                <ReactionButton emoji={emoji} key={emoji} />
              ))}
            </div>

            {/* Reações frequentes */}
            <div className="mt-3 pt-2 border-t">
              <p className="text-xs text-gray-500 mb-2">Reações frequentes:</p>
              <div className="flex gap-1">
                {COMMON_REACTIONS.map((emoji) => (
                  <ReactionButton emoji={emoji} key={emoji} />
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
