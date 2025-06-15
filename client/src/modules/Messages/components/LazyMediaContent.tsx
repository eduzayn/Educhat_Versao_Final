import React, { useState, useEffect, useRef, useCallback } from "react";
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

  // Debug log para documentos
  if (messageType === 'document') {
    secureLog.debug("LazyMediaContent - Documento detectado", {
      messageId,
      hasMetadata: !!metadata,
      hasInitialContent: !!initialContent,
      metadata: metadata
    });
  }
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
        // Verificações adicionais para documentos
        if (metadata.document?.mediaUrl && isValidUrl(metadata.document.mediaUrl)) {
          return metadata.document.mediaUrl;
        }
        // Verificar se o content é uma URL válida para documentos
        if (typeof metadata.content === 'string' && isValidUrl(metadata.content)) {
          return metadata.content;
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
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Apenas áudios carregam automaticamente
  useEffect(() => {
    if (messageType === 'audio' && realInitialContent && !loaded && !loading) {
      setContent(realInitialContent);
      setLoaded(true);
    }
  }, [messageId, messageType, realInitialContent, loaded, loading]);

  const loadMediaContent = async () => {
    if (loaded || loading) return;

    setLoading(true);
    secureLog.debug(`Carregando ${messageType}`, { messageId });

    try {
      // Para imagens, usar o conteúdo inicial com proxy se disponível
      if (messageType === 'image' && realInitialContent) {
        const proxiedUrl = `/api/proxy/media?url=${encodeURIComponent(realInitialContent)}`;
        setContent(proxiedUrl);
        setLoaded(true);
        secureLog.debug("Imagem carregada via proxy", { messageId });
      } 
      // Para documentos, tentar usar URL dos metadados primeiro
      else if (messageType === 'document' && realInitialContent) {
        setContent(realInitialContent);
        setLoaded(true);
        secureLog.debug("Documento carregado via metadados", { messageId, url: realInitialContent });
      } 
      else {
        // Para outros tipos de mídia ou fallback, usar API tradicional
        const response = await fetch(`/api/messages/${messageId}/media`);
        if (response.ok) {
          const data = await response.json();
          setContent(data.content);
          setLoaded(true);
          secureLog.debug(`${messageType} carregado via API`, { messageId });
        } else {
          secureLog.error(`Erro ao carregar ${messageType}: ${response.status}`);

          // Para documentos, tentar carregar mesmo com erro se temos URL nos metadados
          if (messageType === 'document' && realInitialContent) {
            setContent(realInitialContent);
            setLoaded(true);
            secureLog.debug("Documento carregado via metadados (fallback)", { messageId });
          }
        }
      }
    } catch (error) {
      secureLog.error(`Erro ao carregar ${messageType}`, error);

      // Fallback para documentos com URL nos metadados
      if (messageType === 'document' && realInitialContent) {
        setContent(realInitialContent);
        setLoaded(true);
        secureLog.debug("Documento carregado via metadados (fallback de erro)", { messageId });
      }
    } finally {
      setLoading(false);
    }
  };

  const renderMediaPreview = () => {
    const fileName = metadata?.fileName || metadata?.caption || "Arquivo";

    switch (messageType) {
      case "image":
        // Só mostrar imagem após carregamento manual
        if (loaded && content) {
          return (
            <>
              <div className="relative max-w-xs">
                <img
                  src={content}
                  alt="Imagem enviada"
                  className="rounded-lg max-w-full h-auto cursor-pointer"
                  onClick={() => setShowPreviewModal(true)}
                  onLoad={() => {
                    console.log('✅ Imagem carregada com sucesso');
                  }}
                />
              </div>
              <DocumentPreviewModal
                isOpen={showPreviewModal}
                onClose={() => setShowPreviewModal(false)}
                documentUrl={content}
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
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium truncate block">{fileName}</span>
                  {metadata?.fileSize && (
                    <span className="text-xs text-gray-500">
                      {(metadata.fileSize / 1024 / 1024).toFixed(2)} MB
                    </span>
                  )}
                </div>
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

        // Se não tem conteúdo carregado, mostrar botão para carregar
        const hasAvailableContent = realInitialContent || getUrlFromMetadata();

        return (
          <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <FileText className="w-5 h-5" />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium truncate block">
                {fileName || "Documento"}
              </span>
              {metadata?.fileSize && (
                <span className="text-xs text-gray-500">
                  {(metadata.fileSize / 1024 / 1024).toFixed(2)} MB
                </span>
              )}
              {!hasAvailableContent && (
                <span className="text-xs text-amber-600">
                  Conteúdo via API
                </span>
              )}
            </div>
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