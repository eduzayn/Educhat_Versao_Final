import { Checkbox } from '@/shared/ui/ui/checkbox';
import { Label } from '@/shared/ui/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/ui/tooltip';
import { HelpCircle } from 'lucide-react';

interface Permission {
  id: number;
  name: string;
  resource: string;
  action: string;
  description: string;
  category: string;
  isActive: boolean;
}

interface PermissionItemProps {
  permission: Permission;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  displayName?: string;
}

export function PermissionItem({ permission, checked, onCheckedChange, displayName }: PermissionItemProps) {
  const getDisplayName = () => {
    if (displayName) return displayName;
    
    // Mapear nomes técnicos para nomes amigáveis
    const nameMap: Record<string, string> = {
      'conversa:resolver': 'Resolver',
      'conversa:responder': 'Responder',
      'conversa:responder_outros': 'Responder conversas de outros',
      'conversa:responder_apenas_proprias': 'Responder apenas conversas dele',
      'conversa:limitar_horario_resposta': 'Limitar horário que pode responder',
      'conversa:limitar_canais_resposta': 'Limitar canais que pode responder',
      'conversa:impedir_palavras_proibidas': 'Impedir envio de palavras proibidas',
      'conversa:enviar_notas_privadas': 'Enviar notas privadas',
      'conversa:deletar_mensagens_outros': 'Deletar mensagens de outros membros',
      'conversa:deletar_propria_mensagem': 'Deletar própria mensagem',
      'conversa:iniciar_chat_ativo': 'Iniciar chat ativo',
      'conversa:iniciar_chat_nao_atribuida_outro': 'Somente pode iniciar chat ativo com conversa não atribuída a outro membro',
      'conversa:iniciar_chat_nao_atribuida': 'Somente pode iniciar chat ativo com conversa não atribuída',
      'conversa:iniciar_chat_sem_conversa': 'Somente pode iniciar chat ativo com contato sem conversa atribuída',
      'conversa:reabrir': 'Reabrir',
      'conversa:categorizar': 'Categorizar',
      'conversa:atribuir': 'Atribuir',
      'conversa:atribuir_apenas_grupo_membro': 'Somente pode atribuir para quem pertence ao grupo do membro',
      'conversa:mover_grupo': 'Mover para grupo',
      'conversa:mover_grupo_proprio': 'Somente pode mover para grupo que pertence',
      'conversa:iniciar_bot': 'Iniciar Bot',
      'conversa:agendar_mensagem': 'Agendar mensagem',
      'conversa:transferir': 'Transferir conversa',
      'conversa:ficar_invisivel_visualizar': 'Ficar invisível quando visualizar conversa',
      'conversa:nao_ver_visualizacao': 'Não pode ver quem está visualizando a conversa'
    };

    return nameMap[permission.name] || permission.name;
  };

  return (
    <TooltipProvider>
      <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg">
        <Checkbox
          id={permission.name}
          checked={checked}
          onCheckedChange={onCheckedChange}
        />
        <div className="flex-1 flex items-center space-x-2">
          <Label 
            htmlFor={permission.name} 
            className="text-sm font-medium cursor-pointer"
          >
            {getDisplayName()}
          </Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p className="text-sm">{permission.description}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}