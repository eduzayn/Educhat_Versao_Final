/*
 * ⚠️  COMPONENTE PROTEGIDO - SISTEMA DE CARREGAMENTO DE MÍDIAS SOB DEMANDA ⚠️
 * 
 * Este componente é CRÍTICO para o funcionamento do carregamento sob demanda.
 * O sistema está ESTÁVEL e NÃO deve ser modificado sem autorização explícita.
 * 
 * Data de Proteção: 18/06/2025
 * Status: SISTEMA ESTÁVEL - NÃO MODIFICAR
 */

import React, { useState, useEffect, useRef } from "react";
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
  initialContent: propInitialContent,
}: LazyMediaContentProps) {
  // Referência para evitar logs repetitivos
  const loggedRef = useRef(false);
  
  // Log apenas na primeira renderização para evitar spam nos logs
  if (!loggedRef.current) {
    console.log(`🎬 LazyMediaContent iniciado para mensagem ${messageId}:`, {
      messageType,
      conversationId,
      isFromContact,
      hasMetadata: !!metadata,
      hasInitialContent: !!propInitialContent
    });
    loggedRef.current = true;
  }

  // CORREÇÃO: Carregamento sob demanda para TODAS as mensagens (enviadas e recebidas)
  // Tanto mensagens enviadas quanto recebidas devem usar carregamento sob demanda
  const directMediaUrl = metadata?.fileUrl || metadata?.mediaUrl || metadata?.url;
  const hasDirectUrl = directMediaUrl && (directMediaUrl.startsWith('/') || directMediaUrl.startsWith('http') || directMediaUrl.startsWith('data:'));
  
  // SEMPRE usar carregamento sob demanda - sem carregamento automático
  const shouldAutoLoad = false;
  const processedInitialContent = null;

  const {
    content,
    loading,
    loaded,
    error,
    retryCount,
    loadMediaContent,
    retry,
    canRetry
  } = useOptimizedMedia(messageId, messageType, processedInitialContent);

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
        // Se temos conteúdo carregado (URL do documento), mostrar preview e botão de download
        if (content) {
          const isPdf = fileName.toLowerCase().includes('.pdf') || metadata?.mimeType?.includes('pdf');
          
          return (
            <div className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-xl border border-blue-200/50 dark:border-blue-800/50 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-4 p-4">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
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
                    {isPdf ? 'PDF' : 'Documento'} • {metadata?.fileSize ? `${(metadata.fileSize / 1024).toFixed(0)} KB` : 'Disponível'}
                  </p>
                </div>
                <div className="flex gap-2">
                  {isPdf && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Abrir modal de preview para PDFs
                        const previewWindow = window.open('', '_blank');
                        if (previewWindow) {
                          previewWindow.document.write(`
                            <html>
                              <head><title>${fileName}</title></head>
                              <body style="margin:0; padding:0;">
                                <iframe src="${content}" style="width:100%; height:100vh; border:none;"></iframe>
                              </body>
                            </html>
                          `);
                        }
                      }}
                      className="relative px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      Visualizar
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = content;
                      link.download = fileName;
                      link.target = '_blank';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="relative px-3 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Baixar
                  </Button>
                </div>
              </div>
            </div>
          );
        }
        
        // Se não temos conteúdo, mostrar botão para carregar
        return (
          <div className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-xl border border-blue-200/50 dark:border-blue-800/50 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center gap-4 p-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center">
                  <Download className="w-2 h-2 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                  {fileName}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  Documento • Clique para carregar
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
                    <FileText className="w-4 h-4 mr-2" />
                    Carregar
                  </>
                )}
              </Button>
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
