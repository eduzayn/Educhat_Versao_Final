export interface AILog {
  id: number;
  message: string;
  classification: {
    intent: string;
    sentiment: string;
    confidence: number;
    aiMode: string;
  };
  response: string;
  processingTime: number;
  createdAt: string;
}

export interface LogsSectionProps {
  logs: AILog[] | undefined;
  logsLoading: boolean;
} 