import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from "react";
import { Button } from "@/shared/ui/ui/button";
import { Mic, Square, Trash2, Send, Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDurationSeconds } from "@/shared/lib/utils/formatters";

interface AudioRecorderProps {
  onSendAudio: (audioBlob: Blob, duration: number) => void;
  onCancel: () => void;
  onRecordingStateChange?: (isRecording: boolean) => void;
  autoStart?: boolean;
  className?: string;
}

export interface AudioRecorderRef {
  startRecording: () => void;
  stopRecording: () => void;
}

type RecordingState =
  | "idle"
  | "requesting-permission"
  | "recording"
  | "preview"
  | "sending";

const AudioRecorderComponent = ({
  onSendAudio,
  onCancel,
  onRecordingStateChange,
  autoStart = false,
  className,
}: AudioRecorderProps, ref: React.Ref<AudioRecorderRef>) => {
  const [state, setState] = useState<RecordingState>("idle");
  const [duration, setDuration] = useState(0);
  const [realDuration, setRealDuration] = useState(0); // Duração real do áudio
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [permission, setPermission] = useState<"granted" | "denied" | "prompt">(
    "prompt",
  );

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const MAX_DURATION = 300; // 5 minutos em segundos

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);



  const startRecording = async () => {
    try {
      setState("requesting-permission");

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setPermission("granted");

      chunksRef.current = [];
      // Verificar formatos suportados e escolher o melhor para WhatsApp
      let mimeType = "audio/webm;codecs=opus";
      if (MediaRecorder.isTypeSupported("audio/mp4")) {
        mimeType = "audio/mp4";
      } else if (MediaRecorder.isTypeSupported("audio/mpeg")) {
        mimeType = "audio/mpeg";
      } else if (MediaRecorder.isTypeSupported("audio/wav")) {
        mimeType = "audio/wav";
      }

      console.log("🎤 Formato de áudio selecionado:", mimeType);

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType,
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        // Calcular a duração real do áudio
        const tempAudio = new Audio(url);
        tempAudio.onloadedmetadata = () => {
          const realDurationSeconds = Math.round(tempAudio.duration);
          setRealDuration(realDurationSeconds);
          console.log(`🎵 Duração timer: ${duration}s, Duração real: ${realDurationSeconds}s`);
        };
        
        setState("preview");

        // Limpar o stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start();
      setState("recording");
      setDuration(0);

      // Iniciar timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          const newDuration = prev + 1;
          if (newDuration >= MAX_DURATION) {
            stopRecording();
            return MAX_DURATION;
          }
          return newDuration;
        });
      }, 1000);
    } catch (error) {
      console.error("Erro ao iniciar gravação:", error);
      setPermission("denied");
      setState("idle");
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const cancelRecording = () => {
    if (state === "recording") {
      stopRecording();
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }

    setState("idle");
    setDuration(0);
    setRealDuration(0);
    setAudioBlob(null);
    setCurrentTime(0);
    setIsPlaying(false);
    onCancel();
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

  const handleSendAudio = async () => {
    if (!audioBlob) return;

    setState("sending");
    // Usar duração real se disponível, senão usar timer
    const finalDuration = realDuration > 0 ? realDuration : duration;
    await onSendAudio(audioBlob, finalDuration);

    // Reset após envio
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setState("idle");
    setDuration(0);
    setRealDuration(0);
    setAudioBlob(null);
    setCurrentTime(0);
    setIsPlaying(false);
  };

  // Estado Padrão/Inativo
  if (state === "idle") {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={startRecording}
        className={cn(
          "p-2 h-10 w-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800",
          className,
        )}
        title="Gravar áudio"
      >
        <Mic className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </Button>
    );
  }

  // Estado Solicitando Permissão
  if (state === "requesting-permission") {
    return (
      <div
        className={cn(
          "flex items-center space-x-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg",
          className,
        )}
      >
        <Mic className="w-5 h-5 text-blue-600 animate-pulse" />
        <span className="text-sm text-blue-700 dark:text-blue-300">
          Solicitando permissão do microfone...
        </span>
      </div>
    );
  }

  // Estado Gravando
  if (state === "recording") {
    return (
      <div
        className={cn(
          "flex items-center space-x-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800",
          className,
        )}
      >
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Mic className="w-6 h-6 text-red-600" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          </div>
          <span className="text-sm font-mono text-red-700 dark:text-red-300">
            {formatDurationSeconds(duration)}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={stopRecording}
            className="h-8 px-3 bg-white dark:bg-gray-800 border-red-300 dark:border-red-700"
          >
            <Square className="w-4 h-4 mr-1" />
            Parar
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={cancelRecording}
            className="h-8 px-3 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  // Estado Preview
  if (state === "preview") {
    return (
      <div
        className={cn(
          "flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border",
          className,
        )}
      >
        {audioUrl && (
          <audio
            ref={audioRef}
            src={audioUrl}
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            onEnded={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        )}

        <div className="flex items-center space-x-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={togglePlayback}
            className="h-8 w-8 p-0"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>

          <div className="flex flex-col">
            <span className="text-xs text-gray-600 dark:text-gray-400">
              Áudio ({formatDurationSeconds(realDuration > 0 ? realDuration : duration)})
            </span>
            <div className="w-20 h-1 bg-gray-200 dark:bg-gray-600 rounded overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-100"
                style={{ width: `${(currentTime / (realDuration > 0 ? realDuration : duration)) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 ml-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={cancelRecording}
            className="h-8 px-3"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Descartar
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSendAudio}
            className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Send className="w-4 h-4 mr-1" />
            Enviar
          </Button>
        </div>
      </div>
    );
  }

  // Estado Enviando
  if (state === "sending") {
    return (
      <div
        className={cn(
          "flex items-center space-x-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg",
          className,
        )}
      >
        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-blue-700 dark:text-blue-300">
          Enviando áudio...
        </span>
      </div>
    );
  }

  return null;
}
