import { Tag } from 'lucide-react';
import { Badge } from '@/shared/ui/badge';
import { filterOtherTags } from './utils/tagUtils';

interface TagsSectionProps {
  tags?: string[] | null;
}

export function TagsSection({ tags }: TagsSectionProps) {
  if (!tags || !Array.isArray(tags)) {
    return null;
  }

  const otherTags = filterOtherTags(tags);
  
  if (otherTags.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h4 className="font-medium text-sm text-gray-900 flex items-center">
        <Tag className="w-4 h-4 mr-2" />
        Outras Classificações
      </h4>
      <div className="flex flex-wrap gap-1">
        {otherTags.map((tag: string, index: number) => (
          <Badge key={index} variant="outline" className="text-xs">
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  );
}