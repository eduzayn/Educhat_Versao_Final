import { useState } from 'react';
import { DropdownMenuItem } from '@/shared/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/shared/ui/alert-dialog';
import { Loader2 } from 'lucide-react';
import { ConversationAction } from '@/modules/Inbox/components/ConversationActions/types/types';
import { Button } from "@/shared/ui/button";

interface ConversationActionItemProps {
  action: ConversationAction;
  isLoading: boolean;
  isDisabled: boolean;
  onExecute: (action: ConversationAction, showConfirmation?: boolean) => void;
  lastResult?: any;
}

export function ConversationActionItem({
  action,
  isLoading,
  isDisabled,
  onExecute,
  lastResult
}: ConversationActionItemProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleClick = () => {
    if (action.requiresConfirmation && !showConfirmation) {
      setShowConfirmation(true);
      return;
    }
    onExecute(action, true);
  };

  const handleConfirm = () => {
    setShowConfirmation(false);
    onExecute(action, true);
  };

  const handleCancel = () => {
    setShowConfirmation(false);
  };

  // Handle confirmation result from hook
  if (lastResult?.requiresConfirmation && lastResult.action?.id === action.id) {
    if (!showConfirmation) {
      setShowConfirmation(true);
    }
  }

  const ActionContent = (
    <DropdownMenuItem 
      onClick={handleClick}
      disabled={isDisabled}
      className="cursor-pointer"
    >
      <div className="flex items-center w-full">
        {isLoading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <action.icon className={`w-4 h-4 mr-2 ${action.color}`} />
        )}
        <span className={isDisabled ? 'text-muted-foreground' : ''}>{action.label}</span>
      </div>
    </DropdownMenuItem>
  );

  return (
    <>
      {action.tooltip ? (
        <Tooltip>
          <TooltipTrigger asChild>
            {ActionContent}
          </TooltipTrigger>
          <TooltipContent>
            <p>{action.tooltip}</p>
          </TooltipContent>
        </Tooltip>
      ) : (
        ActionContent
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar ação</AlertDialogTitle>
            <AlertDialogDescription>
              {action.confirmationMessage || `Tem certeza que deseja executar "${action.label}"?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}