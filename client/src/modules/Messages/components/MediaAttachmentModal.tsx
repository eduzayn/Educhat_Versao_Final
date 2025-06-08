import { useState, useRef } from 'react';
import { Button } from '../../button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../dialog';
import { Input } from '../../input';
import { Textarea } from '../../textarea';
import { Label } from '../../label';
import { 
  Paperclip, 
  Image, 
  Video, 
  FileText, 
  Link, 
  X, 
  Upload,
  Play,
  Pause
} from 'lucide-react';
import { useToast } from '@/shared/lib/hooks/use-toast';

interface MediaAttachmentModalProps {
  onFileUpload: (file: File, caption?: string) => void;
  onLinkShare: (url: string, caption?: string) => void;
  isUploading?: boolean;
}

export function MediaAttachmentModal({ 
  onFileUpload, 
  onLinkShare, 
  isUploading = false 
}: MediaAttachmentModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>('');
  const [caption, setCaption] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'file' | 'link'>('file');
  const [isPlaying, setIsPlaying] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (acceptType: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = acceptType;
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    // Criar preview para imagens e vídeos
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      setFilePreview(url);
    } else {
      setFilePreview('');
    }
  };

  const handleSendFile = () => {
    if (selectedFile) {
      onFileUpload(selectedFile, caption);
      resetModal();
    }
  };

  const handleSendLink = () => {
    if (linkUrl.trim()) {
      onLinkShare(linkUrl.trim(), caption);
      resetModal();
    }
  };

  const resetModal = () => {
    setSelectedFile(null);
    setFilePreview('');
    setCaption('');
    setLinkUrl('');
    setActiveTab('file');
    setIsOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleVideoPlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const getFileTypeIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="w-5 h-5" />;
    if (file.type.startsWith('video/')) return <Video className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-10 w-10 p-0">
          <Paperclip className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Anexar arquivo</DialogTitle>
        </DialogHeader>

        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
        />

        {!selectedFile && activeTab === 'file' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {/* Imagem */}
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                onClick={() => handleFileSelect('image/*')}
              >
                <Image className="h-6 w-6" />
                <span className="text-sm font-medium">Imagem</span>
              </Button>

              {/* Vídeo */}
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center gap-2 bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
                onClick={() => handleFileSelect('video/*')}
              >
                <Video className="h-6 w-6" />
                <span className="text-sm font-medium">Vídeo</span>
              </Button>

              {/* Documento */}
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center gap-2 bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700"
                onClick={() => handleFileSelect('.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx')}
              >
                <FileText className="h-6 w-6" />
                <span className="text-sm font-medium">Documento</span>
              </Button>

              {/* Link */}
              <Button
                variant="outline"
                className="h-20 flex flex-col items-center justify-center gap-2 bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-700"
                onClick={() => setActiveTab('link')}
              >
                <Link className="h-6 w-6" />
                <span className="text-sm font-medium">Link</span>
              </Button>
            </div>
          </div>
        )}

        {/* Preview do arquivo selecionado */}
        {selectedFile && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getFileTypeIcon(selectedFile)}
                <span className="text-sm font-medium truncate max-w-[200px]">
                  {selectedFile.name}
                </span>
                <span className="text-xs text-gray-500">
                  ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedFile(null);
                  setFilePreview('');
                }}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Preview da imagem */}
            {selectedFile.type.startsWith('image/') && filePreview && (
              <div className="rounded-lg overflow-hidden border">
                <img 
                  src={filePreview} 
                  alt="Preview" 
                  className="w-full h-48 object-cover"
                />
              </div>
            )}

            {/* Preview do vídeo */}
            {selectedFile.type.startsWith('video/') && filePreview && (
              <div className="relative rounded-lg overflow-hidden border">
                <video 
                  ref={videoRef}
                  src={filePreview}
                  className="w-full h-48 object-cover"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={toggleVideoPlay}
                  className="absolute bottom-2 left-2 h-8 w-8 p-0"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
              </div>
            )}

            {/* Campo de legenda */}
            <div className="space-y-2">
              <Label htmlFor="caption">Legenda (opcional)</Label>
              <Textarea
                id="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Adicione uma legenda..."
                className="min-h-[80px]"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetModal}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSendFile}
                disabled={isUploading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isUploading ? (
                  <>
                    <Upload className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar'
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Aba de Link */}
        {activeTab === 'link' && (
          <div className="space-y-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab('file')}
              className="mb-2"
            >
              ← Voltar aos arquivos
            </Button>

            <div className="space-y-2">
              <Label htmlFor="link-url">URL do Link</Label>
              <Input
                id="link-url"
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://exemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="link-caption">Mensagem (opcional)</Label>
              <Textarea
                id="link-caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Adicione uma mensagem..."
                className="min-h-[80px]"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetModal}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSendLink}
                disabled={!linkUrl.trim() || isUploading}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Enviar Link
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}