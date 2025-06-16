import { IAPageHeader } from './components/IAPageHeader';
import { IAPageTabs } from './components/IAPageTabs';

export default function IAPage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="space-y-6">
        <IAPageHeader />
        <IAPageTabs />
      </div>
    </div>
  );
}