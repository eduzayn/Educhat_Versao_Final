import { Button } from "@/shared/ui/button";
import { useQuery } from "@tanstack/react-query";
import type { QuickReply } from "@shared/schema";

interface QuickReplyChipsProps {
  onSelect: (reply: string) => void;
}

export function QuickReplyChips({ onSelect }: QuickReplyChipsProps) {
  // Buscar respostas rápidas mais usadas
  const { data: quickReplies = [] } = useQuery<QuickReply[]>({
    queryKey: ['/api/quick-replies/most-used'],
    queryFn: async () => {
      const response = await fetch('/api/quick-replies/most-used?limit=5');
      if (!response.ok) throw new Error('Falha ao carregar respostas rápidas');
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Respostas padrão caso não haja dados
  const defaultReplies = [
    "Obrigado pelo contato!",
    "Posso te ajudar com mais alguma coisa?",
    "Agende uma conversa",
  ];

  const repliesToShow = quickReplies.length > 0 
    ? quickReplies.slice(0, 3).map(qr => qr.content || qr.title)
    : defaultReplies;

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {repliesToShow.map((reply, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          onClick={() => onSelect(reply)}
          className="text-xs rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 border-0 transition-colors"
        >
          {reply}
        </Button>
      ))}
    </div>
  );
}