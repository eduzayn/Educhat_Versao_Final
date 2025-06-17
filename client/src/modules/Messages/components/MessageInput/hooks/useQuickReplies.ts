import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

export interface QuickReply {
  id: number;
  title: string;
  content: string;
  type: string;
  shortcut?: string;
  category?: string;
  isActive: boolean;
}

export function useQuickReplies() {
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  // Buscar respostas rápidas do usuário
  const { data: quickReplies = [] } = useQuery({
    queryKey: ['/api/quick-replies/my-replies'],
    queryFn: async () => {
      const response = await fetch('/api/quick-replies/my-replies');
      if (!response.ok) throw new Error('Failed to fetch quick replies');
      return response.json() as Promise<QuickReply[]>;
    },
  });

  // Filtrar respostas rápidas ativas baseado na busca
  const filteredQuickReplies = quickReplies.filter((qr: QuickReply) => {
    if (!qr.isActive) return false;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        qr.title.toLowerCase().includes(query) ||
        (qr.content || '').toLowerCase().includes(query) ||
        (qr.shortcut || '').toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  const handleQuickReplyDetection = (message: string) => {
    if (message.startsWith('/') && message.length > 1) {
      const query = message.slice(1); // Remove a barra
      setSearchQuery(query);
      setShowQuickReplies(true);
      setSelectedIndex(0);
    } else {
      setShowQuickReplies(false);
      setSearchQuery('');
    }
  };

  const handleKeyNavigation = (e: React.KeyboardEvent) => {
    if (!showQuickReplies || filteredQuickReplies.length === 0) return false;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => 
        prev < filteredQuickReplies.length - 1 ? prev + 1 : 0
      );
      return true;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => 
        prev > 0 ? prev - 1 : filteredQuickReplies.length - 1
      );
      return true;
    } else if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault();
      const selectedReply = filteredQuickReplies[selectedIndex];
      if (selectedReply) {
        return selectedReply;
      }
    } else if (e.key === 'Escape') {
      setShowQuickReplies(false);
      setSearchQuery('');
      return true;
    }

    return false;
  };

  const selectQuickReply = (quickReply: QuickReply) => {
    setShowQuickReplies(false);
    setSearchQuery('');
    return quickReply;
  };

  const hideQuickReplies = () => {
    setShowQuickReplies(false);
    setSearchQuery('');
  };

  return {
    showQuickReplies,
    filteredQuickReplies,
    selectedIndex,
    handleQuickReplyDetection,
    handleKeyNavigation,
    selectQuickReply,
    hideQuickReplies,
  };
}