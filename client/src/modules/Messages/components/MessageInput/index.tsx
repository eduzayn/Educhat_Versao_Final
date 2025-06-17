import { useState, useRef } from 'react';
import { useMessageSender } from './hooks/useMessageSender';
import { Textarea } from '@/shared/ui/textarea';
import { ActionButtons } from './ActionButtons';
import { MediaAttachmentModal } from '@/modules/Messages/components/MediaAttachmentModal';

interface MessageInputProps {
  conversationId: number;
  onSendMessage?: () => void;
}

export function MessageInput({ conversationId, onSendMessage }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const { isLoading, isUploading, sendTextMessage, uploadFile, shareLink, sendAudio } = useMessageSender({
    conversationId,
    onSendMessage,
  });

  const handleSendMessage = async () => {
    const success = await sendTextMessage(message);
    if (success) {
      setMessage("");
    }
  };

  const handleFileUpload = async (file: File, caption?: string) => {
    await uploadFile(file, caption);
  };

  const handleLinkShare = async (url: string, caption?: string) => {
    await shareLink(url, caption);
  };

  const handleSendAudio = async (audioBlob: Blob, duration: number) => {
    await sendAudio(audioBlob, duration);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="bg-white border-t border-gray-200 p-4 relative">
      <div className="flex items-end gap-3">
        <MediaAttachmentModal
          onFileUpload={handleFileUpload}
          onLinkShare={handleLinkShare}
          isUploading={isUploading}
        />

        <div className="flex-1">
          <Textarea
            ref={textAreaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="Digite sua mensagem..."
            className="min-h-[40px] max-h-[120px] resize-none"
            aria-label="Campo de mensagem"
          />
        </div>

        <ActionButtons
          onSendMessage={handleSendMessage}
          onSendAudio={handleSendAudio}
          canSend={message.trim().length > 0}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}