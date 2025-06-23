import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2 } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { formatAudioTime } from "@/shared/lib/utils/formatters";
import AudioMessageWithRetry from './AudioMessageWithRetry';

interface AudioMessageProps {
  audioUrl: string | null;
  duration?: number;
  isFromContact: boolean;
  messageIdForFetch?: string;
  messageId?: number;
  content?: string;
  metadata?: any;
  zapiStatus?: string;
}

export function AudioMessage({
  audioUrl,
  duration,
  isFromContact,
  messageIdForFetch,
  messageId,
  content,
  metadata,
  zapiStatus,
}: AudioMessageProps) {
  
  // Usar componente otimizado para mensagens com retry ou em estado de envio
  if (messageId && (metadata?.canRetry || zapiStatus === 'FAILED' || zapiStatus === 'SENDING')) {
    return (
      <AudioMessageWithRetry
        messageId={messageId}
        content={content || '🎵 Áudio enviado'}
        metadata={metadata || {}}
        zapiStatus={zapiStatus as any}
      />
    );
  }
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(
    duration || (metadata as any)?.audio?.duration || (metadata as any)?.audio?.seconds || 0
  );
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
      setError("Áudio enviado via WhatsApp");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/messages/${messageIdForFetch}/audio`);

      if (!response.ok) {
        throw new Error("Áudio não encontrado");
      }

      // Resposta é o próprio arquivo de áudio (blob)
      const blob = await response.blob();
      if (blob.size > 0) {
        const audioUrl = URL.createObjectURL(blob);
        setFetchedAudioUrl(audioUrl);
        return true;
      } else {
        throw new Error("Arquivo de áudio vazio");
      }
    } catch (err) {
      console.error("Erro ao buscar áudio:", err);
      sessionStorage.setItem(failedKey, "true");
      setError("Áudio enviado via WhatsApp");
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
    if (audioRef.current && audioRef.current.duration) {
      setAudioDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const progressPercentage =
    audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

  // Para áudios do Z-API com URL externa válida
  if (audioUrl && audioUrl.startsWith('https://')) {
    return (
      <div
        className={`flex items-center gap-4 p-4 rounded-xl min-w-[280px] max-w-md ${
          isFromContact ? "bg-gray-200 text-gray-800" : "bg-blue-600 text-white"
        }`}
      >
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          preload="metadata"
          crossOrigin="anonymous"
        />

        <button
          onClick={togglePlayPause}
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isFromContact ? "bg-gray-400 hover:bg-gray-500" : "bg-blue-500 hover:bg-blue-400"
          } transition-colors`}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-5 h-5 text-white" />
          ) : (
            <Play className="w-5 h-5 text-white ml-0.5" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Volume2 className="w-4 h-4 opacity-80" />
            <span className="text-sm opacity-90 font-medium">
              Mensagem de áudio
            </span>
            {audioDuration > 0 && (
              <span className="text-xs opacity-75">
                {Math.floor(audioDuration / 60)}:{Math.floor(audioDuration % 60).toString().padStart(2, '0')}
              </span>
            )}
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
          
          <div className="flex justify-between text-xs opacity-75 mt-1">
            <span>{Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}</span>
            <span>{Math.floor(audioDuration / 60)}:{Math.floor(audioDuration % 60).toString().padStart(2, '0')}</span>
          </div>
        </div>
      </div>
    );
  }

  // Para áudios que não podem ser reproduzidos
  if (error === "Áudio enviado via WhatsApp" || (!fetchedAudioUrl && !audioUrl && messageIdForFetch)) {
    return (
      <div
        className={`flex items-center gap-4 p-4 rounded-xl min-w-[280px] max-w-md ${
          isFromContact ? "bg-gray-200 text-gray-800" : "bg-blue-600 text-white"
        }`}
      >
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          isFromContact ? "bg-gray-300" : "bg-blue-500"
        }`}>
          <Volume2 className="w-5 h-5 opacity-80" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Volume2 className="w-4 h-4 opacity-80" />
            <span className="text-sm opacity-90 font-medium">
              🎵 Áudio enviado
            </span>
          </div>
          <p className="text-xs opacity-75">
            Via WhatsApp
          </p>
        </div>
      </div>
    );
  }

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
        disabled={isLoading || !!error}
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
              {isLoading ? "Carregando..." : "Áudio"}
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
