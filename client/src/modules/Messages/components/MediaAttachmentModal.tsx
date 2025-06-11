import { useState, useRef } from 'react';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { Label } from '@/shared/ui/label';
import { 
  Paperclip, 
  Image, 
  Video, 
  FileText, 
  Link, 
  X, 
  Upload,
  Play,
  Pause,
  Camera,
  Headphones,
  User,
  BarChart3,
  Calendar,
  Gift
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
      
      <DialogContent className="sm:max-w-[320px] p-0 rounded-2xl overflow-hidden">
        {/* Header minimalista similar ao WhatsApp */}
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-lg font-medium text-gray-900">Anexar</h3>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
        />

        {!selectedFile && activeTab === 'file' && (
          <div className="py-2">
            {/* Lista vertical similar ao WhatsApp */}
            <div className="space-y-0">
              {/* Documento */}
              <button
                onClick={() => handleFileSelect('.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx')}
                className="w-full flex items-center gap-4 px-4 py-4 hover:bg-gray-50 transition-colors text-left border-0"
              >
                <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <span className="text-gray-900 font-normal text-base">Documento</span>
              </button>

              {/* Fotos e vídeos */}
              <button
                onClick={() => handleFileSelect('image/*,video/*')}
                className="w-full flex items-center gap-4 px-4 py-4 hover:bg-gray-50 transition-colors text-left border-0"
              >
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                  <Image className="w-5 h-5 text-white" />
                </div>
                <span className="text-gray-900 font-normal text-base">Fotos e vídeos</span>
              </button>

              {/* Câmera */}
              <button
                onClick={() => handleFileSelect('image/*')}
                className="w-full flex items-center gap-4 px-4 py-4 hover:bg-gray-50 transition-colors text-left border-0"
              >
                <div className="w-10 h-10 rounded-full bg-pink-500 flex items-center justify-center">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <span className="text-gray-900 font-normal text-base">Câmera</span>
              </button>

              {/* Áudio */}
              <button
                onClick={() => handleFileSelect('audio/*')}
                className="w-full flex items-center gap-4 px-4 py-4 hover:bg-gray-50 transition-colors text-left border-0"
              >
                <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
                  <Headphones className="w-5 h-5 text-white" />
                </div>
                <span className="text-gray-900 font-normal text-base">Áudio</span>
              </button>

              {/* Contato */}
              <button
                onClick={() => setActiveTab('link')}
                className="w-full flex items-center gap-4 px-4 py-4 hover:bg-gray-50 transition-colors text-left border-0"
              >
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <span className="text-gray-900 font-normal text-base">Contato</span>
              </button>

              {/* Enquete */}
              <button
                onClick={() => setActiveTab('link')}
                className="w-full flex items-center gap-4 px-4 py-4 hover:bg-gray-50 transition-colors text-left border-0"
              >
                <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <span className="text-gray-900 font-normal text-base">Enquete</span>
              </button>

              {/* Nova figurinha */}
              <button
                onClick={() => handleFileSelect('image/*')}
                className="w-full flex items-center gap-4 px-4 py-4 hover:bg-gray-50 transition-colors text-left border-0"
              >
                <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center">
                  <Gift className="w-5 h-5 text-white" />
                </div>
                <span className="text-gray-900 font-normal text-base">Nova figurinha</span>
              </button>

              {/* Evento */}
              <button
                onClick={() => setActiveTab('link')}
                className="w-full flex items-center gap-4 px-4 py-4 hover:bg-gray-50 transition-colors text-left border-0"
              >
                <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <span className="text-gray-900 font-normal text-base">Evento</span>
              </button>
            </div>
          </div>
        )}

        {/* Preview do arquivo selecionado */}
        {selectedFile && (
          <div className="flex flex-col h-full">
            {/* Header com nome do arquivo */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {getFileTypeIcon(selectedFile)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedFile(null);
                  setFilePreview('');
                }}
                className="h-8 w-8 p-0 shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Preview da imagem */}
            {selectedFile.type.startsWith('image/') && filePreview && (
              <div className="flex-1 bg-gray-100 flex items-center justify-center p-4">
                <img 
                  src={filePreview} 
                  alt="Preview" 
                  className="max-w-full max-h-48 rounded-lg object-contain"
                />
              </div>
            )}

            {/* Preview do vídeo */}
            {selectedFile.type.startsWith('video/') && filePreview && (
              <div className="flex-1 bg-gray-100 flex items-center justify-center p-4">
                <div className="relative">
                  <video 
                    ref={videoRef}
                    src={filePreview}
                    className="max-w-full max-h-48 rounded-lg object-contain"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={toggleVideoPlay}
                    className="absolute bottom-2 left-2 h-8 w-8 p-0 bg-black/50 hover:bg-black/70 border-0"
                  >
                    {isPlaying ? <Pause className="h-4 w-4 text-white" /> : <Play className="h-4 w-4 text-white" />}
                  </Button>
                </div>
              </div>
            )}

            {/* Area de legenda estilo WhatsApp */}
            <div className="border-t border-gray-100">
              <div className="p-4">
                <Textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Adicione uma legenda..."
                  className="border-0 shadow-none resize-none bg-transparent p-0 min-h-[20px] focus-visible:ring-0"
                  rows={2}
                />
              </div>
              
              {/* Botão de envio */}
              <div className="px-4 pb-4">
                <Button 
                  onClick={handleSendFile}
                  disabled={isUploading}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 rounded-full"
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
          </div>
        )}

        {/* Aba de Link */}
        {activeTab === 'link' && (
          <div className="flex flex-col h-full">
            {/* Header com botão voltar */}
            <div className="flex items-center px-4 py-3 border-b border-gray-100">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('file')}
                className="h-8 w-8 p-0 mr-3"
              >
                <X className="h-4 w-4" />
              </Button>
              <h3 className="text-lg font-medium text-gray-900">Enviar link</h3>
            </div>

            {/* Formulário */}
            <div className="flex-1 p-4 space-y-4">
              <div>
                <Input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="Cole o link aqui"
                  className="border-gray-200 focus:border-green-500 focus:ring-green-500"
                />
              </div>

              <div>
                <Textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Adicione uma mensagem..."
                  className="border-gray-200 focus:border-green-500 focus:ring-green-500 min-h-[100px] resize-none"
                  rows={4}
                />
              </div>
            </div>

            {/* Botão de envio */}
            <div className="p-4 border-t border-gray-100">
              <Button 
                onClick={handleSendLink}
                disabled={!linkUrl.trim() || isUploading}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 rounded-full disabled:bg-gray-300"
              >
                Enviar link
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}