import { useState, useRef, useEffect, useMemo } from 'react';
import { useMessageSender } from './hooks/useMessageSender';
import { useQuickReplies, useIncrementQuickReplyUsage } from '@/shared/lib/hooks/useQuickReplies';
import { Textarea } from '@/shared/ui/textarea';
import { ActionButtons } from './ActionButtons';

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
  const incrementUsageMutation = useIncrementQuickReplyUsage();

  const { isLoading, isUploading, sendTextMessage, uploadFile, shareLink, sendAudio } = useMessageSender({
    conversationId,
    onSendMessage,
  });

  // Memoize quickReplies to prevent unnecessary re-renders
  const memoizedQuickReplies = useMemo(() => quickReplies, [quickReplies.length]);

  // Buscar respostas rápidas baseadas no texto digitado
  useEffect(() => {
    if (message.startsWith('/')) {
      const query = message.slice(1).toLowerCase();
      if (query.length > 0) {
        const filtered = memoizedQuickReplies.filter(qr => 
          qr.title.toLowerCase().includes(query) ||
          qr.shortcut?.toLowerCase().includes(query) ||
          qr.content?.toLowerCase().includes(query)
        );
        setFilteredReplies(filtered);
        setShowQuickReplies(filtered.length > 0);
        setSelectedIndex(0);
      } else {
        setFilteredReplies(memoizedQuickReplies.slice(0, 10));
        setShowQuickReplies(true);
        setSelectedIndex(0);
      }
    } else {
      setShowQuickReplies(false);
      setFilteredReplies([]);
    }
  }, [message, memoizedQuickReplies]);

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
    <div className="bg-white border-t border-gray-200 p-4 relative">
      {/* Quick Reply Dropdown */}
      <QuickReplyDropdown
        visible={showQuickReplies}
        filteredReplies={filteredReplies}
        onSelect={selectQuickReply}
        selectedIndex={selectedIndex}
      />



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
            placeholder="Digite sua mensagem ou use / para respostas rápidas..."
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