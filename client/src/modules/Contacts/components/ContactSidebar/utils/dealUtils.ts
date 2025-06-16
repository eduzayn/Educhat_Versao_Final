import { getStagesForTeam, getTeamInfo } from '@/shared/lib/crmFunnels';

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value / 100);
};

export const getStageColor = (stage: string, team?: string) => {
  if (team) {
    const stages = getStagesForTeam(team);
    const stageInfo = stages.find(s => s.id === stage);
    if (stageInfo) {
      const colorMap: Record<string, string> = {
        'bg-gray-500': 'bg-gray-100 text-gray-800',
        'bg-blue-500': 'bg-blue-100 text-blue-800',
        'bg-yellow-500': 'bg-yellow-100 text-yellow-800',
        'bg-orange-500': 'bg-orange-100 text-orange-800',
        'bg-green-500': 'bg-green-100 text-green-800',
        'bg-red-500': 'bg-red-100 text-red-800',
        'bg-purple-500': 'bg-purple-100 text-purple-800',
        'bg-indigo-500': 'bg-indigo-100 text-indigo-800',
        'bg-emerald-500': 'bg-emerald-100 text-emerald-800',
        'bg-violet-500': 'bg-violet-100 text-violet-800'
      };
      return colorMap[stageInfo.color] || 'bg-gray-100 text-gray-800';
    }
  }
  return 'bg-gray-100 text-gray-800';
};

export const getStageLabel = (stage: string, team?: string) => {
  if (team) {
    const stages = getStagesForTeam(team);
    const stageInfo = stages.find(s => s.id === stage);
    if (stageInfo) {
      return stageInfo.name.toUpperCase();
    }
  }
  return stage.toUpperCase();
};

export const getTeamDescription = (team: string) => {
  return getTeamInfo(team)?.description;
};

export const getTeamName = (team: string) => {
  return getTeamInfo(team)?.name;
};