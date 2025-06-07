import React, { useState } from "react";
import { Button } from "@/shared/ui/ui/button";
import { Download, Play, FileText, Image, Loader2, Video } from "lucide-react";
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
        setContent(data.content);
        setLoaded(true);
        secureLog.debug(`${messageType} carregado com sucesso`, { messageId });
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
            <Button variant="outline" size="sm" onClick={loadMediaContent} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ver imagem"}
            </Button>
          </div>
        );

      case "audio":
        if (content) {
          return (
            <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <audio controls className="w-48">
                <source src={content} type="audio/webm" />
                <source src={content} type="audio/mpeg" />
                <source src={content} type="audio/wav" />
                Seu navegador não suporta áudio.
              </audio>
            </div>
          );
        }
        return (
          <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Play className="w-5 h-5" />
            <span className="text-sm">Áudio: {metadata?.duration || "Desconhecido"}</span>
            <Button variant="outline" size="sm" onClick={loadMediaContent} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reproduzir"}
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
                onError={() => secureLog.error("Erro ao carregar vídeo", { messageId })}
                onLoadedData={() => secureLog.debug("Vídeo carregado", { messageId })}
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
            <Video className="w-5 h-5" />
            <span className="text-sm">Vídeo: {fileName}</span>
            <Button variant="outline" size="sm" onClick={loadMediaContent} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reproduzir"}
            </Button>
          </div>
        );

      case "document":
        return (
          <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <FileText className="w-5 h-5" />
            <span className="text-sm">Documento: {fileName}</span>
            {content ? (
              <Button variant="outline" size="sm" onClick={() => window.open(content!, "_blank")}> 
                <Download className="w-4 h-4 mr-1"
