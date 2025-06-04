import { useState } from "react";
import { Input } from '@/shared/ui/ui/input';
import { Button } from '@/shared/ui/ui/button';
import { Badge } from '@/shared/ui/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/shared/ui/ui/avatar';
import { 
  Search, 
  Plus, 
  Building2, 
  Users, 
  MapPin, 
  Phone, 
  Mail, 
  Globe,
  Edit,
  Trash2
} from "lucide-react";

const mockCompanies = [
  {
    id: "1",
    name: "Tech Solutions Ltda",
    segment: "Tecnologia",
    size: "50-100 funcionários",
    location: "São Paulo, SP",
    phone: "(11) 99999-1234",
    email: "contato@techsolutions.com",
    website: "www.techsolutions.com",
    logo: "",
    contactsCount: 12,
    dealsValue: 45000,
    status: "ativo"
  },
  {
    id: "2",
    name: "Educação Moderna",
    segment: "Educação",
    size: "20-50 funcionários",
    location: "Rio de Janeiro, RJ",
    phone: "(21) 88888-5678",
    email: "info@educacaomoderna.com",
    website: "www.educacaomoderna.com",
    logo: "",
    contactsCount: 8,
    dealsValue: 32000,
    status: "ativo"
  },
  {
    id: "3",
    name: "Saúde & Bem Estar",
    segment: "Saúde",
    size: "10-20 funcionários",
    location: "Belo Horizonte, MG",
    phone: "(31) 77777-9012",
    email: "contato@saudebemestar.com",
    website: "",
    logo: "",
    contactsCount: 5,
    dealsValue: 18500,
    status: "prospecto"
  }
];

export function CompaniesModule() {
  const [search, setSearch] = useState("");

  const filtered = mockCompanies.filter((company) =>
    company.name.toLowerCase().includes(search.toLowerCase()) ||
    company.segment.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header com busca */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Empresas</h2>
          <p className="text-muted-foreground">
            Gerencie empresas e organizações parceiras
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar empresas..."
              className="pl-9 w-80"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" /> Nova Empresa
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{mockCompanies.length}</div>
            <p className="text-sm text-muted-foreground">Total de Empresas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {mockCompanies.filter(c => c.status === 'ativo').length}
            </div>
            <p className="text-sm text-muted-foreground">Empresas Ativas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">
              {mockCompanies.reduce((sum, c) => sum + c.contactsCount, 0)}
            </div>
            <p className="text-sm text-muted-foreground">Total de Contatos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              R$ {mockCompanies.reduce((sum, c) => sum + c.dealsValue, 0).toLocaleString('pt-BR')}
            </div>
            <p className="text-sm text-muted-foreground">Valor em Negócios</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Empresas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filtered.map((company) => (
          <Card key={company.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={company.logo} />
                    <AvatarFallback>
                      <Building2 className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{company.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{company.segment}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Informações básicas */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{company.size}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{company.location}</span>
                </div>
                {company.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{company.phone}</span>
                  </div>
                )}
                {company.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{company.email}</span>
                  </div>
                )}
                {company.website && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span>{company.website}</span>
                  </div>
                )}
              </div>

              {/* Status e métricas */}
              <div className="flex items-center justify-between pt-3 border-t">
                <div className="flex items-center gap-2">
                  <Badge variant={company.status === 'ativo' ? 'default' : 'secondary'}>
                    {company.status}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {company.contactsCount} contatos
                  </div>
                  <div className="text-sm text-green-600 font-medium">
                    R$ {company.dealsValue.toLocaleString('pt-BR')}
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" className="flex-1">
                  Ver Contatos
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  Ver Negócios
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <div className="text-muted-foreground">
            {search 
              ? "Nenhuma empresa encontrada com os critérios de busca"
              : "Nenhuma empresa cadastrada no sistema"
            }
          </div>
          <Button className="mt-4">
            <Plus className="h-4 w-4 mr-2" /> Adicionar Primeira Empresa
          </Button>
        </div>
      )}
    </div>
  );
}