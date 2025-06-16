import React, { useState, useEffect } from "react";
import { Button } from "@/shared/ui/button";
import { Download, Play, FileText, Image } from "lucide-react";
import { secureLog } from "@/lib/secureLogger";
import { useOptimizedMedia } from "@/shared/lib/hooks/useOptimizedMedia";

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
  // Log detalhado dos dados recebidos para debugging
  console.log(`🎬 LazyMediaContent iniciado para mensagem ${messageId}:`, {
    messageType,
    conversationId,
    isFromContact,
    hasMetadata: !!metadata,
    metadata,
    hasInitialContent: !!initialContent,
    initialContent,
    initialContentType: typeof initialContent,
    initialContentLength: initialContent?.length
  });

  const {
    content,
    loading,
    loaded,
    error,
    retryCount,
    loadMediaContent,
    retry,
    canRetry
  } = useOptimizedMedia(messageId, messageType, initialContent);

  const setError = (errorMsg: string) => {
    console.error(`❌ ${errorMsg}`, { messageId });
  };

  const renderMediaPreview = () => {
    const fileName = metadata?.fileName || metadata?.caption || "Arquivo";

    switch (messageType) {
      case "image":
        if (content) {
          return (
            <div className="relative max-w-xs">
              <img
                src={content}
                alt="Imagem enviada"
                className="rounded-lg max-w-full h-auto cursor-pointer"
                onClick={() => window.open(content, "_blank")}
              />
            </div>
          );
        }
        return (
          <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <Image className="w-5 h-5" />
            <span className="text-sm">Imagem: {fileName}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={error ? retry : loadMediaContent}
              disabled={loading || (!canRetry && !!error)}
            >
              {loading ? "Carregando..." : error && retryCount > 0 ? `Tentar novamente (${retryCount})` : "Ver imagem"}
            </Button>
          </div>
        );

      case "audio":
        if (content) {
          return (
            <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <audio controls className="w-48">
                <source src={content} type="audio/mpeg" />
                <source src={content} type="audio/mp4" />
                <source src={content} type="audio/wav" />
                Seu navegador não suporta áudio.
              </audio>
            </div>
          );
        }
        return (
          <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Play className="w-5 h-5" />
            <span className="text-sm">
              Áudio: {metadata?.duration || "Duração desconhecida"}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={error ? retry : loadMediaContent}
              disabled={loading || (!canRetry && !!error)}
            >
              {loading ? "Carregando..." : error && retryCount > 0 ? `Tentar novamente (${retryCount})` : "Reproduzir"}
            </Button>
          </div>
        );

      case "video":
        if (error) {
          return (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <Play className="w-5 h-5 text-red-500" />
              <div className="flex-1">
                <span className="text-sm text-red-700 dark:text-red-300">Vídeo: {fileName}</span>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</p>
              </div>
            </div>
          );
        }
        if (content) {
          let videoUrl = content;
          
          // CORREÇÃO: Se o content não é uma URL válida, buscar nos metadados
          if (videoUrl === 'Vídeo enviado' || videoUrl === 'Vídeo' || (!videoUrl.startsWith('http') && !videoUrl.startsWith('data:') && !videoUrl.startsWith('/'))) {
            // Tentar usar URL dos metadados
            videoUrl = metadata?.fileUrl || metadata?.mediaUrl || metadata?.url;
            console.log(`🔧 Usando URL dos metadados para mensagem ${messageId}:`, { originalContent: content, newUrl: videoUrl });
          }
          
          // Verificar se é um vídeo base64 válido
          if (videoUrl?.startsWith('data:video/')) {
            // Vídeo base64 válido, usar diretamente
          } else if (videoUrl?.startsWith('http')) {
            // URL externa válida
            try {
              // Verificar se a URL é válida
              new URL(videoUrl);
            } catch (e) {
              setError('URL do vídeo inválida.');
              return null;
            }
          } else if (videoUrl?.startsWith('/') || videoUrl?.includes('.mp4') || videoUrl?.includes('.webm') || videoUrl?.includes('.avi') || videoUrl?.includes('.mov')) {
            // URL relativa ou arquivo de vídeo válido
            // Manter videoUrl como está
          } else {
            // Log detalhado para debugging
            console.error(`❌ Formato de vídeo não suportado.`, { 
              messageId, 
              originalContent: content,
              finalVideoUrl: videoUrl,
              contentType: typeof videoUrl,
              contentLength: videoUrl?.length,
              startsWithData: videoUrl?.startsWith('data:'),
              startsWithHttp: videoUrl?.startsWith('http'),
              fileName,
              metadata: metadata
            });
            setError('Vídeo não encontrado. Verifique se o arquivo ainda existe.');
            return null;
          }
          return (
            <div className="relative max-w-sm">
              <video
                controls
                className="rounded-lg w-full h-auto"
                preload="metadata"
                style={{ maxHeight: "400px", minWidth: "280px" }}
                onError={(e) => {
                  const videoElement = e.target as HTMLVideoElement;
                  const errorCode = videoElement.error?.code;
                  const errorMessage = videoElement.error?.message;
                  console.error(`❌ Erro ao carregar vídeo`, { messageId, errorCode, errorMessage });
                  setError(`Erro ao reproduzir vídeo (código: ${errorCode || 'desconhecido'})`);
                }}
                onLoadedData={() =>
                  secureLog.debug("Vídeo carregado", { messageId })
                }
              >
                <source src={videoUrl} type="video/mp4" />
                <source src={videoUrl} type="video/webm" />
                <source src={videoUrl} type="video/ogg" />
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
              onClick={error ? retry : loadMediaContent}
              disabled={loading || (!canRetry && !!error)}
            >
              {loading ? "Carregando..." : error && retryCount > 0 ? `Tentar novamente (${retryCount})` : "Reproduzir"}
            </Button>
          </div>
        );

      case "document":
        return (
          <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <FileText className="w-5 h-5" />
            <span className="text-sm">Documento: {fileName}</span>
            {content ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(content, "_blank")}
              >
                <Download className="w-4 h-4 mr-1" />
                Baixar
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={error ? retry : loadMediaContent}
                disabled={loading || (!canRetry && !!error)}
              >
                {loading ? "Carregando..." : error && retryCount > 0 ? `Tentar novamente (${retryCount})` : "Carregar"}
              </Button>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return <div className="my-1">{renderMediaPreview()}</div>;
}

export default LazyMediaContent;
