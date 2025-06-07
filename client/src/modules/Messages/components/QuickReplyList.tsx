import { useState, useEffect } from "react";
import { Button } from "@/shared/ui/ui/button";
import { Input } from "@/shared/ui/ui/input";
import { cn } from "@/lib/utils";
import { Search, MessageSquare } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface QuickReply {
  id: number;
  title: string;
  content: string;
  type: string;
  category?: string;
  shortcut?: string;
}

interface QuickReplyListProps {
  isOpen: boolean;
  onSelect: (content: string) => void;
  onClose: () => void;
  filter?: string;
  selectedIndex?: number;
  onIndexChange?: (index: number) => void;
}

export function QuickReplyList({
  isOpen,
  onSelect,
  onClose,
  filter = "",
  selectedIndex = 0,
  onIndexChange,
}: QuickReplyListProps) {
  const [searchTerm, setSearchTerm] = useState(filter);

  const { data: quickReplies = [] } = useQuery<QuickReply[]>({
    queryKey: ["/api/quick-replies"],
    enabled: isOpen,
  });

  const filteredReplies = quickReplies.filter((reply) =>
    reply.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reply.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (reply.shortcut && reply.shortcut.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  useEffect(() => {
    setSearchTerm(filter);
  }, [filter]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          const nextIndex = Math.min(selectedIndex + 1, filteredReplies.length - 1);
          onIndexChange?.(nextIndex);
          break;
        case "ArrowUp":
          e.preventDefault();
          const prevIndex = Math.max(selectedIndex - 1, 0);
          onIndexChange?.(prevIndex);
          break;
        case "Enter":
          e.preventDefault();
          if (filteredReplies[selectedIndex]) {
            onSelect(filteredReplies[selectedIndex].content);
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, filteredReplies, onSelect, onClose, onIndexChange]);

  if (!isOpen) return null;

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-80 overflow-hidden z-50">
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar respostas rápidas..."
            className="pl-10"
            autoFocus
          />
        </div>
      </div>

      <div className="max-h-60 overflow-y-auto">
        {filteredReplies.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <MessageSquare className="mx-auto h-8 w-8 mb-2" />
            <p className="text-sm">Nenhuma resposta rápida encontrada</p>
          </div>
        ) : (
          filteredReplies.map((reply, index) => (
            <Button
              key={reply.id}
              variant="ghost"
              className={cn(
                "w-full justify-start p-3 h-auto text-left hover:bg-gray-50 dark:hover:bg-gray-700",
                index === selectedIndex && "bg-blue-50 dark:bg-blue-900/20"
              )}
              onClick={() => onSelect(reply.content)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-sm truncate">{reply.title}</h4>
                  {reply.shortcut && (
                    <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {reply.shortcut}
                    </span>
                  )}
                  {reply.category && (
                    <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {reply.category}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  {reply.content}
                </p>
              </div>
            </Button>
          ))
        )}
      </div>

      <div className="p-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 bg-gray-50 dark:bg-gray-800">
        Use ↑↓ para navegar, Enter para selecionar, Esc para fechar
      </div>
    </div>
  );
}