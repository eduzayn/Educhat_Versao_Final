import { useState } from "react";
import { Button } from '@/shared/ui/ui/button';
import { Input } from '@/shared/ui/ui/input';
import { Badge } from '@/shared/ui/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/shared/ui/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/ui/ui/card';
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
  Trash
} from "lucide-react";

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
    name: "Ana Costa - Curso de Inglês",
    company: "Freelancer",
    value: 899,
    probability: 25,
    closeDate: "2025-07-10",
    stage: "initial",
    owner: "Lucia",
    ownerAvatar: "",
    tags: ["online", "idiomas"]
  }
];

export function DealsModule() {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  const filtered = mockDeals.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

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

            <Button variant="outline" className="bg-accent">
              <Filter className="h-4 w-4 mr-2" /> Filtros
            </Button>

            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('kanban')}
                className="rounded-r-none"
              >
                <Columns className="h-4 w-4" />
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

      <div className="flex-1 overflow-auto p-6">
        {viewMode === 'kanban' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((deal) => (
              <Card key={deal.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium text-sm leading-tight">{deal.name}</h4>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Building2 className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{deal.company}</span>
                  </div>

                  <div className="text-lg font-bold text-green-600">
                    R$ {deal.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Probabilidade</span>
                      <span>{deal.probability}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div
                        className="bg-primary h-1.5 rounded-full transition-all"
                        style={{ width: `${deal.probability}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Fechamento: {new Date(deal.closeDate).toLocaleDateString('pt-BR')}</span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {deal.tags.map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <div className="text-xs text-muted-foreground">
                      Responsável: {deal.owner}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="border rounded-lg">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="p-3 text-left text-sm font-medium">Nome</th>
                    <th className="p-3 text-left text-sm font-medium">Empresa</th>
                    <th className="p-3 text-left text-sm font-medium">Valor</th>
                    <th className="p-3 text-left text-sm font-medium">Probabilidade</th>
                    <th className="p-3 text-left text-sm font-medium">Fechamento</th>
                    <th className="p-3 text-left text-sm font-medium">Responsável</th>
                    <th className="p-3 text-left text-sm font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((deal) => (
                    <tr key={deal.id} className="border-b hover:bg-muted/30">
                      <td className="p-3">
                        <div>
                          <div className="font-medium text-sm">{deal.name}</div>
                          <div className="flex gap-1 mt-1">
                            {deal.tags.map((tag, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">{deal.company}</td>
                      <td className="p-3 text-sm font-medium text-green-600">
                        R$ {deal.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{deal.probability}%</span>
                          <div className="w-16 bg-muted rounded-full h-1.5">
                            <div
                              className="bg-primary h-1.5 rounded-full"
                              style={{ width: `${deal.probability}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {new Date(deal.closeDate).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">{deal.owner}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Trash className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}