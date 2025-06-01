import { useState } from "react";
import { Button } from "@/shared/ui/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/ui/popover";
import { cn } from "@/lib/utils";
import { Smile, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Message } from "@shared/schema";

interface MessageReactionsProps {
  message: Message;
  conversationId: number;
  contactPhone: string;
}

// Conjunto robusto de reações organizadas por categorias
const REACTION_CATEGORIES = {
  emotions: {
    label: "Emoções",
    reactions: ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🥸", "🤩", "🥳"]
  },
  feelings: {
    label: "Sentimentos", 
    reactions: ["😥", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱"]
  },
  gestures: {
    label: "Gestos",
    reactions: ["👍", "👎", "👌", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👋", "🤚", "🖐️", "✋", "🖖", "👏", "🙌", "🤲", "🤝", "🙏", "✍️", "💪", "🦾", "🦿", "🦵", "🦶", "👂", "🦻"]
  },
  hearts: {
    label: "Corações",
    reactions: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "♥️", "💋", "💌", "💐", "🌹", "🌺", "🌻", "🌷", "🌸", "💒", "💍", "💎", "🔥"]
  },
  objects: {
    label: "Objetos",
    reactions: ["🎉", "🎊", "🎈", "🎁", "🎀", "🎂", "🍰", "🧁", "🍭", "🍬", "🍫", "🍿", "🍩", "🍪", "☕", "🍺", "🍻", "🥂", "🍷", "🥃", "🍸", "🍹", "🍾", "🎵", "🎶", "🎤", "🎧", "📱", "💻", "⌚", "📷", "📺"]
  },
  nature: {
    label: "Natureza",
    reactions: ["🌟", "⭐", "✨", "⚡", "☀️", "🌞", "🌝", "🌛", "🌜", "🌚", "🌕", "🌖", "🌗", "🌘", "🌑", "🌒", "🌓", "🌔", "🌙", "☁️", "⛅", "⛈️", "🌤️", "🌦️", "🌧️", "⛆", "❄️", "☃️", "⛄", "🌊", "💧", "☔"]
  }
};

const ALL_REACTIONS = Object.values(REACTION_CATEGORIES).flatMap(category => category.reactions);

export function MessageReactions({ message, conversationId, contactPhone }: MessageReactionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("emotions");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mutation para enviar reação
  const sendReactionMutation = useMutation({
    mutationFn: async ({ reaction }: { reaction: string }) => {
      console.log("📤 Enviando reação via Z-API:", { 
        phone: contactPhone, 
        messageId: message.id, 
        reaction 
      });

      const response = await apiRequest("/api/zapi/send-reaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: contactPhone,
          messageId: message.id.toString(),
          reaction
        })
      });

      return response;
    },
    onSuccess: (data) => {
      console.log("✅ Reação enviada via Z-API:", data);
      toast({
        title: "Reação enviada",
        description: "Sua reação foi enviada com sucesso!",
      });
      setIsOpen(false);
      // Invalidar cache para atualizar a conversa
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", conversationId, "messages"] });
    },
    onError: (error) => {
      console.error("❌ Erro ao enviar reação:", error);
      toast({
        title: "Erro ao enviar reação",
        description: "Não foi possível enviar a reação. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  // Mutation para remover reação
  const removeReactionMutation = useMutation({
    mutationFn: async () => {
      console.log("📤 Removendo reação via Z-API:", { 
        phone: contactPhone, 
        messageId: message.id 
      });

      const response = await apiRequest("/api/zapi/remove-reaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: contactPhone,
          messageId: message.id.toString()
        })
      });

      return response;
    },
    onSuccess: (data) => {
      console.log("✅ Reação removida via Z-API:", data);
      toast({
        title: "Reação removida",
        description: "Sua reação foi removida com sucesso!",
      });
      // Invalidar cache para atualizar a conversa
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", conversationId, "messages"] });
    },
    onError: (error) => {
      console.error("❌ Erro ao remover reação:", error);
      toast({
        title: "Erro ao remover reação",
        description: "Não foi possível remover a reação. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  const handleReactionClick = (reaction: string) => {
    sendReactionMutation.mutate({ reaction });
  };

  const handleRemoveReaction = () => {
    removeReactionMutation.mutate();
  };

  // Verificar se a mensagem já tem reação (simulado - seria vindo do backend)
  const hasReaction = false; // TODO: Implementar lógica de verificação de reação existente

  return (
    <div className="flex items-center gap-1">
      {/* Botão para remover reação se existir */}
      {hasReaction && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemoveReaction}
          disabled={removeReactionMutation.isPending}
          className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
        >
          <X className="w-3 h-3" />
        </Button>
      )}

      {/* Popover de reações */}
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
        
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-3">
            {/* Categorias */}
            <div className="flex gap-1 mb-3 border-b pb-2">
              {Object.entries(REACTION_CATEGORIES).map(([key, category]) => (
                <Button
                  key={key}
                  variant={activeCategory === key ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setActiveCategory(key)}
                  className={cn(
                    "text-xs px-2 py-1 h-7",
                    activeCategory === key && "bg-educhat-primary text-white"
                  )}
                >
                  {category.label}
                </Button>
              ))}
            </div>

            {/* Grid de reações */}
            <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
              {REACTION_CATEGORIES[activeCategory as keyof typeof REACTION_CATEGORIES].reactions.map((reaction, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReactionClick(reaction)}
                  disabled={sendReactionMutation.isPending}
                  className="h-8 w-8 p-0 text-lg hover:bg-gray-100 transition-colors"
                >
                  {reaction}
                </Button>
              ))}
            </div>

            {/* Reações frequentes */}
            <div className="mt-3 pt-2 border-t">
              <p className="text-xs text-gray-500 mb-2">Reações frequentes:</p>
              <div className="flex gap-1">
                {["❤️", "👍", "😂", "😮", "😢", "😡"].map((reaction, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleReactionClick(reaction)}
                    disabled={sendReactionMutation.isPending}
                    className="h-8 w-8 p-0 text-lg hover:bg-gray-100 transition-colors"
                  >
                    {reaction}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}