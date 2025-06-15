import { GraduationCap, BookOpen } from 'lucide-react';
import { filterFormationTags, formatFormationTag } from './utils/tagUtils';

interface FormationSectionProps {
  tags?: string[] | null;
}

export function FormationSection({ tags }: FormationSectionProps) {
  if (!tags || !Array.isArray(tags)) {
    return (
      <div className="space-y-3">
        <h4 className="font-medium text-sm text-gray-900 flex items-center">
          <GraduationCap className="w-4 h-4 mr-2" />
          Área de Formação
        </h4>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500">
            Nenhuma formação identificada
          </p>
        </div>
      </div>
    );
  }

  const formationTags = filterFormationTags(tags);

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-sm text-gray-900 flex items-center">
        <GraduationCap className="w-4 h-4 mr-2" />
        Área de Formação
      </h4>
      
      {formationTags.length > 0 ? (
        <div className="space-y-2">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h5 className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-2 flex items-center">
              <BookOpen className="w-3 h-3 mr-1" />
              Cursos Concluídos
            </h5>
            <div className="space-y-1">
              {formationTags.map((tag: string, index: number) => (
                <div key={`formation-${index}`} className="bg-white border border-blue-100 p-2 rounded-md">
                  <p className="text-sm font-medium text-blue-800">
                    {formatFormationTag(tag)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-500">
            Nenhuma formação identificada
          </p>
        </div>
      )}
    </div>
  );
}