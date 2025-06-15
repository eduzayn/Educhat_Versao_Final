import { Phone, Video, Mail, CheckCircle, MessageSquare } from 'lucide-react';

export const activityTypes = {
  call: { icon: Phone, color: "bg-blue-500", label: "Ligação" },
  meeting: { icon: Video, color: "bg-green-500", label: "Reunião" },
  email: { icon: Mail, color: "bg-purple-500", label: "E-mail" },
  task: { icon: CheckCircle, color: "bg-orange-500", label: "Tarefa" },
  message: { icon: MessageSquare, color: "bg-cyan-500", label: "Mensagem" }
};

export const statusMap = {
  completed: { label: "Concluída", variant: "default" as const },
  scheduled: { label: "Agendada", variant: "secondary" as const },
  pending: { label: "Pendente", variant: "outline" as const },
  cancelled: { label: "Cancelada", variant: "destructive" as const }
}; 