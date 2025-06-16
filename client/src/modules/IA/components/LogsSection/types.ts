import type { AILog } from '../../IAPage/types';

export type { AILog };

export interface LogsSectionProps {
  logs: AILog[] | undefined;
  logsLoading: boolean;
} 