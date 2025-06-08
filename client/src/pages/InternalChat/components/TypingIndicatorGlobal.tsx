import { useEffect } from 'react';
import { useInternalChatStore } from '../../store/internalChatStore';

export function TypingIndicatorGlobal() {
  const { typingUsers, activeChannel } = useInternalChatStore();
  
  const activeTypingUsers = typingUsers.filter(user => 
    user.channelId === activeChannel
  );

  if (activeTypingUsers.length === 0) {
    return null;
  }

  const getTypingText = () => {
    if (activeTypingUsers.length === 1) {
      return `${activeTypingUsers[0].userName} está digitando...`;
    } else if (activeTypingUsers.length === 2) {
      return `${activeTypingUsers[0].userName} e ${activeTypingUsers[1].userName} estão digitando...`;
    } else {
      return `${activeTypingUsers.length} pessoas estão digitando...`;
    }
  };

  return (
    <div className="px-4 py-2 border-t bg-muted/30">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <span>{getTypingText()}</span>
      </div>
    </div>
  );
}