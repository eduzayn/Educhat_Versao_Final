import { useState, useRef, useEffect } from 'react';
import { useMessageInput } from './hooks/useMessageInput';
import { useMessageSender } from './hooks/useMessageSender';
import { useQuickReplies, useQuickReplySearch, useIncrementQuickReplyUsage } from '@/shared/lib/hooks/useQuickReplies';
import { TextArea } from './TextArea';
import { ActionButtons } from './ActionButtons';
import { QuickReplyChips } from './QuickReplyChips';
import { QuickReplyDropdown } from './QuickReplyDropdown';
import { MediaAttachmentModal } from '@/modules/Messages/components/MediaAttachmentModal';
import type { QuickReply } from '@shared/schema';

interface MessageInputProps {
  conversationId: number;
  onSendMessage?: () => void;
}

export function MessageInput({ conversationId, onSendMessage }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [filteredReplies, setFilteredReplies] = useState<QuickReply[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const { data: quickReplies = [] } = useQuickReplies();
  const searchMutation = useQuickReplySearch();
  const incrementUsageMutation = useIncrementQuickReplyUsage();

  const { isLoading, isUploading, sendTextMessage, uploadFile, shareLink, sendAudio } = useMessageSender({
    conversationId,
    onSendMessage,
  });

  // Buscar respostas rápidas baseadas no texto digitado
  useEffect(() => {
    if (message.startsWith('/')) {
      const query = message.slice(1).toLowerCase();
      if (query.length > 0) {
        const filtered = quickReplies.filter(qr => 
          qr.title.toLowerCase().includes(query) ||
          qr.shortcut?.toLowerCase().includes(query) ||
          qr.content?.toLowerCase().includes(query)
        );
        setFilteredReplies(filtered);
        setShowQuickReplies(filtered.length > 0);
        setSelectedIndex(0);
      } else {
        setFilteredReplies(quickReplies.slice(0, 10));
        setShowQuickReplies(true);
        setSelectedIndex(0);
      }
    } else {
      setShowQuickReplies(false);
      setFilteredReplies([]);
    }
  }, [message, quickReplies]);

  const selectQuickReply = (reply: QuickReply) => {
    if (reply.type === 'text') {
      setMessage(reply.content || reply.title);
    }
    setShowQuickReplies(false);
    setFilteredReplies([]);
    
    // Incrementar contador de uso
    incrementUsageMutation.mutate(reply.id);
    
    // Focar no textarea
    textAreaRef.current?.focus();
  };

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
    if (showQuickReplies && filteredReplies.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredReplies.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredReplies.length) % filteredReplies.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        selectQuickReply(filteredReplies[selectedIndex]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowQuickReplies(false);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
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
          onSendAudio={handleSendAudio}
          canSend={message.trim().length > 0}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}