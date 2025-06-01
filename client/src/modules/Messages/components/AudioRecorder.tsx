import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, Send, RotateCcw } from 'lucide-react';
import { Button } from '@/shared/ui/ui/button';
import { cn } from '@/lib/utils';

type RecordingState = 'inactive' | 'recording' | 'preview';

interface AudioRecorderProps {
  onSendAudio: (audioBlob: Blob, duration: number) => void;
  onCancel: () => void;
  className?: string;
}

export function AudioRecorder({ onSendAudio, onCancel, className }: AudioRecorderProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>('inactive');
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const MAX_RECORDING_TIME = 300; // 5 minutos em segundos

  // Cleanup na desmontagem do componente
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const requestMicrophonePermission = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      streamRef.current = stream;
      setHasPermission(true);
      setPermissionError(null);
      return true;
    } catch (error) {
      setHasPermission(false);
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          setPermissionError('Permissão negada. Permita o acesso ao microfone nas configurações do navegador.');
        } else if (error.name === 'NotFoundError') {
          setPermissionError('Nenhum microfone foi encontrado. Verifique se há um microfone conectado.');
        } else {
          setPermissionError('Erro ao acessar o microfone. Verifique as configurações do navegador.');
        }
      }
      return false;
    }
  };

  const startRecording = async () => {
    const permissionGranted = await requestMicrophonePermission();
    if (!permissionGranted || !streamRef.current) return;

    try {
      // Limpar chunks anteriores
      audioChunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: 'audio/webm;codecs=opus' 
        });
        
        // Criar URL para preview
        if (audioUrlRef.current) {
          URL.revokeObjectURL(audioUrlRef.current);
        }
        audioUrlRef.current = URL.createObjectURL(audioBlob);
        
        // Parar o stream do microfone
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        
        setRecordingState('preview');
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setRecordingState('recording');
      setDuration(0);
      
      // Iniciar timer
      timerRef.current = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1;
          // Parar automaticamente ao atingir o limite
          if (newDuration >= MAX_RECORDING_TIME) {
            stopRecording();
          }
          return newDuration;
        });
      }, 1000);

    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      setPermissionError('Erro ao iniciar a gravação. Tente novamente.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const cancelRecording = () => {
    if (recordingState === 'recording') {
      stopRecording();
    }
    
    cleanup();
    setRecordingState('inactive');
    setDuration(0);
    setCurrentTime(0);
    setIsPlaying(false);
    onCancel();
  };

  const playPreview = () => {
    if (!audioUrlRef.current) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(audioUrlRef.current);
      
      audioRef.current.ontimeupdate = () => {
        if (audioRef.current) {
          setCurrentTime(Math.floor(audioRef.current.currentTime));
        }
      };

      audioRef.current.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };

      audioRef.current.onloadedmetadata = () => {
        if (audioRef.current) {
          setDuration(Math.floor(audioRef.current.duration));
        }
      };
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const sendAudio = () => {
    if (audioChunksRef.current.length > 0) {
      const audioBlob = new Blob(audioChunksRef.current, { 
        type: 'audio/webm;codecs=opus' 
      });
      onSendAudio(audioBlob, duration);
      cleanup();
      setRecordingState('inactive');
      setDuration(0);
      setCurrentTime(0);
      setIsPlaying(false);
    }
  };

  const retryRecording = () => {
    cleanup();
    setRecordingState('inactive');
    setDuration(0);
    setCurrentTime(0);
    setIsPlaying(false);
  };

  // Estado Inativo - mostrar apenas o ícone do microfone
  if (recordingState === 'inactive') {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={startRecording}
        className={cn("p-2 h-10 w-10 hover:bg-primary/10", className)}
        title="Gravar áudio"
      >
        <Mic className="w-5 h-5 text-gray-600" />
      </Button>
    );
  }

  // Estado de Gravação
  if (recordingState === 'recording') {
    return (
      <div className={cn("flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg", className)}>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Mic className="w-5 h-5 text-red-600" />
            <div className="absolute inset-0 bg-red-600 rounded-full animate-ping opacity-20" />
          </div>
          <span className="text-sm font-medium text-red-700">
            {formatTime(duration)}
            {duration >= MAX_RECORDING_TIME - 10 && (
              <span className="text-xs ml-1">
                (máx: {formatTime(MAX_RECORDING_TIME)})
              </span>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={cancelRecording}
            className="p-1 h-8 w-8 hover:bg-red-100"
            title="Cancelar gravação"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
          
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={stopRecording}
            className="px-3 h-8 bg-red-600 hover:bg-red-700"
            title="Parar gravação"
          >
            <Square className="w-4 h-4 mr-1" />
            Parar
          </Button>
        </div>
      </div>
    );
  }

  // Estado de Preview
  if (recordingState === 'preview') {
    return (
      <div className={cn("flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg", className)}>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={playPreview}
            className="p-1 h-8 w-8 hover:bg-blue-100"
            title={isPlaying ? "Pausar" : "Reproduzir"}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 text-blue-600" />
            ) : (
              <Play className="w-4 h-4 text-blue-600" />
            )}
          </Button>
          
          <div className="flex flex-col">
            <span className="text-sm font-medium text-blue-700">
              Áudio ({formatTime(duration)})
            </span>
            {isPlaying && (
              <div className="w-24 h-1 bg-blue-200 rounded-full mt-1">
                <div 
                  className="h-full bg-blue-600 rounded-full transition-all duration-100"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={retryRecording}
            className="p-1 h-8 w-8 hover:bg-blue-100"
            title="Gravar novamente"
          >
            <RotateCcw className="w-4 h-4 text-blue-600" />
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={cancelRecording}
            className="p-1 h-8 w-8 hover:bg-red-100"
            title="Descartar"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
          
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={sendAudio}
            className="px-3 h-8 bg-green-600 hover:bg-green-700"
            title="Enviar áudio"
          >
            <Send className="w-4 h-4 mr-1" />
            Enviar
          </Button>
        </div>
      </div>
    );
  }

  // Exibir erro de permissão se houver
  if (permissionError) {
    return (
      <div className={cn("p-3 bg-yellow-50 border border-yellow-200 rounded-lg", className)}>
        <p className="text-sm text-yellow-800">{permissionError}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setPermissionError(null);
            setHasPermission(null);
          }}
          className="mt-2"
        >
          Tentar novamente
        </Button>
      </div>
    );
  }

  return null;
}