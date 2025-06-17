import { Badge } from "@/shared/ui/badge";
import { Zap, Mic, Image, Video, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuickReply } from "@shared/schema";

interface QuickReplyDropdownProps {
  visible: boolean;
  filteredReplies: QuickReply[];
  onSelect: (reply: QuickReply) => void;
  selectedIndex: number;
}

export function QuickReplyDropdown({
  visible,
  filteredReplies,
  onSelect,
  selectedIndex,
}: QuickReplyDropdownProps) {
  if (!visible || filteredReplies.length === 0) return null;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'text':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'audio':
        return <Mic className="w-4 h-4 text-green-600" />;
      case 'image':
        return <Image className="w-4 h-4 text-purple-600" />;
      case 'video':
        return <Video className="w-4 h-4 text-red-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'text':
        return 'Texto';
      case 'audio':
        return 'Áudio';
      case 'image':
        return 'Imagem';
      case 'video':
        return 'Vídeo';
      default:
        return 'Documento';
    }
  };

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
      {filteredReplies.map((reply, index) => (
        <div
          key={reply.id}
          className={cn(
            "px-3 py-2 cursor-pointer border-b border-gray-50 last:border-b-0 hover:bg-blue-50 transition-colors",
            index === selectedIndex && "bg-blue-100 border-blue-200",
          )}
          onClick={() => onSelect(reply)}
        >
          <div className="flex items-center gap-2">
            {getTypeIcon(reply.type)}
            <span className="font-medium text-gray-900 text-sm flex-1 truncate">
              {reply.title}
            </span>
            {reply.type !== "text" && (
              <span className="text-xs text-gray-500 px-1 py-0.5 bg-gray-100 rounded">
                {getTypeLabel(reply.type)}
              </span>
            )}
          </div>
          
          {reply.type === "text" && reply.content && (
            <p className="text-xs text-gray-600 mt-1 truncate">
              {reply.content}
            </p>
          )}
          
          {reply.type !== "text" && reply.additionalText && (
            <p className="text-xs text-gray-600 mt-1 truncate">
              {reply.additionalText}
            </p>
          )}
        </div>
      ))}
      
      {filteredReplies.length > 5 && (
        <div className="px-3 py-1 bg-gray-50 text-xs text-gray-500 border-t border-gray-100 text-center">
          Use ↑↓ para navegar
        </div>
      )}
    </div>
  );
}