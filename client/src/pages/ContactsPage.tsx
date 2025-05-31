import { useState } from 'react';
import { Button } from '@/shared/ui/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/ui/card';
import { Input } from '@/shared/ui/ui/input';
import { Badge } from '@/shared/ui/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/shared/ui/ui/avatar';
import { Checkbox } from '@/shared/ui/ui/checkbox';
import { Search, Plus, Filter, Download, Eye, Edit, Phone, ChevronRight } from 'lucide-react';
import { useContacts, useZApiContacts, useValidatePhoneNumber, useBlockContact } from '@/shared/lib/hooks/useContacts';
import { useToast } from '@/shared/lib/hooks/use-toast';

export function ContactsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const { toast } = useToast();
  
  const { data: contacts = [], isLoading } = useContacts(searchQuery);
  const { data: zapiContacts, isLoading: zapiLoading } = useZApiContacts();
  const validatePhone = useValidatePhoneNumber();
  const blockContact = useBlockContact();

  const handleSelectContact = (contactId: number) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleSelectAll = () => {
    if (selectedContacts.length === contacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(contacts.map(c => c.id));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-educhat-light flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-educhat-primary mx-auto mb-4"></div>
          <p className="text-educhat-medium">Carregando contatos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-educhat-light">
      <div className="p-6">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
          <span>Contatos</span>
          <ChevronRight className="w-4 h-4" />
          <span className="text-educhat-dark">Lista de contatos</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-educhat-dark">Contatos</h1>
            <p className="text-educhat-medium">Gerencie seus contatos e integração WhatsApp</p>
          </div>
          <Button className="bg-educhat-primary hover:bg-educhat-secondary text-white">
            <Plus className="w-4 h-4 mr-2" />
            Novo Contato
          </Button>
        </div>

        {/* Main Content */}
        <div>
          {/* Lista de Contatos */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Contatos ({contacts.length})</CardTitle>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-educhat-medium w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Buscar contatos..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filtros
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Importar do WhatsApp
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Table Header */}
              <div className="border-b border-gray-200 bg-gray-50">
                <div className="grid grid-cols-12 gap-4 p-4 text-sm font-medium text-gray-600">
                  <div className="col-span-1">
                    <Checkbox 
                      checked={selectedContacts.length === contacts.length && contacts.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </div>
                  <div className="col-span-3">Nome</div>
                  <div className="col-span-2">Email</div>
                  <div className="col-span-2">Telefone</div>
                  <div className="col-span-1">Empresa</div>
                  <div className="col-span-1">Tipo</div>
                  <div className="col-span-1">Proprietário</div>
                  <div className="col-span-1">Tags</div>
                  <div className="col-span-1">Ações</div>
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-200">
                {contacts.length === 0 ? (
                  <div className="text-center py-12">
                    <Phone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Nenhum contato encontrado</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {searchQuery ? 'Tente buscar com outros termos' : 'Adicione seus primeiros contatos'}
                    </p>
                  </div>
                ) : (
                  contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="grid grid-cols-12 gap-4 p-4 text-sm hover:bg-gray-50 transition-colors"
                    >
                      <div className="col-span-1">
                        <Checkbox 
                          checked={selectedContacts.includes(contact.id)}
                          onCheckedChange={() => handleSelectContact(contact.id)}
                        />
                      </div>
                      
                      <div className="col-span-3 flex items-center space-x-3">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={contact.profileImageUrl || ''} alt={contact.name} />
                          <AvatarFallback className={`text-white text-xs ${
                            contact.phone?.includes('whatsapp') || contact.phone?.startsWith('55') 
                              ? 'bg-green-500' 
                              : contact.name.startsWith('M') 
                                ? 'bg-purple-500' 
                                : 'bg-blue-500'
                          }`}>
                            {contact.name.substring(0, 1).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-educhat-dark">{contact.name}</div>
                        </div>
                      </div>
                      
                      <div className="col-span-2 text-educhat-dark">
                        {contact.email || '-'}
                      </div>
                      
                      <div className="col-span-2 text-educhat-dark">
                        {contact.phone || '-'}
                      </div>
                      
                      <div className="col-span-1 text-educhat-dark">
                        -
                      </div>
                      
                      <div className="col-span-1">
                        <a href="#" className="text-blue-600 hover:text-blue-800 text-sm">
                          Contato
                        </a>
                      </div>
                      
                      <div className="col-span-1 text-gray-500">
                        Não atribuído
                      </div>
                      
                      <div className="col-span-1 text-gray-500">
                        -
                      </div>
                      
                      <div className="col-span-1">
                        <div className="flex items-center space-x-1">
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Ver">
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Editar">
                            <Edit className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination */}
              {contacts.length > 0 && (
                <div className="border-t border-gray-200 p-4 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Mostrando 1-{contacts.length} de {contacts.length} contatos
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" disabled>
                      Anterior
                    </Button>
                    <Button variant="outline" size="sm" className="bg-educhat-primary text-white">
                      1
                    </Button>
                    <Button variant="outline" size="sm" disabled>
                      Próximo
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}