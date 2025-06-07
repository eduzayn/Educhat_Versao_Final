import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2 } from "lucide-react";
import { Button } from "@/shared/ui/ui/button";
import { secureLog } from "@/lib/secureLogger";

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
  const [actualAudioUrl, setActualAudioUrl] = useState<string | null>(audioUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Buscar áudio via API se necessário (apenas uma vez, com cache de falhas)
  useEffect(() => {
    if (
      !audioUrl &&
      messageIdForFetch &&
      !actualAudioUrl &&
      !isLoading &&
      !error
    ) {
      // Verificar se já tentamos buscar este áudio e falhou
      const failedKey = `audio_failed_${messageIdForFetch}`;
      if (sessionStorage.getItem(failedKey)) {
        setError("Áudio não disponível");
        return;
      }

      setIsLoading(true);
      secureLog.audio("Buscando via API", messageIdForFetch);

      fetch(`/api/messages/${messageIdForFetch}/audio`)
        .then((response) => {
          if (!response.ok) {
            throw new Error("Áudio não encontrado");
          }
          return response.json();
        })
        .then((data) => {
          if (data.audioUrl) {
            setActualAudioUrl(data.audioUrl);
            secureLog.audio("Carregado com sucesso", messageIdForFetch);
          } else {
            throw new Error("Áudio não encontrado");
          }
        })
        .catch(() => {
          sessionStorage.setItem(failedKey, "true");
          setError("Áudio não disponível");
          secureLog.error("Falha ao carregar áudio", {
            messageId: messageIdForFetch,
          });
        })
        .finally(() => setIsLoading(false));
    }
  }, [audioUrl, messageIdForFetch, actualAudioUrl, isLoading, error]);

  const togglePlayPause = async () => {
    if (!actualAudioUrl || !audioRef.current) {
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
      className={`flex items-center gap-3 p-3 rounded-lg max-w-sm ${
        isFromContact ? "bg-gray-100 text-gray-900" : "bg-blue-600 text-white"
      }`}
    >
      {actualAudioUrl && (
        <audio
          ref={audioRef}
          src={actualAudioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          preload="metadata"
        />
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={togglePlayPause}
        disabled={isLoading}
        className={`w-8 h-8 p-0 rounded-full ${
          isFromContact
            ? "hover:bg-gray-200 text-gray-700"
            : "hover:bg-blue-500 text-white"
        }`}
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4" />
        )}
      </Button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Volume2 className="w-3 h-3 opacity-70" />
          <span className="text-xs opacity-70">
            {isLoading
              ? "Carregando..."
              : error
                ? error
                : actualAudioUrl
                  ? "Áudio"
                  : "Processando..."}
          </span>
        </div>

        <div className="relative">
          <div
            className={`w-full h-1 rounded-full ${
              isFromContact ? "bg-gray-300" : "bg-blue-400"
            }`}
          >
            <div
              className={`h-full rounded-full transition-all duration-100 ${
                isFromContact ? "bg-gray-600" : "bg-white"
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        <div className="flex justify-between text-xs opacity-70 mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(audioDuration)}</span>
        </div>
      </div>
    </div>
  );
}
