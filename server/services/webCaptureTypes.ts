export interface WebCaptureResult {
  title: string;
  content: string;
  summary: string;
  keywords: string[];
  url: string;
  metadata: {
    domain: string;
    wordCount: number;
    extractedAt: string;
  };
} 