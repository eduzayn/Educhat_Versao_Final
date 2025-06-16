import type { ProcessedDocument, DocumentStats } from '../../IAPage/types';

export interface DocumentsSectionProps {
  recentDocuments: ProcessedDocument[] | undefined;
  documentStats: DocumentStats | undefined;
  documentsLoading: boolean;
  documentStatsLoading: boolean;
} 