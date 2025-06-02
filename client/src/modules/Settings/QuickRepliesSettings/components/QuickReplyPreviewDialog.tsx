import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/ui/dialog';
import { Badge } from '@/shared/ui/ui/badge';
import { Button } from '@/shared/ui/ui/button';
import { Card, CardContent } from '@/shared/ui/ui/card';
import { MessageSquare, Mic, Image, Video, Play, Pause, Volume2, Download, Clock, User } from 'lucide-react';
import type { QuickReply } from '@shared/schema';

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'text':
      return <MessageSquare className="h-5 w-5" />;
    case 'audio':
      return <Mic className="h-5 w-5" />;
    case 'image':
      return <Image className="h-5 w-5" />;
    case 'video':
      return <Video className="h-5 w-5" />;
    default:
      return <MessageSquare className="h-5 w-5" />;
  }
};

const getTypeBadgeColor = (type: string) => {
  switch (type) {
    case 'text':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'audio':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'image':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    case 'video':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

interface QuickReplyPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quickReply: QuickReply | null;
}

export function QuickReplyPreviewDialog({
  open,
  onOpenChange,
  quickReply,
}: QuickReplyPreviewDialogProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  if (!quickReply) return null;

  const toggleAudioPlayback = () => {
    if (!quickReply.fileUrl) return;

    if (!audioElement) {
      const audio = new Audio(quickReply.fileUrl);
      audio.addEventListener('ended', () => setIsPlaying(false));
      setAudioElement(audio);
      audio.play();
      setIsPlaying(true);
    } else if (isPlaying) {
      audioElement.pause();
      setIsPlaying(false);
    } else {
      audioElement.play();
      setIsPlaying(true);
    }
  };

  const downloadFile = () => {
    if (quickReply.fileUrl) {
      const link = document.createElement('a');
      link.href = quickReply.fileUrl;
      link.download = quickReply.fileName || `resposta-rapida-${quickReply.id}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getTypeIcon(quickReply.type)}
            {quickReply.title}
          </DialogTitle>
          <DialogDescription>
            Preview da resposta rápida
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex items-center justify-between">
            <Badge className={`${getTypeBadgeColor(quickReply.type)}`}>
              {quickReply.type}
            </Badge>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {quickReply.usageCount !== undefined && (
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  Usado {quickReply.usageCount}x
                </div>
              )}
              {quickReply.createdAt && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {new Date(quickReply.createdAt).toLocaleDateString('pt-BR')}
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {quickReply.description && (
            <div>
              <h4 className="font-medium text-sm mb-2">Descrição</h4>
              <p className="text-sm text-muted-foreground">{quickReply.description}</p>
            </div>
          )}

          {/* Content Preview */}
          <div>
            <h4 className="font-medium text-sm mb-3">Conteúdo</h4>
            
            {quickReply.type === 'text' && quickReply.content && (
              <Card>
                <CardContent className="p-4">
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border-l-4 border-green-500">
                    <p className="whitespace-pre-wrap text-sm">{quickReply.content}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {quickReply.type === 'image' && quickReply.fileUrl && (
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <img
                      src={quickReply.fileUrl}
                      alt={quickReply.title}
                      className="max-w-full max-h-64 object-contain rounded-lg mx-auto"
                    />
                    {quickReply.fileName && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {quickReply.fileName}
                        {quickReply.fileSize && ` • ${formatFileSize(quickReply.fileSize)}`}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {quickReply.type === 'video' && quickReply.fileUrl && (
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <video
                      src={quickReply.fileUrl}
                      controls
                      className="max-w-full max-h-64 rounded-lg mx-auto"
                    />
                    {quickReply.fileName && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {quickReply.fileName}
                        {quickReply.fileSize && ` • ${formatFileSize(quickReply.fileSize)}`}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {quickReply.type === 'audio' && quickReply.fileUrl && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleAudioPlayback}
                        className="h-10 w-10 rounded-full"
                      >
                        {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                      </Button>
                      <div>
                        <div className="flex items-center gap-2">
                          <Volume2 className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium">
                            {quickReply.fileName || 'Audio'}
                          </span>
                        </div>
                        {quickReply.fileSize && (
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(quickReply.fileSize)}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadFile}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {quickReply.shortcut && (
              <div>
                <h4 className="font-medium mb-1">Atalho</h4>
                <code className="bg-muted px-2 py-1 rounded text-xs">
                  {quickReply.shortcut}
                </code>
              </div>
            )}
            
            <div>
              <h4 className="font-medium mb-1">Categoria</h4>
              <p className="text-muted-foreground">{quickReply.category || 'Geral'}</p>
            </div>
            
            <div>
              <h4 className="font-medium mb-1">Status</h4>
              <Badge variant={quickReply.isActive ? 'default' : 'secondary'}>
                {quickReply.isActive ? 'Ativa' : 'Inativa'}
              </Badge>
            </div>

            {quickReply.mimeType && (
              <div>
                <h4 className="font-medium mb-1">Tipo de arquivo</h4>
                <p className="text-muted-foreground text-xs">{quickReply.mimeType}</p>
              </div>
            )}
          </div>

          {/* Message Preview Simulation */}
          <div>
            <h4 className="font-medium text-sm mb-3">Preview no Chat</h4>
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
              <div className="flex justify-end">
                <div className="bg-green-500 text-white p-3 rounded-lg rounded-br-none max-w-xs">
                  {quickReply.type === 'text' && quickReply.content && (
                    <p className="text-sm whitespace-pre-wrap">{quickReply.content}</p>
                  )}
                  {quickReply.type === 'image' && (
                    <div className="text-center">
                      <Image className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-xs">📷 Imagem</p>
                    </div>
                  )}
                  {quickReply.type === 'video' && (
                    <div className="text-center">
                      <Video className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-xs">🎥 Vídeo</p>
                    </div>
                  )}
                  {quickReply.type === 'audio' && (
                    <div className="text-center">
                      <Volume2 className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-xs">🔊 Áudio</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}