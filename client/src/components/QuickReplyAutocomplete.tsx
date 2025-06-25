import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Hash, Users, Globe } from 'lucide-react';
import { QuickReply } from '@shared/schema';
import { useSearchQuickReplies } from '@/shared/lib/hooks/useQuickReplies';

interface QuickReplyAutocompleteProps {
  searchTerm: string;
  onSelect: (quickReply: QuickReply) => void;
  onClose: () => void;
  position: { top: number; left: number };
}

export function QuickReplyAutocomplete({ 
  searchTerm, 
  onSelect, 
  onClose, 
  position 
}: QuickReplyAutocompleteProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  
  const { data: quickReplies = [], isLoading } = useSearchQuickReplies(searchTerm);

  // Reset selected index when search term changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchTerm]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!quickReplies.length) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < quickReplies.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
          break;
        case 'Enter':
          e.preventDefault();
          if (quickReplies[selectedIndex]) {
            onSelect(quickReplies[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [quickReplies, selectedIndex, onSelect, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && quickReplies.length > 0) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, quickReplies.length]);

  if (isLoading) {
    return (
      <div 
        className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[300px]"
        style={{ top: position.top, left: position.left }}
      >
        <div className="text-sm text-gray-500">Buscando respostas rápidas...</div>
      </div>
    );
  }

  if (!quickReplies.length) {
    return (
      <div 
        className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[300px]"
        style={{ top: position.top, left: position.left }}
      >
        <div className="text-sm text-gray-500">
          Nenhuma resposta rápida encontrada para "{searchTerm}"
        </div>
      </div>
    );
  }

  const getScopeIcon = (scope: string) => {
    switch (scope) {
      case 'global': return <Globe className="h-3 w-3 text-blue-500" />;
      case 'team': return <Users className="h-3 w-3 text-green-500" />;
      default: return <Hash className="h-3 w-3 text-gray-400" />;
    }
  };

  return (
    <div 
      className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-h-[300px] overflow-y-auto min-w-[350px]"
      style={{ top: position.top, left: position.left }}
      ref={listRef}
    >
      <div className="p-2 border-b bg-gray-50 text-xs text-gray-600">
        Respostas Rápidas ({quickReplies.length}) - Use ↑↓ para navegar, Enter para selecionar
      </div>
      
      {quickReplies.map((quickReply, index) => (
        <div
          key={quickReply.id}
          className={`p-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-50 ${
            index === selectedIndex ? 'bg-blue-50 border-blue-200' : ''
          }`}
          onClick={() => onSelect(quickReply)}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <div className="font-medium text-sm truncate">{quickReply.title}</div>
                {getScopeIcon(quickReply.shareScope || 'personal')}
              </div>
              
              <div className="text-xs text-gray-600 line-clamp-2">
                {quickReply.content}
              </div>
              
              {quickReply.category && (
                <div className="mt-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                    {quickReply.category}
                  </span>
                </div>
              )}
            </div>
            
            {quickReply.usageCount && quickReply.usageCount > 0 && (
              <div className="text-xs text-gray-400 flex-shrink-0">
                {quickReply.usageCount} usos
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}