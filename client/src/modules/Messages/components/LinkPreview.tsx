import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { ExternalLink, Loader2 } from 'lucide-react';

interface LinkPreviewProps {
  url: string;
  className?: string;
}

interface LinkContent {
  title?: string;
  summary: string;
  citations?: string[];
  error?: string;
}

export function LinkPreview({ url, className = '' }: LinkPreviewProps) {
  const [content, setContent] = useState<LinkContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchLinkContent = async () => {
    if (hasLoaded || isLoading) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/links/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error('Falha ao analisar link');
      }

      const data = await response.json();
      setContent(data);
      setHasLoaded(true);
    } catch (error) {
      setContent({
        summary: 'Não foi possível carregar o conteúdo do link.',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      setHasLoaded(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Carregar automaticamente o conteúdo quando o componente é montado
    if (!hasLoaded && !isLoading) {
      fetchLinkContent();
    }
  }, [hasLoaded, isLoading]);

  return (
    <div className={`mt-2 ${className}`}>
      <Card className="border-border/40">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            <span className="truncate">
              {content?.title || new URL(url).hostname}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation();
                window.open(url, '_blank', 'noopener,noreferrer');
              }}
            >
              <ExternalLink className="w-3 h-3" />
            </Button>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Analisando conteúdo...
            </div>
          ) : content ? (
            <div className="space-y-2">
              <p className="text-sm text-foreground leading-relaxed">
                {content.summary}
              </p>
              
              {content.citations && content.citations.length > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground mb-1">
                    Fontes utilizadas:
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {content.citations.slice(0, 3).map((citation, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="text-xs cursor-pointer hover:bg-muted"
                        onClick={() => window.open(citation, '_blank', 'noopener,noreferrer')}
                      >
                        {new URL(citation).hostname}
                      </Badge>
                    ))}
                    {content.citations.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{content.citations.length - 3} mais
                      </Badge>
                    )}
                  </div>
                </div>
              )}
              
              {content.error && (
                <div className="text-xs text-destructive">
                  {content.error}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Carregando conteúdo...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}