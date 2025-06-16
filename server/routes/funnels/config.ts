export const FUNNEL_ROUTES = {
  BASE: '/api/funnels',
  TEAM_TYPE: '/api/funnels/team-type/:teamType',
  CREATE_MISSING: '/api/funnels/create-missing',
  UPDATE_DEALS: '/api/funnels/update-deals',
  INITIAL_STAGE: '/api/funnels/initial-stage/:teamType',
  TEAM: '/api/funnels/team/:teamId'
} as const;

export const TEAM_TYPES = {
  SALES: 'sales',
  SUPPORT: 'support',
  MARKETING: 'marketing'
} as const;

export const FUNNEL_STAGES = {
  INITIAL: 'initial',
  CONTACT: 'contact',
  QUALIFICATION: 'qualification',
  PROPOSAL: 'proposal',
  NEGOTIATION: 'negotiation',
  CLOSED: 'closed',
  LOST: 'lost'
} as const; 