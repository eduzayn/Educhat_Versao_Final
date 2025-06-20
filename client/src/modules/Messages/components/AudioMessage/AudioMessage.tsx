import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { formatAudioTime } from "@/shared/lib/utils/formatters";

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
  const [fetchedAudioUrl, setFetchedAudioUrl] = useState<string | null>(
    audioUrl,
  );
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
    if (
      !audioUrl &&
      messageIdForFetch &&
      !fetchedAudioUrl &&
      !isLoading &&
      !error
    ) {
      fetchAudio();
    }
  }, [audioUrl, messageIdForFetch, fetchedAudioUrl, isLoading, error]);

  const handlePlayPause = async () => {
    // Se não temos URL e temos ID para buscar, buscar primeiro
    if (!fetchedAudioUrl && messageIdForFetch) {
      const success = await fetchAudio();
      if (!success) return;

      // Aguardar carregamento
      await new Promise((resolve) => setTimeout(resolve, 100));
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

  const progressPercentage =
    audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-xl min-w-[280px] max-w-md ${
        isFromContact ? "bg-gray-200 text-gray-800" : "bg-blue-600 text-white"
      }`}
    >
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
        variant="ghost"
        size="sm"
        onClick={handlePlayPause}
        disabled={isLoading}
        className={`w-10 h-10 p-0 rounded-full ${
          isFromContact
            ? "hover:bg-gray-300 text-gray-700"
            : "hover:bg-blue-500 text-white"
        }`}
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : isPlaying ? (
          <Pause className="w-5 h-5" />
        ) : (
          <Play className="w-5 h-5 ml-0.5" />
        )}
      </Button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 opacity-80" />
            <span className="text-sm opacity-90 font-medium">
              {isLoading ? "Carregando..." : error ? error : "Áudio"}
            </span>
          </div>
          <span className="text-sm opacity-80 font-mono">
            {formatAudioTime(audioDuration)}
          </span>
        </div>

        <div className="relative">
          <div
            className={`w-full h-2 rounded-full ${
              isFromContact ? "bg-gray-400" : "bg-blue-400"
            }`}
          >
            <div
              className={`h-full rounded-full transition-all duration-200 ${
                isFromContact ? "bg-gray-700" : "bg-white"
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Exportar também como AudioMessageSimple para compatibilidade
export { AudioMessage as AudioMessageSimple };

export default AudioMessage;
