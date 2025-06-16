import { DocumentStats } from './components/DocumentStats';
import { DocumentUpload } from './components/DocumentUpload';
import { DocumentSearch } from './components/DocumentSearch';
import { RecentDocuments } from './components/RecentDocuments';
import { DocumentsSectionProps } from './types';

export function DocumentsSection({
  recentDocuments,
  documentStats,
  documentsLoading,
  documentStatsLoading
}: DocumentsSectionProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DocumentStats stats={documentStats} isLoading={documentStatsLoading} />
      </div>
      <DocumentUpload />
      <DocumentSearch />
      <RecentDocuments documents={recentDocuments} isLoading={documentsLoading} />
    </div>
  );
} 