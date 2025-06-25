import { useRef, useState } from 'react';
import { Button } from '@/shared/ui/button';
import { ImageIcon, X, Send } from 'lucide-react';
import { useImageMessage } from '@/shared/lib/hooks/useImageMessage';

interface ImageUploadProps {
  conversationId: number;
  contactPhone: string;
  disabled?: boolean;
}

export function ImageUpload({ conversationId, contactPhone, disabled }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  
  const sendImageMutation = useImageMessage({ conversationId, contactPhone });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
    if (!allowedTypes.includes(file.type)) {
      return;
    }

    // Validar tamanho (50MB máximo)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return;
    }

    setSelectedImage(file);

    // Criar preview da imagem
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSendImage = async () => {
    if (!selectedImage) return;

    try {
      await sendImageMutation.mutateAsync({ 
        file: selectedImage, 
        caption: caption || undefined 
      });
      clearSelection();
    } catch (error) {
      // Erro já tratado no hook useImageMessage
      console.error('Erro ao enviar imagem:', error);
    }
  };

  const clearSelection = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setCaption('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Preview da imagem selecionada */}
      {selectedImage && imagePreview && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-background border rounded-lg p-3 shadow-lg">
          <div className="flex items-start gap-3">
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-20 h-20 object-cover rounded-md"
              />
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
                {selectedImage.name}
              </div>
              <div className="text-xs text-muted-foreground">
                {(selectedImage.size / 1024 / 1024).toFixed(2)} MB
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
                  onClick={handleSendImage}
                  disabled={sendImageMutation.isPending || disabled}
                  className="flex items-center gap-1"
                >
                  <Send className="h-3 w-3" />
                  {sendImageMutation.isPending ? 'Enviando...' : 'Enviar'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Botão para selecionar imagem */}
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={openFileDialog}
        disabled={disabled || sendImageMutation.isPending}
        className="h-8 w-8 p-0"
        title="Enviar imagem"
      >
        <ImageIcon className="h-4 w-4" />
      </Button>
    </div>
  );
}