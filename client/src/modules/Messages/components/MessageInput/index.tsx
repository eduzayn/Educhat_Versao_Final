import { useMessageInput } from './hooks/useMessageInput';
import { useMessageSender } from './hooks/useMessageSender';
import { TextArea } from './TextArea';
import { ActionButtons } from './ActionButtons';
import { MediaAttachmentModal } from '@/modules/Messages/components/MediaAttachmentModal';

interface MessageInputProps {
  conversationId: number;
  onSendMessage?: () => void;
}

export function MessageInput({ conversationId, onSendMessage }: MessageInputProps) {
  const { message, setMessage, clearMessage, handleKeyDown } = useMessageInput();
  const { isLoading, isUploading, sendTextMessage, uploadFile, shareLink } = useMessageSender({
    conversationId,
    onSendMessage,
  });

  const handleSendMessage = async () => {
    const success = await sendTextMessage(message);
    if (success) {
      clearMessage();
    }
  };

  const handleFileUpload = async (file: File, caption?: string) => {
    await uploadFile(file, caption);
  };

  const handleLinkShare = async (url: string, caption?: string) => {
    await shareLink(url, caption);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    handleKeyDown(e, handleSendMessage);
  };

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <div className="flex items-end gap-3">
        <MediaAttachmentModal
          onFileUpload={handleFileUpload}
          onLinkShare={handleLinkShare}
          isUploading={isUploading}
        />

        <TextArea
          value={message}
          onChange={setMessage}
          onKeyDown={onKeyDown}
          disabled={isLoading}
        />

        <ActionButtons
          onSendMessage={handleSendMessage}
          canSend={message.trim().length > 0}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}