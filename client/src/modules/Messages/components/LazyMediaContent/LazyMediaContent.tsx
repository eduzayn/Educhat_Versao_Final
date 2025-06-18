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

  // OTIMIZAÇÃO: Usar URL direta quando disponível para renderização imediata
  const directMediaUrl = metadata?.fileUrl || metadata?.mediaUrl || metadata?.url;
  const hasDirectUrl = directMediaUrl && (directMediaUrl.startsWith('/') || directMediaUrl.startsWith('http') || directMediaUrl.startsWith('data:'));

  console.log(`🔍 Verificando URL direta para mensagem ${messageId}:`, {
    directMediaUrl,
    hasDirectUrl,
    metadata
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
  } = useOptimizedMedia(messageId, messageType, hasDirectUrl ? directMediaUrl : null);

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
          <div className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-xl border border-blue-200/50 dark:border-blue-800/50 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-4 p-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Image className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                  {fileName}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  {metadata?.fileSize ? `${(metadata.fileSize / 1024).toFixed(0)} KB` : 'Imagem'} • Clique para visualizar
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={error ? retry : loadMediaContent}
                disabled={loading || (!canRetry && !!error)}
                className="relative px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Carregando...
                  </>
                ) : error && retryCount > 0 ? (
                  `Tentar novamente (${retryCount})`
                ) : (
                  <>
                    <Image className="w-4 h-4 mr-2" />
                    Ver imagem
                  </>
                )}
              </Button>
            </div>
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
          <div className="group relative overflow-hidden bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/40 dark:to-blue-800/40 rounded-xl border border-blue-200/50 dark:border-blue-700/50 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-4 p-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Play className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-400 rounded-full border-2 border-white flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                  Áudio
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  {metadata?.duration || "Duração desconhecida"} • Clique para reproduzir
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={error ? retry : loadMediaContent}
                disabled={loading || (!canRetry && !!error)}
                className="relative px-4 py-2.5 bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Carregando...
                  </>
                ) : error && retryCount > 0 ? (
                  `Tentar novamente (${retryCount})`
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Reproduzir
                  </>
                )}
              </Button>
            </div>
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
          <div className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-xl border border-blue-200/50 dark:border-blue-800/50 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-4 p-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Play className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                  <Play className="w-2 h-2 text-white fill-current" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                  {fileName}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  {metadata?.fileSize ? `${(metadata.fileSize / (1024 * 1024)).toFixed(1)} MB` : 'Vídeo'} • Clique para reproduzir
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={error ? retry : loadMediaContent}
                disabled={loading || (!canRetry && !!error)}
                className="relative px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Carregando...
                  </>
                ) : error && retryCount > 0 ? (
                  `Tentar novamente (${retryCount})`
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Reproduzir
                  </>
                )}
              </Button>
            </div>
          </div>
        );

      case "document":
        return (
          <div className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-xl border border-blue-200/50 dark:border-blue-800/50 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-4 p-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                  <Download className="w-2 h-2 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                  {fileName}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  Documento • Clique para {content ? 'baixar' : 'carregar'}
                </p>
              </div>
              {content ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(content, "_blank")}
                  className="relative px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={error ? retry : loadMediaContent}
                  disabled={loading || (!canRetry && !!error)}
                  className="relative px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Carregando...
                    </>
                  ) : error && retryCount > 0 ? (
                    `Tentar novamente (${retryCount})`
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Carregar
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return <div className="my-1">{renderMediaPreview()}</div>;
}

export default LazyMediaContent;
