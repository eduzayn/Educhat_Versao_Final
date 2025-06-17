import { useState, useRef } from 'react';
import { Button } from '@/shared/ui/button';
import { Send, Mic, MicOff, Square } from 'lucide-react';
import { useToast } from '@/shared/lib/hooks/use-toast';

interface ActionButtonsProps {
  onSendMessage: () => void;
  onSendAudio?: (audioBlob: Blob, duration: number) => void;
  canSend: boolean;
  isLoading: boolean;
}

export function ActionButtons({ onSendMessage, onSendAudio, canSend, isLoading }: ActionButtonsProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const audioChunks: Blob[] = [];
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        if (onSendAudio && recordingTime > 0) {
          onSendAudio(audioBlob, recordingTime);
        }
        
        // Parar todas as faixas de áudio
        stream.getTracks().forEach(track => track.stop());
        
        // Limpar timer
        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current);
          recordingIntervalRef.current = null;
        }
        
        setIsRecording(false);
        setRecordingTime(0);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Timer para controlar duração da gravação
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          // Parar automaticamente após 5 minutos
          if (newTime >= 300) {
            stopRecording();
          }
          return newTime;
        });
      }, 1000);

    } catch (error) {
      console.error('Erro ao acessar microfone:', error);
      toast({
        title: "Erro no microfone",
        description: "Não foi possível acessar o microfone. Verifique as permissões.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stream?.getTracks().forEach(track => track.stop());
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      setIsRecording(false);
      setRecordingTime(0);
    }
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-end gap-2">
      {isRecording && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-red-600 font-mono">{formatTime(recordingTime)}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={cancelRecording}
            className="h-6 w-6 p-0 hover:bg-red-100"
          >
            <MicOff className="w-3 h-3" />
          </Button>
        </div>
      )}

      <Button
        variant="ghost"
        size="sm"
        className={`mb-2 ${isRecording ? 'bg-red-100 text-red-600' : ''}`}
        onClick={handleMicClick}
        aria-label={isRecording ? "Parar gravação" : "Gravar áudio"}
      >
        {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
      </Button>

      <Button
        onClick={onSendMessage}
        disabled={!canSend || isLoading}
        size="sm"
        className="mb-2"
        aria-label="Enviar mensagem"
      >
        <Send className="w-4 h-4" />
      </Button>
    </div>
  );
}