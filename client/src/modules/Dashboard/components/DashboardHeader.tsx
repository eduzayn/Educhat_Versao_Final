import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';

interface SearchResult {
  id: number;
  type: 'conversation' | 'contact';
  title: string;
  subtitle?: string;
  channel?: string;
  lastActivity?: string;
}

export function DashboardHeader() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [, setLocation] = useLocation();
  const searchRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Buscar resultados quando há query
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['/api/search', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`);
      if (!response.ok) throw new Error('Erro na busca');
      return response.json();
    },
    enabled: searchQuery.trim().length >= 2,
    staleTime: 30000, // 30 segundos
  });

  // Fechar resultados ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current && 
        resultsRef.current &&
        !searchRef.current.contains(event.target as Node) &&
        !resultsRef.current.contains(event.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSelect = (result: SearchResult) => {
    if (result.type === 'conversation') {
      setLocation('/inbox');
    } else if (result.type === 'contact') {
      setLocation('/contacts');
    }
    
    setSearchQuery('');
    setIsSearchFocused(false);
    searchRef.current?.blur();
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsSearchFocused(false);
    searchRef.current?.focus();
  };

  const showResults = isSearchFocused && searchQuery.trim().length >= 2;

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 relative z-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Buscar conversas, contatos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              className="pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-educhat-primary focus:border-educhat-primary w-96"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            
            {/* Resultados da busca */}
            {showResults && (
              <div 
                ref={resultsRef}
                className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50"
              >
                {isLoading ? (
                  <div className="p-4 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-educhat-primary mx-auto mb-2"></div>
                    Buscando...
                  </div>
                ) : searchResults && searchResults.length > 0 ? (
                  <div className="py-2">
                    {searchResults.map((result: SearchResult) => (
                      <button
                        key={`${result.type}-${result.id}`}
                        onClick={() => handleSearchSelect(result)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">{result.title}</div>
                            {result.subtitle && (
                              <div className="text-xs text-gray-500 mt-1">{result.subtitle}</div>
                            )}
                          </div>
                          <div className="flex flex-col items-end text-xs text-gray-400">
                            <span className="capitalize">{result.type === 'conversation' ? 'Conversa' : 'Contato'}</span>
                            {result.channel && (
                              <span className="text-educhat-primary">{result.channel}</span>
                            )}
                            {result.lastActivity && (
                              <span>{result.lastActivity}</span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : searchQuery.trim().length >= 2 ? (
                  <div className="p-4 text-center text-gray-500">
                    Nenhum resultado encontrado para "{searchQuery}"
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <NotificationDropdown />
        </div>
      </div>
    </header>
  );
} 