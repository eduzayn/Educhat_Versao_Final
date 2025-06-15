import { Button } from "@/shared/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { Smile } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConversationWithContact } from "@shared/schema";

// Emojis organizados por categoria
const EMOJI_CATEGORIES = {
  Frequentes: ["👍", "❤️", "😊", "😂", "🙏", "👏", "🔥", "💯"],
  Pessoas: [
    "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇",
    "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚",
    "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩",
    "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣",
    "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬",
    "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗",
    "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯",
    "😦", "😧", "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐",
    "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕"
  ],
  Gestos: [
    "👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞",
    "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍",
    "👎", "👊", "✊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏"
  ],
  Objetos: [
    "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔",
    "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟", "☮️",
    "✝️", "☪️", "🕉️", "☸️", "✡️", "🔯", "🕎", "☯️", "☦️", "🛐",
    "⛎", "♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓",
    "🆔", "⚡", "💥", "💫", "⭐", "🌟", "✨", "🔥", "💯", "💢", "💨", "💦", "💤"
  ],
  Natureza: [
    "🌍", "🌎", "🌏", "🌐", "🗺️", "🗾", "🧭", "🏔️", "⛰️", "🌋",
    "🗻", "🏕️", "🏖️", "🏜️", "🏝️", "🏞️", "🏟️", "🏛️", "🏗️", "🧱",
    "🏘️", "🏚️", "🏠", "🏡", "🏢", "🏣", "🏤", "🏥", "🏦", "🏨",
    "🏩", "🏪", "🏫", "🏬", "🏭", "🏯", "🏰", "💒", "🗼", "🗽",
    "⛪", "🕌", "🛕", "🕍", "⛩️", "🕋"
  ],
  Comida: [
    "🍎", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐", "🍈", "🍒",
    "🍑", "🥭", "🍍", "🥥", "🥝", "🍅", "🍆", "🥑", "🥦", "🥬",
    "🥒", "🌶️", "🫑", "🌽", "🥕", "🫒", "🧄", "🧅", "🥔", "🍠",
    "🥐", "🥯", "🍞", "🥖", "🥨", "🧀", "🥚", "🍳", "🧈", "🥞",
    "🧇", "🥓", "🥩", "🍗", "🍖", "🦴", "🌭", "🍔", "🍟", "🍕"
  ],
};

interface EmojiReactionPopoverProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onInsertEmoji: (emoji: string) => void;
  onSendReaction: (emoji: string) => void;
  activeConversation?: ConversationWithContact;
  isPending: boolean;
  activeEmojiCategory: string;
  onCategoryChange: (category: string) => void;
}

export function EmojiReactionPopover({
  isOpen,
  onOpenChange,
  onInsertEmoji,
  onSendReaction,
  activeConversation,
  isPending,
  activeEmojiCategory,
  onCategoryChange,
}: EmojiReactionPopoverProps) {
  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="p-2.5 text-educhat-medium hover:text-educhat-blue"
          disabled={isPending}
        >
          {isPending ? (
            <div className="w-5.5 h-5.5 animate-spin rounded-full border border-gray-400 border-t-transparent" />
          ) : (
            <Smile className="w-5.5 h-5.5" />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-96 p-0 z-40 glass-effect shadow-2xl rounded-2xl border-0"
        align="end"
      >
        <div className="p-6">
          {/* Header elegante com gradiente e ícone animado */}
          <div className="relative mb-6 pb-4">
            <div className="absolute inset-0 bg-gradient-to-r from-educhat-primary/10 via-blue-500/10 to-purple-500/10 rounded-xl -mx-3 -my-2"></div>
            <div className="relative flex items-center justify-between">
              <h4 className="text-lg font-bold text-gray-800 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-educhat-primary to-blue-500 rounded-full">
                  <Smile className="w-4 h-4 text-white" />
                </div>
                Emojis & Reações
              </h4>
              {activeConversation?.contact.phone && (
                <span className="text-xs text-gray-600 bg-white/80 px-3 py-1.5 rounded-full shadow-sm border border-gray-200">
                  Clique • ou → para reação
                </span>
              )}
            </div>
          </div>

          {/* Navegação por categorias com design sofisticado */}
          <div className="flex flex-wrap gap-2 mb-6">
            {Object.keys(EMOJI_CATEGORIES).map((category) => (
              <Button
                key={category}
                variant="ghost"
                size="sm"
                onClick={() => onCategoryChange(category)}
                className={cn(
                  "text-xs px-4 py-2 h-9 rounded-full font-semibold transition-all duration-300 transform",
                  activeEmojiCategory === category
                    ? "bg-gradient-to-r from-educhat-primary via-blue-500 to-purple-500 text-white shadow-xl shadow-educhat-primary/30 scale-110 border-0"
                    : "bg-white/70 hover:bg-white text-gray-700 hover:scale-105 hover:shadow-lg border border-gray-200 hover:border-educhat-primary/30",
                )}
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Grid de emojis com animações elegantes */}
          <div className="max-h-72 overflow-y-auto pr-2 scrollbar-thin">
            <div className="grid grid-cols-9 gap-2 emoji-grid-enter">
              {EMOJI_CATEGORIES[
                activeEmojiCategory as keyof typeof EMOJI_CATEGORIES
              ].map((emoji, index) => (
                <div
                  key={`${activeEmojiCategory}-${index}`}
                  className="flex flex-col items-center gap-1.5"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onInsertEmoji(emoji)}
                    className="emoji-button-hover h-11 w-11 p-0 text-xl bg-white/50 hover:bg-gradient-to-br hover:from-white hover:to-gray-50 rounded-xl transition-all duration-300 hover:scale-125 hover:shadow-xl hover:shadow-gray-200/50 border border-gray-100 hover:border-educhat-primary/30"
                    title={`Inserir ${emoji} no texto`}
                  >
                    {emoji}
                  </Button>
                  {activeConversation?.contact.phone && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSendReaction(emoji)}
                      className="h-6 w-11 p-0 text-xs bg-gradient-to-r from-educhat-primary/15 via-blue-500/15 to-purple-500/15 text-educhat-primary hover:from-educhat-primary hover:via-blue-500 hover:to-purple-500 hover:text-white rounded-lg transition-all duration-300 hover:scale-110 hover:shadow-lg border border-educhat-primary/20 hover:border-0"
                      title={`Enviar reação ${emoji}`}
                      disabled={isPending}
                    >
                      →
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Info elegante para contatos sem WhatsApp */}
          {!activeConversation?.contact.phone && (
            <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 border border-amber-200/50 rounded-2xl text-sm text-amber-800 text-center shadow-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="p-1.5 bg-amber-100 rounded-full">
                  <span className="text-lg">💡</span>
                </div>
                <span className="font-semibold">Reações WhatsApp</span>
              </div>
              <span className="text-xs text-amber-700">
                Disponíveis apenas para contatos com número
              </span>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}