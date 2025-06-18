import { IAPageHeader } from '@/modules/IA/IAPage/IAPageHeader';
import { IAPageTabs } from '@/modules/IA/IAPage/IAPageTabs';

export default function IAPage() {
  return (
    <div className="w-full px-6 py-6">
      <div className="space-y-6">
        <IAPageHeader />
        <IAPageTabs />
      </div>
    </div>
  );
}