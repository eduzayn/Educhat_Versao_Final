import { useState } from "react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";
import {
  Paperclip,
  Image,
  Video,
  FileText,
  Link,
} from "lucide-react";
import type { ConversationWithContact } from "@shared/schema";

interface AttachmentDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSendImage: (file: File) => void;
  onSendVideo: (file: File) => void;
  onSendDocument: (file: File) => void;
  onSendLink: ({ url, text }: { url: string; text: string }) => void;
  activeConversation?: ConversationWithContact;
  isPendingImage: boolean;
  isPendingVideo: boolean;
  isPendingDocument: boolean;
  isPendingLink: boolean;
}

export function AttachmentDialog({
  isOpen,
  onOpenChange,
  onSendImage,
  onSendVideo,
  onSendDocument,
  onSendLink,
  activeConversation,
  isPendingImage,
  isPendingVideo,
  isPendingDocument,
  isPendingLink,
}: AttachmentDialogProps) {
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");

  const handleFileSelect = (type: "image" | "video" | "document") => {
    const input = document.createElement("input");
    input.type = "file";

    if (type === "image") {
      input.accept = "image/*";
    } else if (type === "video") {
      input.accept = "video/*";
    } else if (type === "document") {
      input.accept = ".pdf,.doc,.docx,.txt,.xlsx,.ppt,.pptx";
    }

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        if (type === "image") {
          onSendImage(file);
        } else if (type === "video") {
          onSendVideo(file);
        } else if (type === "document") {
          onSendDocument(file);
        }
      }
    };

    input.click();
  };

  const handleSendLink = () => {
    if (linkUrl.trim() && linkText.trim()) {
      onSendLink({ url: linkUrl.trim(), text: linkText.trim() });
      setLinkUrl("");
      setLinkText("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="p-2 text-educhat-medium hover:text-educhat-blue"
          disabled={!activeConversation?.contact.phone}
        >
          <Paperclip className="w-5 h-5" />
        </Button>
      </DialogTrigger>

      <DialogContent className="w-96">
        <DialogHeader>
          <DialogTitle>Enviar Anexo</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 mt-4">
          {/* Botão para Imagem */}
          <Button
            onClick={() => handleFileSelect("image")}
            disabled={isPendingImage}
            className="h-20 flex-col bg-blue-500 hover:bg-blue-600 text-white"
          >
            {isPendingImage ? (
              <div className="w-6 h-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <Image className="w-8 h-8 mb-2" />
                <span className="text-sm">Imagem</span>
              </>
            )}
          </Button>

          {/* Botão para Vídeo */}
          <Button
            onClick={() => handleFileSelect("video")}
            disabled={isPendingVideo}
            className="h-20 flex-col bg-red-500 hover:bg-red-600 text-white"
          >
            {isPendingVideo ? (
              <div className="w-6 h-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <Video className="w-8 h-8 mb-2" />
                <span className="text-sm">Vídeo</span>
              </>
            )}
          </Button>

          {/* Botão para Documento */}
          <Button
            onClick={() => handleFileSelect("document")}
            disabled={isPendingDocument}
            className="h-20 flex-col bg-green-500 hover:bg-green-600 text-white"
          >
            {isPendingDocument ? (
              <div className="w-6 h-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <FileText className="w-8 h-8 mb-2" />
                <span className="text-sm">Documento</span>
              </>
            )}
          </Button>

          {/* Botão para Link */}
          <Button
            onClick={() => {
              /* Abrirá seção de link */
            }}
            className="h-20 flex-col bg-purple-500 hover:bg-purple-600 text-white"
          >
            <Link className="w-8 h-8 mb-2" />
            <span className="text-sm">Link</span>
          </Button>
        </div>

        {/* Seção para envio de link */}
        <div className="mt-6 space-y-3">
          <div>
            <Label htmlFor="linkUrl">URL do Link</Label>
            <Input
              id="linkUrl"
              type="url"
              placeholder="https://exemplo.com"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="linkText">Texto do Link</Label>
            <Input
              id="linkText"
              placeholder="Descrição do link"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
            />
          </div>

          <Button
            onClick={handleSendLink}
            disabled={
              !linkUrl.trim() ||
              !linkText.trim() ||
              isPendingLink
            }
            className="w-full bg-purple-500 hover:bg-purple-600 text-white"
          >
            {isPendingLink ? (
              <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
            ) : (
              <Link className="w-4 h-4 mr-2" />
            )}
            Enviar Link
          </Button>
        </div>

        {!activeConversation?.contact.phone && (
          <div className="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-600 text-center">
            Anexos disponíveis apenas para contatos do WhatsApp
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}