export interface DocumentProcessingResult {
  success: boolean;
  text?: string;
  summary?: string;
  keywords?: string[];
  category?: string;
  metadata?: {
    fileName: string;
    fileSize: number;
    pages?: number;
    wordCount: number;
    processedAt: Date;
  };
  error?: string;
} 