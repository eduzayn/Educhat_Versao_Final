import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/shared/ui/button';
import { Play, Pause, Download, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDurationSeconds } from '@/shared/lib/utils/formatters';

interface AudioMessageWithRetryProps {
  messageId: number;
  content: string;
  metadata: {
    mimeType?: string;
    audioSize?: number;
    duration?: number;
    zaapId?: string;
    messageId?: string;
    error?: string;
    canRetry?: boolean;
    isOptimistic?: boolean;
  };
  zapiStatus?: 'SENDING' | 'SENT' | 'FAILED' | 'RECEIVED';
  onRetry?: () => void;
  className?: string;
}

export function AudioMessageWithRetry({
  messageId,
  content,
  metadata,
  zapiStatus,
  onRetry,
  className
}: AudioMessageWithRetryProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const duration = metadata?.duration || 0;
  const canRetry = metadata?.canRetry && zapiStatus === 'FAILED';
  const isOptimistic = metadata?.isOptimistic || zapiStatus === 'SENDING';

  // Carregar áudio progressivamente
  useEffect(() => {
    if (!metadata?.zaapId && !isOptimistic) {
      loadAudioContent();
    }
  }, [messageId, metadata?.zaapId]);

  const loadAudioContent = async () => {
    if (loading || audioUrl) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/messages/${messageId}/audio`, {
        method: 'GET',
        headers: { 'Accept': 'audio/*' }
      });

      if (!response.ok) {
        throw new Error(`Erro ao carregar áudio: ${response.status}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleDownload = () => {
    if (audioUrl) {
      const a = document.createElement('a');
      a.href = audioUrl;
      a.download = `audio_${messageId}.${metadata?.mimeType?.split('/')[1] || 'webm'}`;
      a.click();
    }
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      // Fallback: recarregar áudio
      setAudioUrl(null);
      setError(null);
      loadAudioContent();
    }
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  return (
    <div className={cn(
      "flex items-center space-x-3 p-3 rounded-lg border max-w-sm",
      isOptimistic && "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
      zapiStatus === 'FAILED' && "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
      zapiStatus === 'SENT' && "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700",
      className
    )}>
      {/* Player de áudio invisível */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onEnded={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          preload="metadata"
        />
      )}

      {/* Status visual */}
      <div className="flex items-center space-x-2 min-w-0">
        {/* Botão Play/Pause ou Loading */}
        {loading ? (
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        ) : error || zapiStatus === 'FAILED' ? (
          <AlertCircle className="w-8 h-8 text-red-500" />
        ) : isOptimistic ? (
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={togglePlayback}
            disabled={!audioUrl}
            className="h-8 w-8 p-0 rounded-full"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>
        )}

        {/* Informações do áudio */}
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium truncate">
              {isOptimistic ? 'Enviando áudio...' : 
               zapiStatus === 'FAILED' ? 'Falha no envio' :
               error ? 'Erro ao carregar' : 
               'Mensagem de áudio'}
            </span>
            {duration > 0 && (
              <span className="text-xs text-gray-500 flex-shrink-0">
                {formatDurationSeconds(duration)}
              </span>
            )}
          </div>
          
          {/* Barra de progresso */}
          {audioUrl && duration > 0 && (
            <div className="w-full h-1 bg-gray-200 dark:bg-gray-600 rounded overflow-hidden mt-1">
              <div
                className="h-full bg-blue-500 transition-all duration-100"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
            </div>
          )}
          
          {/* Metadata adicional */}
          {metadata?.audioSize && (
            <span className="text-xs text-gray-400 mt-1">
              {(metadata.audioSize / 1024).toFixed(1)} KB
            </span>
          )}
        </div>
      </div>

      {/* Ações */}
      <div className="flex items-center space-x-1 flex-shrink-0">
        {/* Botão de retry */}
        {canRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            className="h-7 px-2"
            title="Tentar novamente"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
        )}
        
        {/* Botão de download */}
        {audioUrl && !isOptimistic && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="h-7 px-2"
            title="Baixar áudio"
          >
            <Download className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

export default AudioMessageWithRetry;