import type { TrainingContext } from '../../IAPage/types';

export interface ContextsSectionProps {
  contexts: TrainingContext[] | undefined;
  contextsLoading: boolean;
}

export interface NewContext {
  title: string;
  content: string;
  category: string;
}

export interface NewQA {
  question: string;
  answer: string;
  category: string;
}

export type ContextMode = 'content' | 'qa' | 'web'; 