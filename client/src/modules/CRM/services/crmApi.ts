// Serviço de API do CRM

import { apiRequest } from '@/lib/queryClient';

export const crmApi = {
  // Deals
  getDeals: (params: { page?: number; limit?: number; team?: string; search?: string }) =>
    apiRequest('GET', `/api/deals?page=${params.page || 1}&limit=${params.limit || 50}&team=${params.team || ''}&search=${encodeURIComponent(params.search || '')}`),

  createDeal: (dealData: any) =>
    apiRequest('POST', '/api/deals', dealData),

  updateDeal: (dealId: number, stage: string) =>
    apiRequest('PATCH', `/api/deals/${dealId}`, { stage }),

  // Funnels
  getFunnels: () =>
    apiRequest('GET', '/api/funnels'),

  // System Settings
  getSystemSettings: () =>
    fetch('/api/system-settings'),

  updateSystemSetting: (setting: { key: string; value: string; type: string; description: string; category: string }) =>
    fetch('/api/system-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(setting)
    }),
}; 