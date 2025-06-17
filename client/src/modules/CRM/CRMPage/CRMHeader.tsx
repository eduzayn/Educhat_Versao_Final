import { useState } from "react";
import { Link } from "wouter";
import { Button } from '@/shared/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/shared/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/dialog';
import { Calendar } from '@/shared/ui/calendar';
import { ArrowLeft, Settings, Plus, MessageSquare, UserPlus, Target, Phone, Mail, Calendar as CalendarIcon, FileText } from "lucide-react";
import { useAuth } from '@/shared/lib/hooks/useAuth';
import { useCRMContext } from './CRMPage';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { ContactDialog } from '@/shared/components/ContactDialog';
import { CreateDealDialog } from '../components/CreateDealDialog';
import { ScheduleActivityDialog } from '../components/ScheduleActivityDialog';
import { EmailComposerDialog } from '../components/EmailComposerDialog';

export function CRMHeader({ onOpenSettings }: { onOpenSettings: () => void }) {
  const { user } = useAuth();
  const { dateFilter, setDateFilter } = useCRMContext();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  
  // Estados para os diálogos de ação rápida
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [showDealDialog, setShowDealDialog] = useState(false);
  const [showActivityDialog, setShowActivityDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);

  const handleDateSelect = (range: DateRange | undefined) => {
    setDateRange(range);
  };
  const canAccessSettings = (user as any)?.role === 'admin' || (user as any)?.role === 'gerente';

  const handlePeriodChange = (value: string) => {
    if (value === 'custom') {
      setShowDatePicker(true);
    } else {
      setDateFilter({ period: value });
    }
  };

  const handleDateRangeConfirm = () => {
    if (dateRange?.from && dateRange?.to) {
      setDateFilter({
        period: 'custom',
        startDate: dateRange.from,
        endDate: dateRange.to
      });
      setShowDatePicker(false);
    }
  };

  const getDisplayValue = () => {
    if (dateFilter.period === 'custom' && dateFilter.startDate && dateFilter.endDate) {
      return `${format(dateFilter.startDate, "dd/MM/yyyy", { locale: ptBR })} - ${format(dateFilter.endDate, "dd/MM/yyyy", { locale: ptBR })}`;
    }
    
    const periodLabels: Record<string, string> = {
      today: 'Hoje',
      week: 'Esta semana',
      month: 'Este mês',
      quarter: 'Este trimestre',
      year: 'Este ano',
      custom: 'Data personalizada'
    };
    
    return periodLabels[dateFilter.period] || 'Este mês';
  };

  return (
    <div className="border-b bg-background p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">CRM</h1>
            <p className="text-muted-foreground">
              Gerencie relacionamentos com clientes e oportunidades de negócio
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateFilter.period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-48">
              <SelectValue>{getDisplayValue()}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="week">Esta semana</SelectItem>
              <SelectItem value="month">Este mês</SelectItem>
              <SelectItem value="quarter">Este trimestre</SelectItem>
              <SelectItem value="year">Este ano</SelectItem>
              <SelectItem value="custom">Data personalizada</SelectItem>
            </SelectContent>
          </Select>
          
          <Dialog open={showDatePicker} onOpenChange={setShowDatePicker}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Selecionar Período Personalizado</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Selecione o período de data para filtrar os dados do CRM.
                </div>
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={handleDateSelect}
                  numberOfMonths={2}
                  locale={ptBR}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowDatePicker(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleDateRangeConfirm}
                    disabled={!dateRange?.from || !dateRange?.to}
                  >
                    Aplicar Filtro
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          {canAccessSettings && (
            <Button variant="outline" onClick={onOpenSettings}>
              <Settings className="h-4 w-4 mr-2" /> Configurações
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" /> Ação Rápida
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => window.open('/inbox', '_blank')}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Novo Atendimento
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowContactDialog(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Adicionar Contato
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowDealDialog(true)}>
                <Target className="h-4 w-4 mr-2" />
                Criar Negócio
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => window.open('/contacts', '_blank')}>
                <Phone className="h-4 w-4 mr-2" />
                Ligar para Contato
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowEmailDialog(true)}>
                <Mail className="h-4 w-4 mr-2" />
                Enviar Email
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowActivityDialog(true)}>
                <CalendarIcon className="h-4 w-4 mr-2" />
                Agendar Atividade
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open('/reports', '_blank')}>
                <FileText className="h-4 w-4 mr-2" />
                Gerar Relatório
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Diálogos para Ações Rápidas */}
      <ContactDialog 
        isOpen={showContactDialog} 
        onClose={() => setShowContactDialog(false)}
        onSuccess={() => setShowContactDialog(false)}
      />
      
      <CreateDealDialog 
        isOpen={showDealDialog} 
        onClose={() => setShowDealDialog(false)}
      />
      
      <ScheduleActivityDialog 
        isOpen={showActivityDialog} 
        onClose={() => setShowActivityDialog(false)}
      />
      
      <EmailComposerDialog 
        isOpen={showEmailDialog} 
        onClose={() => setShowEmailDialog(false)}
      />
    </div>
  );
} 