export interface WebContextCaptureProps {
  onContextAdded?: () => void;
}

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

export const CONTEXT_CATEGORIES = [
  'cursos',
  'suporte',
  'vendas',
  'institucional',
  'tecnico',
  'geral'
]; 