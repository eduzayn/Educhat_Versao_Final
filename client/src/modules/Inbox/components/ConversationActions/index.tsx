import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/shared/ui/dropdown-menu';
import { MoreVertical } from 'lucide-react';
import { conversationActions } from './config/config';
import { ConversationActionItem } from './components/ConversationActionItem';
import { useConversationActions } from './hooks/useConversationActions';
import { ConversationActionsConfig } from './types/types';

export function ConversationActionsDropdown({
  conversationId,
  contactId,
  currentStatus = 'open',
  onActionComplete
}: ConversationActionsConfig) {
  const [isOpen, setIsOpen] = useState(false);
  
  const {
    executeAction,
    isActionLoading,
    isActionDisabled,
    isActionVisible,
    lastActionResult
  } = useConversationActions({
    conversationId,
    contactId,
    onActionComplete: (actionId, result) => {
      setIsOpen(false);
      onActionComplete?.(actionId, result);
    }
  });

  // Group actions by category
  const statusActions = conversationActions.filter(action => action.group === 'status');
  const regularActions = conversationActions.filter(action => action.group === 'actions');
  const advancedActions = conversationActions.filter(action => action.group === 'advanced');
  const dangerActions = conversationActions.filter(action => action.group === 'danger');

  const renderActionGroup = (actions: typeof conversationActions, showSeparator = true) => {
    const visibleActions = actions.filter(action => 
      isActionVisible(action, currentStatus || undefined)
    );

    if (visibleActions.length === 0) return null;

    return (
      <>
        {visibleActions.map(action => (
          <ConversationActionItem
            key={action.id}
            action={action}
            isLoading={isActionLoading(action.id)}
            isDisabled={isActionDisabled(action, currentStatus || undefined)}
            onExecute={executeAction}
            lastResult={lastActionResult}
          />
        ))}
        {showSeparator && <DropdownMenuSeparator />}
      </>
    );
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-muted/10"
          aria-label="Mais ações"
        >
          <MoreVertical className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        {/* Status Actions */}
        {renderActionGroup(statusActions)}
        
        {/* Regular Actions */}
        {renderActionGroup(regularActions)}
        
        {/* Advanced Actions */}
        {renderActionGroup(advancedActions)}
        
        {/* Danger Actions */}
        {renderActionGroup(dangerActions, false)}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

