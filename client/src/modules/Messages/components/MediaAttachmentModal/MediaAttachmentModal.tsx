import { useState, useRef } from 'react';
import { Button } from '@/shared/ui/button';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from '@/shared/ui/dialog';
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
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-10 w-10 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 
                     transition-all duration-300 hover:scale-110 active:scale-95
                     rounded-full group"
        >
          <Paperclip className="h-5 w-5 transition-all duration-300 
                                group-hover:rotate-12 group-hover:scale-110" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[480px] max-h-[80vh] p-0 rounded-2xl overflow-hidden 
                                shadow-xl border-0 backdrop-blur-sm
                                animate-in fade-in-0 zoom-in-95 duration-300">
        <DialogHeader className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 
                        bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <DialogTitle className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Anexar
          </DialogTitle>
          <DialogDescription className="sr-only">
            Selecione arquivos ou links para anexar à mensagem
          </DialogDescription>
        </DialogHeader>

        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          className="hidden"
        />

        {!selectedFile && activeTab === 'file' && (
          <div className="py-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
            {/* Lista vertical similar ao WhatsApp */}
            <div className="space-y-1 px-2">
              {/* Documento */}
              <button
                onClick={() => handleFileSelect('.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx')}
                className="w-full flex items-center gap-4 px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 
                          transition-all duration-300 ease-out text-left border-0 rounded-lg 
                          hover:shadow-md hover:scale-[1.02] active:scale-[0.98] active:bg-gray-100 
                          dark:active:bg-gray-700 group"
              >
                <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center 
                               transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg
                               group-hover:bg-purple-600 group-active:scale-105">
                  <FileText className="w-5 h-5 text-white transition-transform duration-300 
                                     group-hover:scale-110" />
                </div>
                <span className="text-gray-900 dark:text-gray-100 font-normal text-base 
                               transition-colors duration-300 group-hover:text-gray-700 
                               dark:group-hover:text-gray-200">Documento</span>
              </button>

              {/* Fotos e vídeos */}
              <button
                onClick={() => handleFileSelect('image/*,video/*')}
                className="w-full flex items-center gap-4 px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 
                          transition-all duration-300 ease-out text-left border-0 rounded-lg 
                          hover:shadow-md hover:scale-[1.02] active:scale-[0.98] active:bg-gray-100 
                          dark:active:bg-gray-700 group"
              >
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center 
                               transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg
                               group-hover:bg-blue-600 group-active:scale-105">
                  <Image className="w-5 h-5 text-white transition-transform duration-300 
                                   group-hover:scale-110" />
                </div>
                <span className="text-gray-900 dark:text-gray-100 font-normal text-base 
                               transition-colors duration-300 group-hover:text-gray-700 
                               dark:group-hover:text-gray-200">Fotos e vídeos</span>
              </button>

              {/* Câmera */}
              <button
                onClick={() => handleFileSelect('image/*')}
                className="w-full flex items-center gap-4 px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 
                          transition-all duration-300 ease-out text-left border-0 rounded-lg 
                          hover:shadow-md hover:scale-[1.02] active:scale-[0.98] active:bg-gray-100 
                          dark:active:bg-gray-700 group"
              >
                <div className="w-10 h-10 rounded-full bg-pink-500 flex items-center justify-center 
                               transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg
                               group-hover:bg-pink-600 group-active:scale-105">
                  <Camera className="w-5 h-5 text-white transition-transform duration-300 
                                    group-hover:scale-110" />
                </div>
                <span className="text-gray-900 dark:text-gray-100 font-normal text-base 
                               transition-colors duration-300 group-hover:text-gray-700 
                               dark:group-hover:text-gray-200">Câmera</span>
              </button>

              {/* Áudio */}
              <button
                onClick={() => handleFileSelect('audio/*')}
                className="w-full flex items-center gap-4 px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 
                          transition-all duration-300 ease-out text-left border-0 rounded-lg 
                          hover:shadow-md hover:scale-[1.02] active:scale-[0.98] active:bg-gray-100 
                          dark:active:bg-gray-700 group"
              >
                <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center 
                               transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg
                               group-hover:bg-orange-600 group-active:scale-105">
                  <Headphones className="w-5 h-5 text-white transition-transform duration-300 
                                        group-hover:scale-110" />
                </div>
                <span className="text-gray-900 dark:text-gray-100 font-normal text-base 
                               transition-colors duration-300 group-hover:text-gray-700 
                               dark:group-hover:text-gray-200">Áudio</span>
              </button>

              {/* Contato */}
              <button
                onClick={() => setActiveTab('link')}
                className="w-full flex items-center gap-4 px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 
                          transition-all duration-300 ease-out text-left border-0 rounded-lg 
                          hover:shadow-md hover:scale-[1.02] active:scale-[0.98] active:bg-gray-100 
                          dark:active:bg-gray-700 group"
              >
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center 
                               transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg
                               group-hover:bg-blue-600 group-active:scale-105">
                  <User className="w-5 h-5 text-white transition-transform duration-300 
                                  group-hover:scale-110" />
                </div>
                <span className="text-gray-900 dark:text-gray-100 font-normal text-base 
                               transition-colors duration-300 group-hover:text-gray-700 
                               dark:group-hover:text-gray-200">Contato</span>
              </button>

              {/* Enquete */}
              <button
                onClick={() => setActiveTab('link')}
                className="w-full flex items-center gap-4 px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 
                          transition-all duration-300 ease-out text-left border-0 rounded-lg 
                          hover:shadow-md hover:scale-[1.02] active:scale-[0.98] active:bg-gray-100 
                          dark:active:bg-gray-700 group"
              >
                <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center 
                               transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg
                               group-hover:bg-yellow-600 group-active:scale-105">
                  <BarChart3 className="w-5 h-5 text-white transition-transform duration-300 
                                       group-hover:scale-110" />
                </div>
                <span className="text-gray-900 dark:text-gray-100 font-normal text-base 
                               transition-colors duration-300 group-hover:text-gray-700 
                               dark:group-hover:text-gray-200">Enquete</span>
              </button>

              {/* Nova figurinha */}
              <button
                onClick={() => handleFileSelect('image/*')}
                className="w-full flex items-center gap-4 px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 
                          transition-all duration-300 ease-out text-left border-0 rounded-lg 
                          hover:shadow-md hover:scale-[1.02] active:scale-[0.98] active:bg-gray-100 
                          dark:active:bg-gray-700 group"
              >
                <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center 
                               transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg
                               group-hover:bg-teal-600 group-active:scale-105">
                  <Gift className="w-5 h-5 text-white transition-transform duration-300 
                                  group-hover:scale-110" />
                </div>
                <span className="text-gray-900 dark:text-gray-100 font-normal text-base 
                               transition-colors duration-300 group-hover:text-gray-700 
                               dark:group-hover:text-gray-200">Nova figurinha</span>
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
              <div className="flex-1 bg-gray-50 dark:bg-gray-800 flex items-center justify-center p-6 min-h-[300px]">
                <img 
                  src={filePreview} 
                  alt="Preview" 
                  className="max-w-full max-h-[350px] rounded-lg object-contain shadow-sm"
                />
              </div>
            )}

            {/* Preview do vídeo */}
            {selectedFile.type.startsWith('video/') && filePreview && (
              <div className="flex-1 bg-gray-50 dark:bg-gray-800 flex items-center justify-center p-6 min-h-[300px]">
                <div className="relative">
                  <video 
                    ref={videoRef}
                    src={filePreview}
                    className="max-w-full max-h-[350px] rounded-lg object-contain shadow-sm"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={toggleVideoPlay}
                    className="absolute bottom-3 left-3 h-10 w-10 p-0 bg-black/60 hover:bg-black/80 border-0 rounded-full transition-all duration-200"
                  >
                    {isPlaying ? <Pause className="h-5 w-5 text-white" /> : <Play className="h-5 w-5 text-white ml-0.5" />}
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

export default MediaAttachmentModal;