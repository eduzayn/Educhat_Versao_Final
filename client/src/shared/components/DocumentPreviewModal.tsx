import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Download, X, FileText, Image, Video, Play } from "lucide-react";
import { secureLog } from "@/lib/secureLogger";

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentUrl: string;
  fileName: string;
  fileType?: string;
}

export function DocumentPreviewModal({
  isOpen,
  onClose,
  documentUrl,
  fileName,
  fileType
}: DocumentPreviewModalProps) {
  
  const handleDownload = () => {
    // Criar um link temporário para download
    const link = document.createElement('a');
    link.href = documentUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    secureLog.debug("Download iniciado", { fileName });
  };

  const renderPreviewContent = () => {
    const lowerFileName = fileName.toLowerCase();
    const lowerFileType = fileType?.toLowerCase() || '';
    
    // Determinar tipo do arquivo
    const isPdf = lowerFileName.includes('.pdf') || lowerFileType.includes('pdf');
    const isImage = lowerFileName.match(/\.(jpg|jpeg|png|gif|webp)$/i) || lowerFileType.includes('image');
    const isVideo = lowerFileName.match(/\.(mp4|avi|mov|webm|mkv)$/i) || lowerFileType.includes('video');
    
    if (isPdf) {
      return (
        <div className="w-full h-[600px] border rounded-lg">
          <iframe
            src={documentUrl}
            className="w-full h-full rounded-lg"
            title={fileName}
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            onError={() => {
              secureLog.error("Erro ao carregar PDF", { fileName });
            }}
          />
        </div>
      );
    }
    
    if (isImage) {
      return (
        <div className="flex justify-center items-center max-h-[600px]">
          <img
            src={documentUrl}
            alt={fileName}
            className="max-w-full max-h-full object-contain rounded-lg"
            crossOrigin="anonymous"
            referrerPolicy="strict-origin-when-cross-origin"
            onError={(e) => {
              secureLog.error("Erro ao carregar imagem", { fileName, url: documentUrl });
              // Tentar carregar através de proxy se falhar diretamente
              const target = e.target as HTMLImageElement;
              if (!target.src.includes('/api/proxy/image/')) {
                target.src = `/api/proxy/image/${encodeURIComponent(documentUrl)}`;
              }
            }}
            onLoad={() => {
              secureLog.debug("Imagem carregada com sucesso", { fileName });
            }}
          />
        </div>
      );
    }
    
    if (isVideo) {
      return (
        <div className="flex justify-center items-center">
          <video
            controls
            className="max-w-full max-h-[600px] rounded-lg"
            preload="metadata"
          >
            <source src={documentUrl} type="video/mp4" />
            <source src={documentUrl} type="video/webm" />
            Seu navegador não suporta este formato de vídeo.
          </video>
        </div>
      );
    }
    
    // Para outros tipos de arquivo, mostrar preview genérico
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-center space-y-4">
        <FileText className="w-16 h-16 text-gray-400" />
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {fileName}
          </h3>
          <p className="text-sm text-gray-500 mt-2">
            Preview não disponível para este tipo de arquivo
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Clique em "Baixar" para visualizar o arquivo
          </p>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-lg font-medium truncate pr-4">
            {fileName}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Baixar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="flex items-center gap-1"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="overflow-auto max-h-[calc(90vh-120px)]">
          {renderPreviewContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}