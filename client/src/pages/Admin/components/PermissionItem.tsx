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
      // Conversas
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
      'conversa:nao_ver_visualizacao': 'Não pode ver quem está visualizando a conversa',

      // Negociações
      'negocio:gerenciar': 'Gerenciar negociações',
      'negocio:ver_atribuidos_outros': 'Ver negociações atribuídas a outros',
      'negocio:ver_sem_atribuicao': 'Ver negociações sem atribuição',
      'negocio:ver_grupos_nao_pertence': 'Ver negociações de grupos que não pertence',
      'negocio:ver_sem_grupo': 'Ver negociações sem grupo',
      'negocio:excluir': 'Excluir negociação',
      'negocio:exportar': 'Exportar negociações',
      'negocio:voltar_etapa': 'Voltar para etapa anterior',
      'negocio:criar_contato_existente': 'Criar negócio se já contato tiver um negócio aberto',
      'negocio:gerenciar_conversa': 'Gerenciar as negociações da conversa',

      // Tarefas
      'tarefa:gerenciar': 'Gerenciar as tarefas da conversa',
      'tarefa:ver_atribuidas_outros': 'Ver tarefas atribuídas a outros',

      // Contatos
      'contato:gerenciar': 'Gerenciar contatos',
      'contato:exportar': 'Exportar contatos',
      'contato:mesclar': 'Mesclar contatos',
      'contato:ver_telefone_privado': 'Ver telefone de contatos privados',
      'contato:alterar_propriedades': 'Alterar propriedades do contato',
      'contato:esconder_telefone': 'Esconder telefone',
      'contato:proibir_alterar_celular': 'Proibir alterar celular',

      // Relatórios
      'relatorio:gerenciar': 'Gerenciar relatórios',
      'relatorio:exportar': 'Exportar relatórios',
      'relatorio:restringir_grupos': 'Restringir relatórios aos grupos do membro',
      'relatorio:restringir_membro': 'Restringir relatórios ao membro',

      // Ambiente
      'ambiente:salas': 'Salas',
      'ambiente:assinatura': 'Assinatura',
      'ambiente:campanhas': 'Campanhas',
      'ambiente:proibir_campanha_whatsapp': 'Proibir criar campanha de WhatsApp',
      'ambiente:agendamentos': 'Agendamentos',
      'ambiente:filtros': 'Filtros',
      'ambiente:workspace': 'Workspace',
      'ambiente:permissoes': 'Permissões',
      'ambiente:canais': 'Canais',
      'ambiente:membros': 'Membros',
      'ambiente:grupos': 'Grupos',
      'ambiente:horarios': 'Horários',
      'ambiente:campos': 'Campos',
      'ambiente:tags': 'Tags',
      'ambiente:frases_rapidas': 'Frases Rápidas',
      'ambiente:atribuicao_automatica': 'Atribuição automática',
      'ambiente:automacoes': 'Automações',
      'ambiente:bot': 'Bot',
      'ambiente:copiloto': 'Copiloto',
      'ambiente:cenarios': 'Cenários',
      'ambiente:integracoes': 'Integrações',
      'ambiente:auditoria': 'Auditoria',
      'ambiente:funis': 'Funis',
      'ambiente:produtos': 'Produtos',
      'ambiente:metas': 'Metas',
      'ambiente:base_conhecimento': 'Base de conhecimento',

      // Copiloto
      'copiloto:nao_mostrar_sugestoes': 'Não mostrar sugestões de respostas',

      // Outros
      'outros:bloquear_bots': 'Bloquear bots',
      'outros:nao_indisponivel_inativo': 'Não torna indisponível se ficar inativo',
      'outros:nao_offline_inativo': 'Não torna offline se ficar inativo',

      // Restrições
      'restricao:limitar_horario_disponivel': 'Limitar horário que pode ficar disponível',
      'restricao:nao_ficar_indisponivel': 'Não pode ficar indisponível',
      'restricao:nao_mudar_disponibilidade': 'Não pode mudar disponibilidade',
      'restricao:nao_mudar_info_perfil': 'Não pode mudar informação de perfil',
      'restricao:nao_acessar_salas': 'Não pode acessar as salas',
      'restricao:ver_membros_grupos_dms': 'Só pode ver membros que sejam dos seus grupos nos DMs',
      'restricao:nao_ver_notificacoes_canal': 'Não pode ver notificações de canal',
      'restricao:ver_canais_grupo_lista': 'Somente pode ver canais na lista se estiver no grupo do canal',
      'restricao:nao_marcar_lido_conversa': 'Não marca como lido ao abrir uma conversa',
      'restricao:nao_mostrar_aviso_expirando': 'Não mostrar aviso de ambiente expirando',
      'restricao:nao_gerenciar_widget': 'Não pode gerenciar widget'
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