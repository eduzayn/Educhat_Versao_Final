import { useState } from "react";
import { Button } from "@/shared/ui/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/ui/popover";
import { Smile } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/shared/lib/hooks/use-toast";
import { useChatStore } from "@/shared/store/store/chatStore";
import { cn } from "@/lib/utils";

// Importar categorias do MessageReactions
const REACTION_CATEGORIES = {
  emotions: {
    label: "Emoções",
    reactions: ["😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬"],
  },
  feelings: {
    label: "Sentimentos", 
    reactions: ["🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕"],
  },
  gestures: {
    label: "Gestos",
    reactions: ["👍", "👎", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✍️", "💪", "🦾", "🦿", "🦵", "🦶", "👂", "🦻", "👃", "🧠", "🫀", "🫁", "🦷", "🦴", "👀", "👁️", "👅"],
  },
  hearts: {
    label: "Corações",
    reactions: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟"],
  },
  travel: {
    label: "Viagem",
    reactions: ["🚗", "🚕", "🚙", "🚌", "🚎", "🏎️", "🚓", "🚑", "🚒", "🚐", "🛻", "🚚", "🚛", "🚜", "🏍️", "🛵", "🚲", "🛴", "🛺", "🚨", "🚔", "🚍", "🚘", "🚖", "🚡", "🚠", "🚟", "🚃", "🚋", "🚞", "🚝", "🚄", "🚅", "🚈", "🚂", "🚆", "🚇", "🚊", "🚉", "✈️", "🛫", "🛬", "🛩️", "💺", "🛰️", "🚀", "🛸", "🚁", "⛵", "🚤", "🛥️", "🛳️", "⛴️", "🚢"],
  },
};

// Reações mais usadas para exibir no topo
const COMMON_REACTIONS = ["👍", "❤️", "😊", "😂", "😢", "😮", "😡", "🎉"];

interface EmojiReactionPickerProps {
  onEmojiInsert?: (emoji: string) => void;
  className?: string;
}

export function EmojiReactionPicker({ onEmojiInsert, className }: EmojiReactionPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("emotions");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { activeConversation } = useChatStore();

  // Mutation para enviar reação rápida
  const sendQuickReactionMutation = useMutation({
    mutationFn: async ({ reaction }: { reaction: string }) => {
      if (!activeConversation?.contact.phone) {
        throw new Error("Número de telefone do contato não disponível");
      }

      const response = await fetch("/api/zapi/send-reaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: activeConversation.contact.phone,
          reaction,
        }),
      });

      if (!response.ok) {
        throw new Error("Falha ao enviar reação");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Reação enviada",
        description: "Sua reação foi enviada com sucesso!",
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

  const handleQuickReaction = (emoji: string) => {
    sendQuickReactionMutation.mutate({ reaction: emoji });
  };

  const insertEmoji = (emoji: string) => {
    if (onEmojiInsert) {
      onEmojiInsert(emoji);
    }
  };

  const ReactionButton = ({ emoji }: { emoji: string }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => insertEmoji(emoji)}
      disabled={sendQuickReactionMutation.isPending}
      className="h-8 w-8 p-0 text-lg hover:bg-gray-100 transition"
      title={`Inserir ${emoji} no texto`}
    >
      {emoji}
    </Button>
  );

  const QuickReactionButton = ({ emoji }: { emoji: string }) => (
    <div className="flex flex-col items-center">
      <ReactionButton emoji={emoji} />
      {activeConversation?.contact.phone && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleQuickReaction(emoji)}
          className="h-6 w-8 p-0 text-xs text-blue-600 hover:bg-blue-50"
          title={`Enviar reação ${emoji}`}
          disabled={sendQuickReactionMutation.isPending}
        >
          →
        </Button>
      )}
    </div>
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
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("p-2.5 text-educhat-medium hover:text-educhat-blue", className)}
          disabled={sendQuickReactionMutation.isPending}
        >
          {sendQuickReactionMutation.isPending ? (
            <div className="w-5.5 h-5.5 animate-spin rounded-full border border-gray-400 border-t-transparent" />
          ) : (
            <Smile className="w-5.5 h-5.5" />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-96 p-0 max-h-[500px]" align="end">
        <div className="flex flex-col h-full">
          {/* Header fixo */}
          <div className="p-3 border-b bg-white">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium">Emojis & Reações</h4>
              {activeConversation?.contact.phone && (
                <span className="text-xs text-gray-500">
                  Clique para inserir ou enviar reação
                </span>
              )}
            </div>
            
            {/* Reações frequentes no topo */}
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-2 font-medium">Mais usadas:</p>
              <div className="grid grid-cols-8 gap-1">
                {COMMON_REACTIONS.map((emoji) => (
                  <QuickReactionButton emoji={emoji} key={emoji} />
                ))}
              </div>
            </div>

            {/* Categorias */}
            <div className="flex flex-wrap gap-1">
              {Object.entries(REACTION_CATEGORIES).map(([key, value]) => (
                <ReactionCategoryButton
                  keyName={key}
                  label={value.label}
                  key={key}
                />
              ))}
            </div>
          </div>

          {/* Área de scroll com emojis */}
          <div 
            className="flex-1 p-3 overflow-y-auto custom-scrollbar" 
            style={{ 
              maxHeight: '300px'
            }}
          >
            <div className="grid grid-cols-8 gap-2 pb-2">
              {REACTION_CATEGORIES[
                activeCategory as keyof typeof REACTION_CATEGORIES
              ].reactions.map((emoji) => (
                <ReactionButton emoji={emoji} key={emoji} />
              ))}
            </div>
          </div>

          {/* Footer fixo */}
          <div className="p-2 border-t bg-gray-50">
            <p className="text-xs text-gray-400 text-center">
              {REACTION_CATEGORIES[activeCategory as keyof typeof REACTION_CATEGORIES].reactions.length} emojis disponíveis
            </p>
            {!activeConversation?.contact.phone && (
              <p className="text-xs text-gray-600 text-center mt-1">
                Reações disponíveis apenas para contatos do WhatsApp
              </p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}