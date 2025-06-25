import { useState, useEffect } from "react";
import { MediaPlaceholder } from "./MediaPlaceholder";
import type { Message } from "@shared/schema";

interface LazyMediaContentProps {
  message: Message;
  className?: string;
}

export function LazyMediaContent({ message, className }: LazyMediaContentProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    // Detectar se é mensagem em upload
    const metadata = message.metadata as any;
    if (metadata && metadata.uploading) {
      setIsUploading(true);
      
      // Se há URL temporária, criar objeto File simulado para preview
      if (metadata.tempPreviewUrl && metadata.fileName) {
        // Não criamos um File real aqui, apenas mantemos as informações
        setFile({
          name: metadata.fileName,
          size: metadata.fileSize || 0,
          type: metadata.mimeType || '',
        } as File);
      }
    } else {
      setIsUploading(false);
      setFile(null);
    }
  }, [message]);

  // Se é uma mensagem em upload, usar MediaPlaceholder
  if (isUploading && file) {
    const metadata = message.metadata as any;
    
    return (
      <MediaPlaceholder
        type={message.messageType === 'image' ? 'image' : 'video'}
        uploadStatus="uploading"
        caption={metadata.caption}
        className={className}
      />
    );
  }

  // Renderização normal para imagens e vídeos processados
  if (message.messageType === 'image') {
    const metadata = message.metadata as any;
    const caption = metadata?.caption;
    
    return (
      <div className={className}>
        <img
          src={message.content}
          alt={caption || "Imagem enviada"}
          className="max-w-xs rounded-lg object-cover"
          loading="lazy"
          onError={(e) => {
            // Fallback em caso de erro de carregamento
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
        {caption && (
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {caption}
          </div>
        )}
      </div>
    );
  }

  if (message.messageType === 'video') {
    const metadata = message.metadata as any;
    const caption = metadata?.caption;
    
    return (
      <div className={className}>
        <video
          src={message.content}
          controls
          className="max-w-xs rounded-lg object-cover"
          preload="metadata"
          onError={(e) => {
            // Fallback em caso de erro de carregamento
            const target = e.target as HTMLVideoElement;
            target.style.display = 'none';
          }}
        >
          Seu navegador não suporta reprodução de vídeo.
        </video>
        {caption && (
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {caption}
          </div>
        )}
      </div>
    );
  }

  // Para outros tipos de mensagem, retornar null
  return null;
}