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
  const { message, setMessage, clearMessage, handleKeyDown, selectQuickReply, quickReplies } = useMessageInput();
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
      {/* Quick Replies Popup */}
      {quickReplies.showQuickReplies && quickReplies.filteredQuickReplies.length > 0 && (
        <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-950 rounded-md border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">
            Respostas rápidas disponíveis:
          </p>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {quickReplies.filteredQuickReplies.map((reply, index) => (
              <div
                key={reply.id}
                className={`p-2 rounded cursor-pointer flex items-start gap-2 ${
                  index === quickReplies.selectedIndex
                    ? "bg-blue-500 text-white"
                    : "hover:bg-blue-100 dark:hover:bg-blue-900"
                }`}
                onClick={() => selectQuickReply(reply)}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{reply.title}</div>
                  <div className="text-xs opacity-75 truncate">{reply.content}</div>
                </div>
                {reply.shortcut && (
                  <div className="text-xs bg-blue-200 dark:bg-blue-800 px-1 rounded">
                    {reply.shortcut}
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-blue-500 dark:text-blue-400 mt-2">
            Use ↑↓ para navegar, Enter/Tab para selecionar, Esc para fechar
          </p>
        </div>
      )}

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