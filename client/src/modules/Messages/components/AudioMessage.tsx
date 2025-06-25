import { useState, useRef, useEffect } from "react";
import { Play, Pause, Download } from "lucide-react";
import { Button } from "@/shared/ui/button";

interface AudioMessageProps {
  audioUrl: string | null;
  duration?: number;
  isFromContact: boolean;
  messageIdForFetch?: string;
}

export function AudioMessage({
  audioUrl,
  duration,
  isFromContact,
  messageIdForFetch,
}: AudioMessageProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const [fetchedAudioUrl, setFetchedAudioUrl] = useState<string | null>(audioUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);





  // Cache de falhas para evitar requisições repetidas
  const getCacheKey = (messageId: string) => `audio_failed_${messageId}`;

  // Buscar áudio via API com cache de falhas
  const fetchAudio = async (): Promise<boolean> => {
    if (!messageIdForFetch || isLoading || fetchedAudioUrl) return false;
    
    // Verificar cache de falhas
    const failedKey = getCacheKey(messageIdForFetch);
    if (sessionStorage.getItem(failedKey)) {
      setError("Áudio não disponível");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/messages/${messageIdForFetch}/audio`);
      
      if (!response.ok) {
        throw new Error("Áudio não encontrado");
      }

      const data = await response.json();

      if (data.success && data.audioUrl) {
        setFetchedAudioUrl(data.audioUrl);
        return true;
      } else if (data.audioUrl) {
        // Fallback para formato antigo da API
        setFetchedAudioUrl(data.audioUrl);
        return true;
      } else {
        throw new Error("Áudio não disponível");
      }
    } catch (err) {
      console.error("Erro ao buscar áudio:", err);
      sessionStorage.setItem(failedKey, "true");
      setError("Áudio não disponível");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Inicializar áudio se necessário
  useEffect(() => {
    if (!audioUrl && messageIdForFetch && !fetchedAudioUrl && !isLoading && !error) {
      fetchAudio();
    }
  }, [audioUrl, messageIdForFetch, fetchedAudioUrl, isLoading, error]);

  const handlePlayPause = async () => {
    // Se não temos URL e temos ID para buscar, buscar primeiro
    if (!fetchedAudioUrl && messageIdForFetch) {
      const success = await fetchAudio();
      if (!success) return;
      
      // Aguardar carregamento
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (!fetchedAudioUrl || !audioRef.current) {
      setError("Áudio não disponível");
      return;
    }

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
        setError(null);
      }
    } catch (err) {
      console.error("Erro na reprodução:", err);
      setError("Erro ao reproduzir áudio");
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const progressPercentage = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

  return (
    <div className="bg-blue-100 text-blue-800 rounded-xl p-3 w-full max-w-xs md:max-w-sm flex items-center gap-4 shadow-sm">
      {fetchedAudioUrl && (
        <audio
          ref={audioRef}
          src={fetchedAudioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          preload="metadata"
        />
      )}

      <Button
        size="icon"
        onClick={handlePlayPause}
        disabled={isLoading}
        className="h-10 w-10 rounded-full bg-blue-500 hover:bg-blue-600 text-white border-0 flex-shrink-0 transition-colors"
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : isPlaying ? (
          <Pause className="w-5 h-5" />
        ) : (
          <Play className="w-5 h-5" />
        )}
      </Button>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-blue-800 mb-1">
          {isLoading
            ? "Carregando..."
            : error
              ? error
              : "Áudio"}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-blue-600">
            {formatAudioTime(audioDuration)}
          </span>
          {fetchedAudioUrl && progressPercentage > 0 && (
            <div className="flex-1 bg-blue-200 rounded-full h-1">
              <div 
                className="bg-blue-500 h-1 rounded-full transition-all duration-300" 
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          )}
        </div>
      </div>
      
      {fetchedAudioUrl && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-blue-600 hover:text-blue-800 hover:bg-blue-200 flex-shrink-0"
          onClick={() => {
            const link = document.createElement('a');
            link.href = fetchedAudioUrl;
            link.download = `audio-${Date.now()}.mp3`;
            link.click();
          }}
        >
          <Download className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

// Função helper para formatar tempo de áudio
function formatAudioTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Exportar também como AudioMessageSimple para compatibilidade
export { AudioMessage as AudioMessageSimple };