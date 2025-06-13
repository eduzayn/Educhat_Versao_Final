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
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-downloads"
            onError={() => {
              secureLog.error("Erro ao carregar PDF", { fileName });
            }}
          />
        </div>
      );
    }
    
    if (isImage) {
      return (
        <div className="flex justify-center items-center max-h-[600px] min-h-[200px]">
          <img
            src={documentUrl}
            alt={fileName}
            className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
            crossOrigin="anonymous"
            referrerPolicy="strict-origin-when-cross-origin"
            style={{ minHeight: '100px', minWidth: '100px' }}
            onError={(e) => {
              secureLog.error("❌ Erro ao carregar imagem", { fileName, url: documentUrl });
              const target = e.target as HTMLImageElement;
              
              // Se a URL já não contém o proxy, tentar via proxy
              if (!target.src.includes('/api/media/proxy')) {
                const proxyUrl = `/api/media/proxy?url=${encodeURIComponent(documentUrl)}`;
                secureLog.debug("🔄 Tentando carregar via proxy", { originalUrl: documentUrl, proxyUrl });
                target.src = proxyUrl;
              } else {
                // Se o proxy também falhou, mostrar erro visual
                target.style.display = 'none';
                const errorDiv = document.createElement('div');
                errorDiv.className = 'flex flex-col items-center justify-center p-8 text-gray-500';
                errorDiv.innerHTML = `
                  <div class="text-center">
                    <div class="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mb-4">
                      <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                    </div>
                    <p class="text-sm font-medium">Não foi possível carregar a imagem</p>
                    <p class="text-xs text-gray-400 mt-1">Tente fazer o download do arquivo</p>
                  </div>
                `;
                target.parentNode?.appendChild(errorDiv);
              }
            }}
            onLoad={() => {
              secureLog.debug("✅ Imagem carregada com sucesso", { fileName, url: documentUrl });
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
          <DialogDescription className="sr-only">
            Visualização de documento anexado
          </DialogDescription>
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