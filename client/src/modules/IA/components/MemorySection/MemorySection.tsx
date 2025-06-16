import { MemoryStatsCards } from './MemoryStatsCards';
import { MemoryFilters } from './MemoryFilters';
import { MemoryList } from './MemoryList';
import { MemorySectionProps } from './types';

export function MemorySection({
  memoryStats,
  memoriesData,
  memoriesLoading,
  memoryStatsLoading,
  memoryFilter,
  selectedConversation,
  setMemoryFilter,
  setSelectedConversation
}: MemorySectionProps) {
  return (
    <div className="space-y-4">
      <MemoryStatsCards memoryStats={memoryStats} />
      <MemoryFilters 
        memoryFilter={memoryFilter}
        setMemoryFilter={setMemoryFilter}
        selectedConversation={selectedConversation}
        setSelectedConversation={setSelectedConversation}
      />
      <MemoryList 
        memoriesData={memoriesData}
        memoriesLoading={memoriesLoading}
      />
    </div>
  );
}