import { AlertTriangle, Users, Clock } from "lucide-react";
import { Badge } from "@/shared/ui/badge";
import { Card, CardContent } from "@/shared/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip";
import { useCheckContactDuplicates, type DuplicateContactInfo } from "@/shared/lib/hooks/useContactDuplicates";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DuplicateContactAlertProps {
  phone: string | null;
  contactId?: number;
  className?: string;
  mode?: 'badge' | 'card' | 'tooltip';
}

/**
 * Componente para exibir alertas discretos de contatos duplicados
 * Suporta diferentes modos de exibição conforme o contexto
 */
export function DuplicateContactAlert({ 
  phone, 
  contactId, 
  className = "", 
  mode = 'badge' 
}: DuplicateContactAlertProps) {
  const { data: duplicateResult, isLoading } = useCheckContactDuplicates(
    phone || "", 
    contactId
  );

  // Não exibir se não há telefone ou não há duplicatas
  if (!phone || isLoading || !duplicateResult?.isDuplicate) {
    return null;
  }

  const { duplicates, channels, totalDuplicates } = duplicateResult;

  const formatLastActivity = (date: Date | null) => {
    if (!date) return 'Sem atividade recente';
    return formatDistanceToNow(new Date(date), { 
      addSuffix: true, 
      locale: ptBR 
    });
  };

  const AlertContent = () => (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-amber-700">
        <AlertTriangle className="h-4 w-4" />
        <span className="font-medium">Contato Duplicado</span>
      </div>
      <p className="text-sm text-gray-600">
        Este número está presente em {totalDuplicates} canal(is): {channels.join(', ')}
      </p>
      <div className="space-y-1">
        {duplicates.slice(0, 3).map((duplicate: DuplicateContactInfo) => (
          <div key={duplicate.contactId} className="text-xs bg-gray-50 p-2 rounded">
            <div className="font-medium">{duplicate.name}</div>
            <div className="text-gray-500">
              Canal: {duplicate.nomeCanal || duplicate.canalOrigem || 'Não definido'}
            </div>
            <div className="text-gray-500 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatLastActivity(duplicate.lastActivity)}
            </div>
            {duplicate.conversationCount > 0 && (
              <div className="text-gray-500">
                {duplicate.conversationCount} conversa(s)
              </div>
            )}
          </div>
        ))}
        {duplicates.length > 3 && (
          <div className="text-xs text-gray-500 italic">
            ... e mais {duplicates.length - 3} contato(s)
          </div>
        )}
      </div>
    </div>
  );

  if (mode === 'badge') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline" 
              className={`text-amber-700 border-amber-300 bg-amber-50 hover:bg-amber-100 cursor-help ${className}`}
            >
              <Users className="h-3 w-3 mr-1" />
              Duplicado
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-sm">
            <AlertContent />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (mode === 'tooltip') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`text-amber-600 hover:text-amber-700 cursor-help ${className}`}>
              <AlertTriangle className="h-4 w-4" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-sm">
            <AlertContent />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (mode === 'card') {
    return (
      <Card className={`border-amber-200 bg-amber-50 ${className}`}>
        <CardContent className="p-3">
          <AlertContent />
        </CardContent>
      </Card>
    );
  }

  return null;
}