import React, { useState, useEffect } from "react";
import { Button } from "@/shared/ui/button";
import { Download, Play, FileText, Image } from "lucide-react";
import { secureLog } from "@/lib/secureLogger";
import { DocumentPreviewModal } from "@/shared/components/DocumentPreviewModal";
import { useMediaUrl } from "@/shared/lib/utils/whatsappProxy";

interface LazyMediaContentProps {
  messageId: number;
  messageType: "audio" | "video" | "image" | "document";
  conversationId?: number;
  isFromContact: boolean;
  metadata?: any;
  initialContent?: string | null;
}

export function LazyMediaContent({
  messageId,
  messageType,
  conversationId,
  isFromContact,
  metadata,
  initialContent,
}: LazyMediaContentProps) {
  // Função para verificar se o conteúdo é uma URL válida
  const isValidUrl = (str: string | null | undefined): str is string => {
    if (!str) return false;
    return str.startsWith('http') || str.startsWith('data:');
  };

  // Função para extrair URL dos metadados
  const getUrlFromMetadata = (): string | null => {
    if (!metadata) return null;
    
    // Verificar mediaUrl diretamente
    if (metadata.mediaUrl && isValidUrl(metadata.mediaUrl)) {
      return metadata.mediaUrl;
    }
    
    // Verificar URLs específicas por tipo
    switch (messageType) {
      case 'image':
        if (metadata.image?.imageUrl && isValidUrl(metadata.image.imageUrl)) {
          return metadata.image.imageUrl;
        }
        if (metadata.image?.url && isValidUrl(metadata.image.url)) {
          return metadata.image.url;
        }
        if (metadata.imageUrl && isValidUrl(metadata.imageUrl)) {
          return metadata.imageUrl;
        }
        break;
      case 'video':
        if (metadata.video?.videoUrl && isValidUrl(metadata.video.videoUrl)) {
          return metadata.video.videoUrl;
        }
        if (metadata.video?.url && isValidUrl(metadata.video.url)) {
          return metadata.video.url;
        }
        if (metadata.videoUrl && isValidUrl(metadata.videoUrl)) {
          return metadata.videoUrl;
        }
        break;
      case 'document':
        if (metadata.document?.documentUrl && isValidUrl(metadata.document.documentUrl)) {
          return metadata.document.documentUrl;
        }
        if (metadata.document?.url && isValidUrl(metadata.document.url)) {
          return metadata.document.url;
        }
        if (metadata.documentUrl && isValidUrl(metadata.documentUrl)) {
          return metadata.documentUrl;
        }
        break;
      case 'audio':
        if (metadata.audio?.audioUrl && isValidUrl(metadata.audio.audioUrl)) {
          return metadata.audio.audioUrl;
        }
        if (metadata.audio?.url && isValidUrl(metadata.audio.url)) {
          return metadata.audio.url;
        }
        if (metadata.audioUrl && isValidUrl(metadata.audioUrl)) {
          return metadata.audioUrl;
        }
        break;
    }
    
    return null;
  };

  // Determinar o conteúdo inicial real
  const getRealInitialContent = (): string | null => {
    if (isValidUrl(initialContent)) {
      return initialContent;
    }
    return getUrlFromMetadata();
  };

  const realInitialContent = getRealInitialContent();
  const proxiedMediaUrl = useMediaUrl(realInitialContent);
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Áudios carregam automaticamente, imagens/vídeos/documentos sob demanda
  useEffect(() => {
    if (messageType === 'audio' && proxiedMediaUrl && !loaded && !loading) {
      setContent(proxiedMediaUrl);
      setLoaded(true);
    }
  }, [messageId, messageType, proxiedMediaUrl, loaded, loading]);

  const loadMediaContent = async () => {
    if (loaded || loading) return;

    setLoading(true);
    secureLog.debug(`Carregando ${messageType}`, { messageId });

    try {
      const response = await fetch(`/api/messages/${messageId}/media`);
      if (response.ok) {
        const data = await response.json();
        setContent(data.content);
        setLoaded(true);

        if (messageType === "video") {
          secureLog.debug("Vídeo carregado", { messageId });
        } else if (messageType === "image") {
          secureLog.debug("Imagem carregada", { messageId });
        }
      } else {
        secureLog.error(`Erro ao carregar ${messageType}: ${response.status}`);
      }
    } catch (error) {
      secureLog.error(`Erro ao carregar ${messageType}`, error);
    } finally {
      setLoading(false);
    }
  };

  const renderMediaPreview = () => {
    const fileName = metadata?.fileName || metadata?.caption || "Arquivo";

    switch (messageType) {
      case "image":
        // Para imagens, usar o proxiedMediaUrl se disponível, senão usar content carregado
        const imageUrl = proxiedMediaUrl || content;
        if ((loaded && content) || proxiedMediaUrl) {
          return (
            <>
              <div className="relative max-w-xs">
                <img
                  src={imageUrl || ''}
                  alt="Imagem enviada"
                  className="rounded-lg max-w-full h-auto cursor-pointer"
                  onClick={() => setShowPreviewModal(true)}
                  onError={(e) => {
                    // Se a imagem falhar ao carregar, não mostrar erro (placeholder será usado pelo proxy)
                    console.log('🖼️ Imagem processada pelo proxy');
                  }}
                />
              </div>
              <DocumentPreviewModal
                isOpen={showPreviewModal}
                onClose={() => setShowPreviewModal(false)}
                documentUrl={imageUrl || ''}
                fileName={fileName}
                fileType="image"
              />
            </>
          );
        }
        return (
          <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <Image className="w-5 h-5" />
            <span className="text-sm">Imagem: {fileName}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={loadMediaContent}
              disabled={loading}
            >
              {loading ? "Carregando..." : "Visualizar"}
            </Button>
          </div>
        );

      case "audio":
        const audioUrl = content || realInitialContent;
        if (audioUrl) {
          return (
            <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <audio controls className="w-full max-w-xs">
                <source src={audioUrl} type="audio/mpeg" />
                <source src={audioUrl} type="audio/ogg" />
                <source src={audioUrl} type="audio/wav" />
                Seu navegador não suporta áudio.
              </audio>
            </div>
          );
        }
        return (
          <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <Play className="w-5 h-5" />
            <span className="text-sm">
              Áudio: {metadata?.duration || "Duração desconhecida"}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={loadMediaContent}
              disabled={loading}
            >
              {loading ? "Carregando..." : "Reproduzir"}
            </Button>
          </div>
        );

      case "video":
        if (loaded && content) {
          return (
            <div className="relative max-w-sm">
              <video
                controls
                className="rounded-lg w-full h-auto"
                preload="metadata"
                style={{ maxHeight: "400px", minWidth: "280px" }}
                onError={() =>
                  secureLog.error("Erro ao carregar vídeo", { messageId })
                }
                onLoadedData={() =>
                  secureLog.debug("Vídeo carregado", { messageId })
                }
              >
                <source src={content} type="video/mp4" />
                <source src={content} type="video/webm" />
                <source src={content} type="video/ogg" />
                Seu navegador não suporta vídeo.
              </video>
            </div>
          );
        }
        return (
          <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <Play className="w-5 h-5" />
            <span className="text-sm">Vídeo: {fileName}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={loadMediaContent}
              disabled={loading}
            >
              {loading ? "Carregando..." : "Visualizar"}
            </Button>
          </div>
        );

      case "document":
        if (content) {
          return (
            <>
              <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <FileText className="w-5 h-5" />
                <span className="text-sm">{fileName}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreviewModal(true)}
                >
                  Visualizar
                </Button>
              </div>
              <DocumentPreviewModal
                isOpen={showPreviewModal}
                onClose={() => setShowPreviewModal(false)}
                documentUrl={content}
                fileName={fileName}
                fileType="document"
              />
            </>
          );
        }
        return (
          <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <FileText className="w-5 h-5" />
            <span className="text-sm">Documento: {fileName}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={loadMediaContent}
              disabled={loading}
            >
              {loading ? "Carregando..." : "Visualizar"}
            </Button>
          </div>
        );

      default:
        return (
          <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <FileText className="w-5 h-5" />
            <span className="text-sm">Arquivo: {fileName}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={loadMediaContent}
              disabled={loading}
            >
              {loading ? "Carregando..." : "Visualizar"}
            </Button>
          </div>
        );
    }
  };

  return <div className="my-2">{renderMediaPreview()}</div>;
}