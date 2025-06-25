import { useRef, useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Video, X, Send, Play, Pause } from 'lucide-react';
import { useVideoMessage } from '@/shared/lib/hooks/useVideoMessage';

interface VideoUploadProps {
  conversationId: number;
  contactPhone: string;
  disabled?: boolean;
}

export function VideoUpload({ conversationId, contactPhone, disabled }: VideoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  
  const sendVideoMutation = useVideoMessage({ conversationId, contactPhone });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm', 'video/mkv'];
    if (!allowedTypes.includes(file.type)) {
      return;
    }

    // Validar tamanho (100MB máximo para vídeos)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      return;
    }

    setSelectedVideo(file);

    // Criar preview do vídeo
    const reader = new FileReader();
    reader.onload = (e) => {
      setVideoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSendVideo = async () => {
    if (!selectedVideo) return;

    try {
      await sendVideoMutation.mutateAsync({ 
        file: selectedVideo, 
        caption: caption || undefined 
      });
      clearSelection();
    } catch (error) {
      // Erro já tratado no hook useVideoMessage
      console.error('Erro ao enviar vídeo:', error);
    }
  };

  const clearSelection = () => {
    setSelectedVideo(null);
    setVideoPreview(null);
    setCaption('');
    setIsPlaying(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const toggleVideoPlay = () => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Preview do vídeo selecionado */}
      {selectedVideo && videoPreview && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-background border rounded-lg p-3 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="relative">
              <video
                ref={videoRef}
                src={videoPreview}
                className="w-20 h-20 object-cover rounded-md"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                preload="metadata"
                muted
              />
              <Button
                size="sm"
                variant="ghost"
                className="absolute inset-0 h-full w-full bg-black/30 hover:bg-black/50 text-white"
                onClick={toggleVideoPlay}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                onClick={clearSelection}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="text-sm font-medium text-foreground">
                {selectedVideo.name}
              </div>
              <div className="text-xs text-muted-foreground">
                {(selectedVideo.size / 1024 / 1024).toFixed(2)} MB
              </div>
              
              <input
                type="text"
                placeholder="Adicionar legenda (opcional)"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full px-2 py-1 text-sm border rounded-md bg-background"
                maxLength={1000}
              />
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSendVideo}
                  disabled={sendVideoMutation.isPending || disabled}
                  className="flex items-center gap-1"
                >
                  <Send className="h-3 w-3" />
                  {sendVideoMutation.isPending ? 'Enviando...' : 'Enviar'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Botão para selecionar vídeo */}
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={openFileDialog}
        disabled={disabled || sendVideoMutation.isPending}
        className="h-8 w-8 p-0"
        title="Enviar vídeo"
      >
        <Video className="h-4 w-4" />
      </Button>
    </div>
  );
}