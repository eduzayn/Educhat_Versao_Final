import { useState, useCallback } from 'react';

export function useMediaRecorder() {
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks(chunks => [...chunks, event.data]);
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      throw error;
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorder) {
        resolve(null);
        return;
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
        setAudioChunks([]);
        
        // Parar todas as tracks do stream
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
        
        resolve(audioBlob);
      };

      mediaRecorder.stop();
      setMediaRecorder(null);
    });
  }, [mediaRecorder, audioChunks]);

  return {
    startRecording,
    stopRecording,
    isRecording: !!mediaRecorder
  };
} 