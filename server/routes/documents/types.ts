export interface DocumentStats {
  totalDocuments: number;
  totalSizeMB: number;
  processingStats: {
    success: number;
    failed: number;
    pending: number;
  };
  typeDistribution: Array<{
    type: string;
    count: number;
  }>;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadDate: Date;
  status: 'pending' | 'processed' | 'failed';
  metadata?: Record<string, any>;
} 