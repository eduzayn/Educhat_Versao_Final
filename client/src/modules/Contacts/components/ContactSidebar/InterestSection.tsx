import { Target } from 'lucide-react';
import { filterInterestTags, formatInterestTag } from './utils/tagUtils';

interface InterestSectionProps {
  tags?: string[] | null;
}

export function InterestSection({ tags }: InterestSectionProps) {
  if (!tags || !Array.isArray(tags)) {
    return (
      <div className="space-y-3">
        <h4 className="font-medium text-sm text-gray-900 flex items-center">
          <Target className="w-4 h-4 mr-2" />
          Área de Interesse
        </h4>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500">
            Nenhum interesse identificado
          </p>
        </div>
      </div>
    );
  }

  const interestTags = filterInterestTags(tags);

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm text-gray-900 flex items-center">
        <Target className="w-4 h-4 mr-2" />
        Área de Interesse
      </h4>
      
      {interestTags.length > 0 ? (
        <div className="space-y-2">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h5 className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-2 flex items-center">
              <Target className="w-3 h-3 mr-1" />
              Cursos de Interesse
            </h5>
            <div className="space-y-1">
              {interestTags.map((tag: string, index: number) => (
                <div key={`interest-${index}`} className="bg-white border border-blue-100 p-2 rounded-md">
                  <p className="text-sm font-medium text-blue-800">
                    {formatInterestTag(tag)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500">
            Nenhum interesse identificado
          </p>
        </div>
      )}
    </div>
  );
}