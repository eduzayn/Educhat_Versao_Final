import type { AILog } from '../../IAPage/types';

export interface LogsSectionProps {
  logs: AILog[] | undefined;
  logsLoading: boolean;
} 