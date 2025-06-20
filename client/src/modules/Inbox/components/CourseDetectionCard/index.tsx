import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { GraduationCap, BookOpen, Calendar } from 'lucide-react';

interface CourseInfo {
  courseName: string;
  courseType: string;
  courseKey: string;
}

interface CourseDetectionCardProps {
  courseInfo: CourseInfo;
  timestamp?: string;
}

export function CourseDetectionCard({ courseInfo, timestamp }: CourseDetectionCardProps) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'graduacao':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'pos-graduacao':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'extensao':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'livre':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'graduacao':
        return <GraduationCap className="h-4 w-4" />;
      case 'pos-graduacao':
        return <BookOpen className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const formatTypeName = (type: string) => {
    switch (type) {
      case 'graduacao':
        return 'Graduação';
      case 'pos-graduacao':
        return 'Pós-Graduação';
      case 'extensao':
        return 'Extensão';
      case 'livre':
        return 'Curso Livre';
      default:
        return type;
    }
  };

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800 mb-3">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100 flex items-center gap-2">
          <GraduationCap className="h-4 w-4" />
          Curso Detectado
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="font-semibold text-gray-900 dark:text-gray-100">
            {courseInfo.courseName}
          </div>
          
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary" 
              className={`${getTypeColor(courseInfo.courseType)} flex items-center gap-1`}
            >
              {getTypeIcon(courseInfo.courseType)}
              {formatTypeName(courseInfo.courseType)}
            </Badge>
            
            <Badge variant="outline" className="text-xs">
              {courseInfo.courseKey}
            </Badge>
          </div>
          
          {timestamp && (
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Detectado em {new Date(timestamp).toLocaleString('pt-BR')}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}