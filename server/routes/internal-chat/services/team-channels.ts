import { Channel } from '../types/teams';

export async function createTeamChannel(teamId: number, teamName: string, teamDescription?: string): Promise<Channel> {
  try {
    console.log(`🏗️ Criando canal automático para equipe ${teamName} (ID: ${teamId})`);
    
    const channelData: Channel = {
      id: `team-${teamId}`,
      name: teamName,
      description: teamDescription || `Discussões da ${teamName}`,
      type: 'team',
      teamId: teamId,
      isPrivate: false,
      participants: [],
      unreadCount: 0
    };

    console.log(`✅ Canal criado automaticamente: ${channelData.name}`);
    return channelData;
  } catch (error) {
    console.error('❌ Erro ao criar canal de equipe:', error);
    throw error;
  }
}

// Exportar função para uso em outras partes do sistema
(global as any).createTeamChannel = createTeamChannel; 