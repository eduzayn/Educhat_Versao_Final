import { useState, useRef } from 'react';
import { Button } from '@/shared/ui/button';
import { Send, Mic } from 'lucide-react';
import { AudioRecorder, AudioRecorderRef } from '@/modules/Messages/components/AudioRecorder/AudioRecorder';

interface ActionButtonsProps {
  onSendMessage: () => void;
  onSendAudio?: (audioBlob: Blob, duration: number) => void;
  canSend: boolean;
  isLoading: boolean;
}

export function ActionButtons({ onSendMessage, onSendAudio, canSend, isLoading }: ActionButtonsProps) {
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const audioRecorderRef = useRef<AudioRecorderRef>(null);

  const handleMicClick = () => {
    if (showAudioRecorder) {
      setShowAudioRecorder(false);
    } else {
      setShowAudioRecorder(true);
    }
  };

  const handleAudioSend = async (audioBlob: Blob, duration: number) => {
    if (onSendAudio) {
      await onSendAudio(audioBlob, duration);
    }
    setShowAudioRecorder(false);
  };

  const handleAudioCancel = () => {
    setShowAudioRecorder(false);
  };

  if (showAudioRecorder) {
    return (
      <div className="flex flex-col gap-2">
        <AudioRecorder
          ref={audioRecorderRef}
          onSendAudio={handleAudioSend}
          onCancel={handleAudioCancel}
          autoStart={true}
        />
      </div>
    );
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="mb-2"
        onClick={handleMicClick}
        aria-label="Gravar áudio"
      >
        <Mic className="w-4 h-4" />
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
    </>
  );
}