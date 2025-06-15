import React, { useState, useEffect } from "react";
import { Button } from "@/shared/ui/button";
import { Download, Play, FileText, Image } from "lucide-react";
import { secureLog } from "@/lib/secureLogger";

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
  const [content, setContent] = useState<string | null>(initialContent || null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(!!initialContent);

  const loadMediaContent = async () => {
    if (loaded || loading) return;

    setLoading(true);
    secureLog.debug(`Carregando ${messageType}`, { messageId });

    try {
      const response = await fetch(`/api/messages/${messageId}/media`);
      if (response.ok) {
        const data = await response.json();
        
        // Validar se o conteúdo existe e é válido
        if (data.content && typeof data.content === 'string') {
          setContent(data.content);
          setLoaded(true);

          if (messageType === "video") {
            secureLog.debug("Vídeo carregado com sucesso", { messageId });
          } else if (messageType === "image") {
            secureLog.image("Carregada com sucesso", messageId);
          }
        } else {
          console.error(`❌ Conteúdo inválido para ${messageType}`, { messageId, data });
          secureLog.error(`Conteúdo inválido para ${messageType}`, { messageId });
        }
      } else {
        console.error(`❌ Erro HTTP ao carregar ${messageType}`, { messageId, status: response.status });
        secureLog.error(`Erro ao carregar ${messageType}: ${response.status}`);
      }
    } catch (error) {
      console.error(`❌ Erro de rede ao carregar ${messageType}`, { messageId, error });
      secureLog.error(`Erro ao carregar ${messageType}`, error);
    } finally {
      setLoading(false);
    }
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
              onClick={loadMediaContent}
              disabled={loading}
            >
              {loading ? "Carregando..." : "Ver imagem"}
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
              onClick={loadMediaContent}
              disabled={loading}
            >
              {loading ? "Carregando..." : "Reproduzir"}
            </Button>
          </div>
        );

      case "video":
        if (content) {
          return (
            <div className="relative max-w-sm">
              <video
                controls
                className="rounded-lg w-full h-auto"
                preload="metadata"
                style={{ maxHeight: "400px", minWidth: "280px" }}
                onError={(e) => {
                  console.error("❌ Erro ao carregar vídeo", { messageId, error: e });
                  secureLog.error("Erro ao carregar vídeo", { messageId });
                }}
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
              {loading ? "Carregando..." : "Reproduzir"}
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
                onClick={loadMediaContent}
                disabled={loading}
              >
                {loading ? "Carregando..." : "Carregar"}
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
