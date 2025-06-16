export interface CRMAction {
  type: 'create_lead' | 'update_stage' | 'add_tag' | 'send_link' | 'schedule_followup' | 'transfer_team';
  contactId: number;
  conversationId: number;
  data: any;
  automated: boolean;
}

export interface LeadData {
  name?: string;
  email?: string;
  phone: string;
  courseInterest?: string;
  leadSource: string;
  stage: string;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
} 