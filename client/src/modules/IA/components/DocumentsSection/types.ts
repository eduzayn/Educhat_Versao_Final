export interface ProcessedDocument {
  id: number;
  name: string;
  type: string;
  content: string;
  metadata: {
    pages?: number;
    wordCount?: number;
  };
  createdAt: string;
}

export interface DocumentStats {
  total: number;
  processed: number;
  errors: number;
  totalPages: number;
}

export interface DocumentsSectionProps {
  recentDocuments: ProcessedDocument[] | undefined;
  documentStats: DocumentStats | undefined;
  documentsLoading: boolean;
  documentStatsLoading: boolean;
} 