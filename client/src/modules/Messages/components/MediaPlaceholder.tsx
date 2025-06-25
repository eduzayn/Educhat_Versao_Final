import { useState, useEffect } from "react";
import { Loader2, Image as ImageIcon, Video, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface MediaPlaceholderProps {
  type: "image" | "video";
  file?: File;
  uploadStatus: "uploading" | "success" | "error";
  finalContent?: string;
  caption?: string;
  className?: string;
}

export function MediaPlaceholder({
  type,
  file,
  uploadStatus,
  finalContent,
  caption,
  className
}: MediaPlaceholderProps) {
  const [previewUrl, setPreviewUrl] = useState<string>("");

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  // Se temos conteúdo final, exibir a mídia processada
  if (finalContent && uploadStatus === "success") {
    if (type === "image") {
      return (
        <div className={cn("relative max-w-xs rounded-lg overflow-hidden", className)}>
          <img
            src={finalContent}
            alt={caption || "Imagem enviada"}
            className="w-full h-auto object-cover"
            loading="lazy"
          />
          {caption && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2">
              {caption}
            </div>
          )}
        </div>
      );
    }

    if (type === "video") {
      return (
        <div className={cn("relative max-w-xs rounded-lg overflow-hidden", className)}>
          <video
            src={finalContent}
            controls
            className="w-full h-auto object-cover"
            preload="metadata"
          >
            Seu navegador não suporta reprodução de vídeo.
          </video>
          {caption && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2">
              {caption}
            </div>
          )}
        </div>
      );
    }
  }

  // Estado de erro
  if (uploadStatus === "error") {
    return (
      <div className={cn(
        "flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg max-w-xs",
        className
      )}>
        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
        <div className="text-sm">
          <div className="font-medium text-red-800 dark:text-red-200">
            Erro ao enviar {type === "image" ? "imagem" : "vídeo"}
          </div>
          <div className="text-xs text-red-600 dark:text-red-400 mt-1">
            Tente novamente
          </div>
        </div>
      </div>
    );
  }

  // Estado de upload com preview
  return (
    <div className={cn("relative max-w-xs rounded-lg overflow-hidden", className)}>
      {/* Preview da mídia local */}
      {previewUrl && (
        <>
          {type === "image" && (
            <img
              src={previewUrl}
              alt="Preview da imagem"
              className="w-full h-auto object-cover opacity-75"
            />
          )}
          {type === "video" && (
            <video
              src={previewUrl}
              className="w-full h-auto object-cover opacity-75"
              preload="metadata"
            />
          )}
        </>
      )}

      {/* Fallback se não há preview */}
      {!previewUrl && (
        <div className="w-full h-32 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          {type === "image" ? (
            <ImageIcon className="w-8 h-8 text-gray-400" />
          ) : (
            <Video className="w-8 h-8 text-gray-400" />
          )}
        </div>
      )}

      {/* Overlay de loading */}
      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-white">
          <Loader2 className="w-6 h-6 animate-spin" />
          <div className="text-xs font-medium">
            Enviando {type === "image" ? "imagem" : "vídeo"}...
          </div>
        </div>
      </div>

      {/* Caption preview */}
      {caption && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2">
          {caption}
        </div>
      )}
    </div>
  );
}