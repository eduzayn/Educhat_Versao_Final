import { Button } from "@/shared/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";
import { MessageSquare, StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";

interface InternalNoteToggleProps {
  isInternalNote: boolean;
  onToggle: (isInternalNote: boolean) => void;
}

export function InternalNoteToggle({
  isInternalNote,
  onToggle,
}: InternalNoteToggleProps) {
  return (
    <>
      {/* Indicador visual do modo de nota interna */}
      {isInternalNote && (
        <div className="mb-2 flex items-center gap-1.5 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-md text-xs text-amber-700 dark:text-amber-400 relative z-50 shadow-sm">
          <StickyNote className="h-3 w-3" />
          <span className="font-medium">
            Modo: Nota Interna (apenas equipe)
          </span>
        </div>
      )}

      {/* Botões de toggle entre Mensagem e Nota Interna */}
      <div className="absolute right-2 top-2.5 flex items-center gap-1.5">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
                  !isInternalNote ? "text-blue-600" : "text-gray-400",
                )}
                onClick={() => onToggle(false)}
              >
                <MessageSquare className="h-4.5 w-4.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Mensagem</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
                  isInternalNote ? "text-amber-600" : "text-gray-400",
                )}
                onClick={() => onToggle(true)}
              >
                <StickyNote className="h-4.5 w-4.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Nota Interna</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </>
  );
}