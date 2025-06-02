import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2 } from "lucide-react";
import { Button } from "@/shared/ui/ui/button";

interface AudioMessageProps {
  audioUrl: string | null;
  duration?: number;
  isFromContact: boolean;
  messageIdForFetch?: string;
}

export function AudioMessage({ audioUrl, duration, isFromContact, messageIdForFetch }: AudioMessageProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [fetchedAudioUrl, setFetchedAudioUrl] = useState<string | null>(audioUrl);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Função para buscar áudio via API
  const fetchAudioContent = async () => {
    if (!messageIdForFetch || isLoadingAudio) return;
    
    setIsLoadingAudio(true);
    setAudioError(null);
    
    try {
      console.log('🔍 Buscando conteúdo do áudio via API para messageId:', messageIdForFetch);
      
      const response = await fetch(`/api/messages/${messageIdForFetch}/audio`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Áudio carregado com sucesso via API');
        setFetchedAudioUrl(data.audioUrl);
      } else {
        const errorData = await response.json();
        console.error('❌ Erro ao buscar áudio:', errorData);
        setAudioError(errorData.error || 'Erro ao carregar áudio');
      }
    } catch (error) {
      console.error('💥 Erro na requisição de áudio:', error);
      setAudioError('Erro de conexão ao carregar áudio');
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const togglePlayPause = async () => {
    // Se não temos URL de áudio e temos messageId para buscar, fazer o fetch primeiro
    if (!fetchedAudioUrl && messageIdForFetch && !isLoadingAudio) {
      await fetchAudioContent();
      return;
    }
    
    // Se não há URL de áudio disponível, não fazer nada
    if (!fetchedAudioUrl) {
      console.error('Nenhuma URL de áudio disponível');
      return;
    }
    
    // Se o elemento de áudio não está carregado, carregar primeiro
    if (!isLoaded) {
      console.log('Carregando elemento de áudio...');
      setIsLoaded(true);
      // Aguardar um pouco para o elemento ser criado
      setTimeout(() => {
        if (audioRef.current) {
          togglePlayPause();
        }
      }, 100);
      return;
    }
    
    if (!audioRef.current) {
      console.error('Elemento de áudio não encontrado');
      return;
    }
    
    try {
      if (isPlaying) {
        console.log('Pausando áudio');
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        console.log('Reproduzindo áudio:', {
          url: fetchedAudioUrl,
          currentSrc: audioRef.current.src,
          readyState: audioRef.current.readyState,
          networkState: audioRef.current.networkState,
          duration: audioRef.current.duration
        });
        
        try {
          await audioRef.current.play();
          setIsPlaying(true);
          console.log('Áudio iniciado com sucesso');
        } catch (playError) {
          console.error('Erro específico do play:', playError);
          setAudioError('Erro ao iniciar reprodução');
        }
      }
    } catch (error) {
      console.error('Erro ao reproduzir áudio:', error);
      setAudioError('Erro ao reproduzir áudio');
    }
  };

  // Effect para definir a URL quando o áudio for carregado via fetch
  useEffect(() => {
    if (fetchedAudioUrl && !audioUrl) {
      setIsLoaded(true);
    }
  }, [fetchedAudioUrl, audioUrl]);

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

  const handleCanPlay = () => {
    // Áudio está pronto para reprodução
    console.log('Áudio carregado e pronto para reprodução');
  };

  const handleError = (error: any) => {
    console.error('Erro ao carregar áudio:', error);
    console.error('Detalhes do erro:', {
      audioUrl: fetchedAudioUrl,
      errorType: error.type,
      errorTarget: error.target,
      networkState: error.target?.networkState,
      readyState: error.target?.readyState,
      errorCode: error.target?.error?.code,
      errorMessage: error.target?.error?.message
    });
    setIsLoaded(false);
    setAudioError('Erro ao reproduzir áudio');
  };

  const progressPercentage = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg max-w-sm ${
      isFromContact 
        ? 'bg-gray-100 text-gray-900' 
        : 'bg-blue-600 text-white'
    }`}>
      {isLoaded && fetchedAudioUrl && (
        <audio
          ref={audioRef}
          src={fetchedAudioUrl || undefined}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          onCanPlay={handleCanPlay}
          onError={handleError}
          preload="metadata"
        />
      )}
      
      <Button
        variant="ghost"
        size="sm"
        onClick={togglePlayPause}
        className={`w-8 h-8 p-0 rounded-full ${
          isFromContact
            ? 'hover:bg-gray-200 text-gray-700'
            : 'hover:bg-blue-500 text-white'
        }`}
      >
        {isLoaded && isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4" />
        )}
      </Button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Volume2 className="w-3 h-3 opacity-70" />
          <span className="text-xs opacity-70">
            {isLoadingAudio ? 'Carregando áudio...' : 
             audioError ? 'Erro ao carregar' :
             isLoaded ? 'Áudio' : 'Clique para carregar áudio'}
          </span>
        </div>
        
        <div className="relative">
          <div className={`w-full h-1 rounded-full ${
            isFromContact ? 'bg-gray-300' : 'bg-blue-400'
          }`}>
            <div
              className={`h-full rounded-full transition-all duration-100 ${
                isFromContact ? 'bg-gray-600' : 'bg-white'
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