import { Button } from "@/shared/ui/button";

const QUICK_REPLIES = [
  "Obrigado pelo contato!",
  "Posso te ajudar com mais alguma coisa?",
  "Agende uma conversa",
];

interface QuickReplyChipsProps {
  onSelect: (reply: string) => void;
}

export function QuickReplyChips({ onSelect }: QuickReplyChipsProps) {
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {QUICK_REPLIES.map((reply, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          onClick={() => onSelect(reply)}
          className="text-xs rounded-full bg-gray-100 text-educhat-medium hover:bg-gray-200 border-0"
        >
          {reply}
        </Button>
      ))}
    </div>
  );
}