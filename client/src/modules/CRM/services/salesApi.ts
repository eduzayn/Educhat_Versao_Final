// Serviço de API para vendas do CRM

export const salesApi = {
  // Dashboard
  getDashboard: (params: { period: string; channel: string; salesperson: string }) =>
    fetch(`/api/sales/dashboard?period=${params.period}&channel=${params.channel}&salesperson=${params.salesperson}`),

  getCharts: (period: string) =>
    fetch(`/api/sales/charts?period=${period}`),

  // Commissions
  getCommissions: (params: { period: string; status: string; salesperson: string }) =>
    fetch(`/api/sales/commissions?period=${params.period}&status=${params.status}&salesperson=${params.salesperson}`),

  // Targets
  getTargets: (params: { period: string; status: string }) =>
    fetch(`/api/sales/targets?period=${params.period}&status=${params.status}`),

  saveTarget: (targetData: any, editingTargetId?: number) => {
    const url = editingTargetId ? `/api/sales/targets/${editingTargetId}` : '/api/sales/targets';
    const method = editingTargetId ? 'PUT' : 'POST';
    return fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(targetData)
    });
  },

  // Territories
  getTerritories: () =>
    fetch('/api/sales/territories'),

  saveTerritory: (territoryData: any, editingTerritoryId?: number) => {
    const url = editingTerritoryId ? `/api/sales/territories/${editingTerritoryId}` : '/api/sales/territories';
    const method = editingTerritoryId ? 'PUT' : 'POST';
    return fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(territoryData)
    });
  },

  deleteTerritory: (territoryId: number) =>
    fetch(`/api/sales/territories/${territoryId}`, { method: 'DELETE' }),

  // Coaching
  getCoaching: (salesperson: string) =>
    fetch(`/api/sales/coaching?salesperson=${salesperson}`),

  saveCoaching: (recordData: any, editingRecordId?: number) => {
    const url = editingRecordId ? `/api/sales/coaching/${editingRecordId}` : '/api/sales/coaching';
    const method = editingRecordId ? 'PUT' : 'POST';
    return fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recordData)
    });
  },

  // Leaderboard
  getLeaderboard: (params: { period: string; metric: string }) =>
    fetch(`/api/sales/leaderboard?period=${params.period}&metric=${params.metric}`),

  // Salespeople
  getSalespeople: () =>
    fetch('/api/sales/salespeople'),

  // Profiles
  getProfiles: () =>
    fetch('/api/sales/profiles'),
}; 