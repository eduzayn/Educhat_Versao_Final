import { useState } from "react";
import { Input } from '@/shared/ui/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/ui/select';
import { Button } from '@/shared/ui/ui/button';
import { Badge } from '@/shared/ui/ui/badge';
import { Card, CardContent } from '@/shared/ui/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/shared/ui/ui/avatar';
import { Search, MessageSquare, CalendarPlus, Plus } from "lucide-react";
import { useQuery } from '@tanstack/react-query';

export function ContactsModule() {
  const [canal, setCanal] = useState("");
  const [nomeCanal, setNomeCanal] = useState("");
  const [search, setSearch] = useState("");

  // Buscar contatos do sistema real
  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['/api/contacts', { search }],
    queryFn: async () => {
      const response = await fetch('/api/contacts');
      if (!response.ok) throw new Error('Erro ao carregar contatos');
      return response.json();
    }
  });

  const filtered = contacts.filter((c: any) => {
    return (
      (!canal || c.canalOrigem === canal) &&
      (!nomeCanal || (c.nomeCanal && c.nomeCanal.toLowerCase().includes(nomeCanal.toLowerCase()))) &&
      (!search || c.name.toLowerCase().includes(search.toLowerCase()))
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros e Busca */}
      <div className="flex gap-4 flex-wrap">
        <Input
          placeholder="Buscar por nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />

        <Select value={canal} onValueChange={setCanal}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Canal de origem" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos os canais</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
            <SelectItem value="facebook">Facebook</SelectItem>
            <SelectItem value="email">E-mail</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
          </SelectContent>
        </Select>

        <Input
          placeholder="Nome do canal (ex: WhatsApp Suporte)"
          value={nomeCanal}
          onChange={(e) => setNomeCanal(e.target.value)}
          className="max-w-sm"
        />

        <Button variant="outline">
          <Plus className="h-4 w-4 mr-2" /> Novo Contato
        </Button>
      </div>

      {/* Estatísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{contacts.length}</div>
            <p className="text-sm text-muted-foreground">Total de Contatos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{contacts.filter((c: any) => c.isOnline).length}</div>
            <p className="text-sm text-muted-foreground">Online Agora</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{contacts.filter((c: any) => c.canalOrigem === 'whatsapp').length}</div>
            <p className="text-sm text-muted-foreground">WhatsApp</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{filtered.length}</div>
            <p className="text-sm text-muted-foreground">Filtrados</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Contatos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((contact: any) => (
          <Card key={contact.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={contact.profileImageUrl} />
                  <AvatarFallback>{contact.name ? contact.name[0] : '?'}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col flex-1">
                  <span className="font-medium text-base">{contact.name}</span>
                  <span className="text-xs text-muted-foreground">{contact.phone || contact.email}</span>
                  {contact.nomeCanal && (
                    <span className="text-xs text-muted-foreground">{contact.nomeCanal}</span>
                  )}
                </div>
                {contact.isOnline && (
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                )}
              </div>

              <div className="flex gap-2 flex-wrap">
                {contact.canalOrigem && (
                  <Badge variant="secondary" className="text-xs">
                    {contact.canalOrigem}
                  </Badge>
                )}
                {contact.location && (
                  <Badge variant="outline" className="text-xs">
                    {contact.location}
                  </Badge>
                )}
                {contact.age && (
                  <Badge variant="outline" className="text-xs">
                    {contact.age} anos
                  </Badge>
                )}
              </div>

              {contact.lastSeenAt && (
                <div className="text-xs text-muted-foreground">
                  Último acesso: {new Date(contact.lastSeenAt).toLocaleDateString('pt-BR')}
                </div>
              )}

              <div className="flex gap-2">
                <Button size="sm" variant="ghost">
                  <MessageSquare className="h-4 w-4 mr-1" /> Conversar
                </Button>
                <Button size="sm" variant="ghost">
                  <CalendarPlus className="h-4 w-4 mr-1" /> Agendar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground">
            {search || canal || nomeCanal 
              ? "Nenhum contato encontrado com os filtros aplicados"
              : "Nenhum contato cadastrado no sistema"
            }
          </div>
        </div>
      )}
    </div>
  );
}