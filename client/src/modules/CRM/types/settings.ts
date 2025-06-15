// Tipos para configurações do CRM

export interface SystemSetting {
  id: number;
  key: string;
  value: string;
  type: string;
  description: string | null;
  category: string;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CRMSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
} 