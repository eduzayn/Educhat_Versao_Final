import { TrainingGuide } from './components/TrainingGuide';
import { AddContextForm } from './components/AddContextForm';
import { ContextsList } from './components/ContextsList';
import { ContextsSectionProps } from './types';

export function ContextsSection({ contexts, contextsLoading }: ContextsSectionProps) {
  return (
    <div className="space-y-4">
      <TrainingGuide />
      <AddContextForm />
      <ContextsList contexts={contexts} contextsLoading={contextsLoading} />
    </div>
  );
} 