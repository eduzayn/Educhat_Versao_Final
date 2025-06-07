import { useState, useRef } from "react";
import { Button } from "@/shared/ui/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/ui/dialog";
import { Input } from "@/shared/ui/ui/input";
import { Label } from "@/shared/ui/ui/label";
import {
  Paperclip,
  Image,
  Video,
  FileText,
  Link,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/shared/lib/hooks/use-toast";
import { useChatStore } from "@/shared/store/store/chatStore";

interface AttachmentDialogProps {
  disabled?: boolean;
}

export function AttachmentDialog({ disabled }: AttachmentDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { activeConversation } = useChatStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mutation para enviar imagem
  const sendImageMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!activeConversation?.contact.phone || !activeConversation?.id) {
        throw new Error("Dados da conversa não disponíveis");
      }

      const formData = new FormData();
      formData.append("phone", activeConversation.contact.phone);
      formData.append("conversationId", activeConversation.id.toString());
      formData.append("image", file);

      const response = await fetch("/api/zapi/send-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Erro ao enviar imagem");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Imagem enviada",
        description: "Sua imagem foi enviada com sucesso!",
      });
      setIsOpen(false);

      // Invalidar cache para atualizar mensagens
      if (activeConversation?.id) {
        queryClient.invalidateQueries({
          queryKey: [`/api/conversations/${activeConversation.id}/messages`],
        });
      }
    },
    onError: (error) => {
      console.error("Erro ao enviar imagem:", error);
      toast({
        title: "Erro ao enviar imagem",
        description: "Não foi possível enviar a imagem. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Mutation para enviar vídeo
  const sendVideoMutation = useMutation({
    mutationFn: async (file: File) => {
      console.log("🎥 Iniciando envio de vídeo:", {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        conversationId: activeConversation?.id,
        contactPhone: activeConversation?.contact.phone,
      });

      if (!activeConversation?.contact.phone || !activeConversation?.id) {
        console.error("❌ Dados da conversa não disponíveis");
        throw new Error("Dados da conversa não disponíveis");
      }

      try {
        const formData = new FormData();
        formData.append("phone", activeConversation.contact.phone);
        formData.append("conversationId", activeConversation.id.toString());
        formData.append("video", file);

        console.log("📤 Enviando FormData para servidor:", {
          phone: activeConversation.contact.phone,
          conversationId: activeConversation.id,
          fileName: file.name,
          fileSize: file.size,
        });

        const response = await fetch("/api/zapi/send-video", {
          method: "POST",
          body: formData,
          // Aumentar timeout para arquivos grandes
          signal: AbortSignal.timeout(180000), // 3 minutos
        });

        console.log("📥 Resposta do servidor:", {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ Erro na resposta do servidor:", errorText);
          throw new Error(
            `Erro ao enviar vídeo: ${response.status} - ${errorText}`,
          );
        }

        const result = await response.json();
        console.log("✅ Vídeo enviado com sucesso:", result);
        return result;
      } catch (error) {
        console.error("💥 Erro no processo de envio:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Vídeo enviado",
        description: "Seu vídeo foi enviado com sucesso!",
      });
      setIsOpen(false);

      // Invalidar cache para atualizar mensagens
      if (activeConversation?.id) {
        queryClient.invalidateQueries({
          queryKey: [`/api/conversations/${activeConversation.id}/messages`],
        });
        // Força um refetch imediato
        queryClient.refetchQueries({
          queryKey: [`/api/conversations/${activeConversation.id}/messages`],
        });
      }
    },
    onError: (error) => {
      console.error("Erro ao enviar vídeo:", error);
      const isTimeout =
        error instanceof Error &&
        (error.name === "TimeoutError" || error.message.includes("timeout"));
      toast({
        title: "Erro ao enviar vídeo",
        description: isTimeout
          ? "O vídeo é muito grande. Arquivos maiores que 50MB podem demorar mais para enviar."
          : "Não foi possível enviar o vídeo. Verifique sua conexão e tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Mutation para enviar documento
  const sendDocumentMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!activeConversation?.contact.phone || !activeConversation?.id) {
        throw new Error("Dados da conversa não disponíveis");
      }

      console.log("📄 Iniciando envio de documento:", {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        phone: activeConversation.contact.phone,
        conversationId: activeConversation.id,
      });

      const formData = new FormData();
      formData.append("phone", activeConversation.contact.phone);
      formData.append("conversationId", activeConversation.id.toString());
      formData.append("document", file);

      try {
        const response = await fetch("/api/zapi/send-document", {
          method: "POST",
          body: formData,
          signal: AbortSignal.timeout(120000), // 2 minutos
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Erro ao enviar documento: ${response.status} - ${errorText}`);
        }

        return response.json();
      } catch (error) {
        console.error("💥 Erro no envio do documento:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Documento enviado",
        description: "Seu documento foi enviado com sucesso!",
      });
      setIsOpen(false);

      if (activeConversation?.id) {
        queryClient.invalidateQueries({
          queryKey: [`/api/conversations/${activeConversation.id}/messages`],
        });
      }
    },
    onError: (error) => {
      console.error("Erro ao enviar documento:", error);
      toast({
        title: "Erro ao enviar documento",
        description: "Não foi possível enviar o documento. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Mutation para enviar link
  const sendLinkMutation = useMutation({
    mutationFn: async ({ url, text }: { url: string; text: string }) => {
      if (!activeConversation?.contact.phone) {
        throw new Error("Número do contato não disponível");
      }

      const response = await fetch("/api/zapi/send-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: activeConversation.contact.phone,
          url,
          text,
          conversationId: activeConversation.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao enviar link");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Link enviado",
        description: "Seu link foi enviado com sucesso!",
      });
      setLinkUrl("");
      setLinkText("");
      setIsOpen(false);
    },
    onError: (error) => {
      console.error("Erro ao enviar link:", error);
      toast({
        title: "Erro ao enviar link",
        description: "Não foi possível enviar o link. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (type: "image" | "video" | "document") => {
    const input = document.createElement("input");
    input.type = "file";
    
    if (type === "image") {
      input.accept = "image/*";
    } else if (type === "video") {
      input.accept = "video/*";
    } else if (type === "document") {
      input.accept = ".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx";
    }

    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        if (type === "image") {
          sendImageMutation.mutate(file);
        } else if (type === "video") {
          sendVideoMutation.mutate(file);
        } else if (type === "document") {
          sendDocumentMutation.mutate(file);
        }
      }
    };

    input.click();
  };

  const handleSendLink = () => {
    if (linkUrl.trim() && linkText.trim()) {
      sendLinkMutation.mutate({
        url: linkUrl.trim(),
        text: linkText.trim(),
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="p-2 text-educhat-medium hover:text-educhat-blue"
          disabled={disabled || !activeConversation?.contact.phone}
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
            disabled={sendImageMutation.isPending}
            className="h-20 flex-col bg-blue-500 hover:bg-blue-600 text-white"
          >
            {sendImageMutation.isPending ? (
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
            disabled={sendVideoMutation.isPending}
            className="h-20 flex-col bg-red-500 hover:bg-red-600 text-white"
          >
            {sendVideoMutation.isPending ? (
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
            disabled={sendDocumentMutation.isPending}
            className="h-20 flex-col bg-green-500 hover:bg-green-600 text-white"
          >
            {sendDocumentMutation.isPending ? (
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
              sendLinkMutation.isPending
            }
            className="w-full bg-purple-500 hover:bg-purple-600 text-white"
          >
            {sendLinkMutation.isPending ? (
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