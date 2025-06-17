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
    <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
      <div className="p-2 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center text-sm text-gray-600">
          <Zap className="w-4 h-4 mr-2" />
          Respostas Rápidas ({filteredReplies.length})
        </div>
      </div>
      
      {filteredReplies.map((reply, index) => (
        <div
          key={reply.id}
          className={cn(
            "p-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors",
            index === selectedIndex && "bg-blue-50 border-blue-200",
          )}
          onClick={() => onSelect(reply)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {getTypeIcon(reply.type)}
                <span className="font-medium text-gray-900">
                  {reply.title}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {getTypeLabel(reply.type)}
                </Badge>
                {reply.category && reply.category !== 'general' && (
                  <Badge variant="outline" className="text-xs">
                    {reply.category}
                  </Badge>
                )}
              </div>
              
              {reply.description && (
                <p className="text-sm text-gray-600 mb-1">
                  {reply.description}
                </p>
              )}
              
              {reply.type === "text" && reply.content && (
                <p className="text-sm text-gray-800 bg-gray-100 p-2 rounded truncate max-w-xs">
                  {reply.content}
                </p>
              )}
              
              {reply.type === "audio" && (
                <div className="flex items-center text-sm text-green-600">
                  <Mic className="w-4 h-4 mr-1" />
                  Arquivo de áudio
                  {reply.additionalText && (
                    <span className="ml-2 text-gray-600">+ {reply.additionalText}</span>
                  )}
                </div>
              )}
              
              {reply.type === "image" && (
                <div className="flex items-center text-sm text-purple-600">
                  <Image className="w-4 h-4 mr-1" />
                  Arquivo de imagem
                  {reply.additionalText && (
                    <span className="ml-2 text-gray-600">+ {reply.additionalText}</span>
                  )}
                </div>
              )}
              
              {reply.type === "video" && (
                <div className="flex items-center text-sm text-red-600">
                  <Video className="w-4 h-4 mr-1" />
                  Arquivo de vídeo
                  {reply.additionalText && (
                    <span className="ml-2 text-gray-600">+ {reply.additionalText}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
      
      <div className="p-2 bg-gray-50 text-xs text-gray-500 border-t border-gray-100">
        Use ↑↓ para navegar, Enter/Tab para selecionar, Esc para fechar
      </div>
    </div>
  );
}