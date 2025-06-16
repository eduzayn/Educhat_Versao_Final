/**
 * Mapeamento de estágios iniciais por tipo de equipe
 */
export const getInitialStageByTeamType = (teamType: string): string => {
  const stageMapping: { [key: string]: string } = {
    'comercial': 'prospecting',
    'suporte': 'atendimento-inicial',
    'cobranca': 'pendencia-identificada', 
    'secretaria': 'solicitacao-recebida',
    'tutoria': 'duvida-identificada',
    'financeiro': 'analise-inicial',
    'secretaria_pos': 'documentos-inicial'
  };

  return stageMapping[teamType] || 'prospecting';
}; 