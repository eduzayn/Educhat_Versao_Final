import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { 
  Clock, 
  Target,
  MessageSquare,
  FileText,
  AlertCircle,
  CheckCircle,
  Edit,
  Trash
} from "lucide-react";

interface CoachingRecord {
  id: number;
  salespersonId: number;
  salespersonName: string;
  date: string;
  type: 'feedback' | 'goal' | 'training';
  title: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  createdBy: string;
}

interface SalesCoachingHistoryProps {
  records: CoachingRecord[];
  onEdit: (record: CoachingRecord) => void;
  onDelete: (recordId: number) => void;
  canEdit: boolean;
}

export function SalesCoachingHistory({ 
  records, 
  onEdit, 
  onDelete,
  canEdit 
}: SalesCoachingHistoryProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="text-blue-600 border-blue-600"><AlertCircle className="h-3 w-3 mr-1" />Em Andamento</Badge>;
      case 'completed':
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="h-3 w-3 mr-1" />Concluído</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'feedback': return <MessageSquare className="h-4 w-4" />;
      case 'goal': return <Target className="h-4 w-4" />;
      case 'training': return <FileText className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Coaching</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {records.map((record) => (
            <div 
              key={record.id} 
              className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {getTypeIcon(record.type)}
                  <h3 className="font-medium">{record.title}</h3>
                  {getStatusBadge(record.status)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {record.content}
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Vendedor: {record.salespersonName}</span>
                  <span>•</span>
                  <span>Criado por: {record.createdBy}</span>
                  <span>•</span>
                  <span>Data: {new Date(record.date).toLocaleDateString()}</span>
                </div>
              </div>
              {canEdit && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(record)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(record.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
          {records.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum registro de coaching encontrado.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 