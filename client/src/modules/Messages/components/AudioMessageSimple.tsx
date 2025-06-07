import { useState, useRef, useEffect } from 'react';
import { Button } from '@/shared/ui/ui/button';
import { Play, Pause, Volume2 } from 'lucide-react';

interface AudioMessageSimpleProps {
  audioUrl: string | null;
  duration?: number;
  isFromContact: boolean;
  messageIdForFetch?: string;
}

export function AudioMessageSimple({ audioUrl, duration, isFromContact, messageIdForFetch }: AudioMessageSimpleProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const [fetchedAudioUrl, setFetchedAudioUrl] = useState<string | null>(audioUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const fetchAudio = async () => {
    if (!messageIdForFetch || isLoading || fetchedAudioUrl) return false;
    
    setIsLoading(true);
    setError(null);

    try {
      console.log('🎧 Áudio: Buscando áudio para mensagem', messageIdForFetch);
      const response = await fetch(`/api/messages/${messageIdForFetch}/audio`);
      const data = await response.json();

      if (data.success && data.audioUrl) {
        console.log('✅ Áudio: URL obtida com sucesso');
        setFetchedAudioUrl(data.audioUrl);
        return true;
      } else {
        console.log('❌ Áudio: Não disponível');
        setError('Áudio não disponível');
        return false;
      }
    } catch (err) {
      console.log('❌ Áudio: Erro de conexão', err);
      setError('Erro de conexão');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayPause = async () => {
    console.log('🎧 Áudio: Clique no botão play/pause');
    
    // Se não temos URL e temos ID para buscar, buscar primeiro
    if (!fetchedAudioUrl && messageIdForFetch) {
      console.log('🎧 Áudio: Buscando URL primeiro...');
      const success = await fetchAudio();
      if (!success) {
        console.log('❌ Áudio: Falha ao buscar URL');
        return;
      }
      
      // Aguardar o próximo frame para garantir que o áudio foi carregado
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Tentar reproduzir novamente
      if (audioRef.current && fetchedAudioUrl) {
        try {
          console.log('🎧 Áudio: Tentando reproduzir após fetch...');
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (err) {
          console.log('❌ Áudio: Erro na reprodução após fetch', err);
          setError('Erro na reprodução');
        }
      }
      return;
    }

    if (!fetchedAudioUrl || !audioRef.current) {
      console.log('❌ Áudio: URL ou ref não disponível');
      return;
    }

    try {
      if (isPlaying) {
        console.log('⏸️ Áudio: Pausando...');
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        console.log('▶️ Áudio: Reproduzindo...');
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.log('❌ Áudio: Erro na reprodução', err);
      setError('Erro na reprodução');
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
    <div className={`flex items-center gap-3 p-3 rounded-lg max-w-sm ${
      isFromContact 
        ? 'bg-gray-100 text-gray-900' 
        : 'bg-blue-600 text-white'
    }`}>
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
        className={`w-8 h-8 p-0 rounded-full ${
          isFromContact
            ? 'hover:bg-gray-200 text-gray-700'
            : 'hover:bg-blue-500 text-white'
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
            {isLoading ? 'Carregando...' : 
             error ? error :
             'Áudio'}
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