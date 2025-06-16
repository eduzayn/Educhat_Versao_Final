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

  // Para carregamento sob demanda, não passar URL direta - apenas quando explicitamente solicitado
  const directMediaUrl = metadata?.fileUrl || metadata?.mediaUrl;
  const hasDirectUrl = directMediaUrl && (directMediaUrl.startsWith('/') || directMediaUrl.startsWith('http'));

  const {
    content,
    loading,
    loaded,
    error,
    retryCount,
    loadMediaContent,
    retry,
    canRetry
  } = useOptimizedMedia(messageId, messageType, null); // Sempre null para forçar carregamento sob demanda

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
                  console.error(`❌ Erro ao carregar vídeo`, { messageId, errorCode, content });
                  setError(`Erro ao reproduzir vídeo (código: ${errorCode || 'desconhecido'})`);
                }}
                onLoadedData={() => console.log(`✅ Vídeo carregado para mensagem ${messageId}`)}
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
