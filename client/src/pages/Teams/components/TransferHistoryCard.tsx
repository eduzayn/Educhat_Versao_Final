import { Card, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { ArrowRight, Clock, User } from 'lucide-react';

interface TransferHistory {
  id: number;
  conversationId: number;
  fromTeamId: number;
  toTeamId: number;
  fromTeamName: string;
  toTeamName: string;
  reason: string;
  transferredBy: string;
  transferredAt: string;
  contactName: string;
}

interface TransferHistoryCardProps {
  transfer: TransferHistory;
}

export function TransferHistoryCard({ transfer }: TransferHistoryCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('pt-BR'),
      time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const { date, time } = formatDate(transfer.transferredAt);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header com contato e transferência */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{transfer.contactName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{date} às {time}</span>
            </div>
          </div>

          {/* Transferência de equipes */}
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs">
              {transfer.fromTeamName}
            </Badge>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <Badge variant="secondary" className="text-xs">
              {transfer.toTeamName}
            </Badge>
          </div>

          {/* Motivo da transferência */}
          {transfer.reason && (
            <div className="text-sm text-muted-foreground italic bg-muted/50 p-2 rounded">
              "{transfer.reason}"
            </div>
          )}

          {/* Quem transferiu */}
          <div className="text-xs text-muted-foreground">
            Transferido por: <span className="font-medium">{transfer.transferredBy}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}