import { useState } from "react";
import { Button } from '@/shared/ui/ui/button';
import { Input } from '@/shared/ui/ui/input';
import { Badge } from '@/shared/ui/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/shared/ui/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/ui/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/ui/tabs';
import {
  Search,
  Filter,
  Columns,
  List,
  Plus,
  Building2,
  Calendar,
  MoreHorizontal,
  Edit,
  Trash,
  Kanban
} from "lucide-react";

const stages = [
  { id: 'prospecting', name: 'Prospecção', color: 'bg-gray-500' },
  { id: 'qualified', name: 'Qualificado', color: 'bg-blue-500' },
  { id: 'proposal', name: 'Proposta', color: 'bg-yellow-500' },
  { id: 'negotiation', name: 'Negociação', color: 'bg-orange-500' },
  { id: 'won', name: 'Fechado', color: 'bg-green-500' }
];

const mockDeals = [
  {
    id: "1",
    name: "João Silva - Pós em Psicanálise",
    company: "Particular",
    value: 1799,
    probability: 75,
    closeDate: "2025-06-20",
    stage: "qualified",
    owner: "Ana",
    ownerAvatar: "",
    tags: ["ead", "psicanálise"]
  },
  {
    id: "2",
    name: "Maria Oliveira - Segunda Licenciatura",
    company: "Professora Pública",
    value: 2071,
    probability: 40,
    closeDate: "2025-07-01",
    stage: "proposal",
    owner: "Eduardo",
    ownerAvatar: "",
    tags: ["ead", "licenciatura"]
  },
  {
    id: "3",
    name: "Pedro Santos - MBA Gestão",
    company: "Empresa Tech",
    value: 3200,
    probability: 90,
    closeDate: "2025-06-15",
    stage: "negotiation",
    owner: "Carlos",
    ownerAvatar: "",
    tags: ["presencial", "mba"]
  },
  {
    id: "4",
    name: "Ana Costa - Curso Técnico",
    company: "Estudante",
    value: 899,
    probability: 30,
    closeDate: "2025-08-01",
    stage: "prospecting",
    owner: "Lucia",
    ownerAvatar: "",
    tags: ["técnico", "ead"]
  }
];

export function DealsModule() {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("kanban");
  const [deals, setDeals] = useState(mockDeals);

  const filtered = deals.filter((deal) =>
    deal.name.toLowerCase().includes(search.toLowerCase()) ||
    deal.company.toLowerCase().includes(search.toLowerCase())
  );

  const getDealsForStage = (stageId: string) => filtered.filter(d => d.stage === stageId);

  const calculateStageValue = (deals: any[]) => deals.reduce((acc, deal) => acc + deal.value, 0);

  return (
    <div className="h-full flex flex-col">
      <div className="border-b p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Negócios</h2>
            <p className="text-muted-foreground">
              Gerencie seu pipeline de vendas
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar negócios..."
                className="pl-9 w-80"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" /> Filtros
            </Button>

            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('kanban')}
                className="rounded-r-none"
              >
                <Kanban className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            <Button>
              <Plus className="h-4 w-4 mr-2" /> Novo Negócio
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {viewMode === 'kanban' ? (
          <div className="h-full p-6">
            <div className="flex gap-6 h-full overflow-x-auto">
              {stages.map(stage => {
                const stageDeals = getDealsForStage(stage.id);
                return (
                  <div key={stage.id} className="min-w-80 bg-muted/30 rounded-lg p-4 flex flex-col">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                        <h3 className="font-medium">{stage.name}</h3>
                        <Badge variant="secondary">{stageDeals.length}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        R$ {calculateStageValue(stageDeals).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div className="space-y-3 flex-1 overflow-y-auto">
                      {stageDeals.map(deal => (
                        <Card key={deal.id} className="bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                          <CardContent className="p-3 space-y-2">
                            <div className="flex items-start justify-between">
                              <p className="text-sm font-medium leading-tight">{deal.name}</p>
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Building2 className="h-3 w-3" />
                              <span>{deal.company}</span>
                            </div>
                            <p className="text-sm text-green-600 font-semibold">
                              R$ {deal.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="text-xs">
                                {deal.probability}% prob.
                              </Badge>
                              <span className="text-xs text-muted-foreground">{deal.owner}</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {deal.tags.map((tag, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    <Button variant="ghost" className="w-full mt-3" size="sm">
                      <Plus className="h-4 w-4 mr-2" /> Adicionar Negócio
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="rounded-md border">
              <div className="grid grid-cols-7 gap-4 p-4 bg-muted font-medium text-sm">
                <div>Nome</div>
                <div>Empresa</div>
                <div>Valor</div>
                <div>Estágio</div>
                <div>Probabilidade</div>
                <div>Responsável</div>
                <div>Ações</div>
              </div>
              {filtered.map((deal) => (
                <div key={deal.id} className="grid grid-cols-7 gap-4 p-4 border-t items-center">
                  <div className="font-medium">{deal.name}</div>
                  <div className="text-muted-foreground">{deal.company}</div>
                  <div className="font-bold text-green-600">
                    R$ {deal.value.toLocaleString('pt-BR')}
                  </div>
                  <div>
                    <Badge variant="secondary" className="text-xs">
                      {stages.find(s => s.id === deal.stage)?.name}
                    </Badge>
                  </div>
                  <div>
                    <Badge variant="outline">{deal.probability}%</Badge>
                  </div>
                  <div className="text-muted-foreground">{deal.owner}</div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Trash className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}