import { useState } from 'react';
import { Button } from '@/shared/ui/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/ui/card';
import { Input } from '@/shared/ui/ui/input';
import { Badge } from '@/shared/ui/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/shared/ui/ui/avatar';
import { Search, Plus, Phone, Mail, MapPin, Calendar, Shield, Eye, MoreVertical } from 'lucide-react';
import { useContacts, useZApiContacts, useValidatePhoneNumber, useBlockContact } from '@/shared/lib/hooks/useContacts';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/shared/lib/hooks/use-toast';

export function ContactsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const { toast } = useToast();
  
  const { data: contacts = [], isLoading } = useContacts(searchQuery);
  const { data: zapiContacts, isLoading: zapiLoading } = useZApiContacts();
  const validatePhone = useValidatePhoneNumber();
  const blockContact = useBlockContact();

  const handleValidatePhone = async (phone: string) => {
    try {
      const result = await validatePhone.mutateAsync(phone);
      toast({
        title: result.exists ? "Número válido" : "Número inválido",
        description: result.exists 
          ? "Este número possui WhatsApp" 
          : "Este número não possui WhatsApp",
        variant: result.exists ? "default" : "destructive"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao validar número",
        variant: "destructive"
      });
    }
  };

  const handleBlockContact = async (phone: string) => {
    try {
      await blockContact.mutateAsync(phone);
      toast({
        title: "Contato bloqueado",
        description: "O contato foi bloqueado com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao bloquear contato",
        variant: "destructive"
      });
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Contatos */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Contatos ({contacts.length})</CardTitle>
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
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors hover:bg-gray-50 ${
                        selectedContact?.id === contact.id ? 'border-educhat-primary bg-educhat-light' : 'border-gray-200'
                      }`}
                      onClick={() => setSelectedContact(contact)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={contact.profileImageUrl || ''} alt={contact.name} />
                            <AvatarFallback className="bg-educhat-primary text-white">
                              {contact.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-semibold text-educhat-dark">{contact.name}</h3>
                              <span className={`w-2 h-2 rounded-full ${contact.isOnline ? 'bg-green-400' : 'bg-gray-300'}`}></span>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-educhat-medium">
                              {contact.phone && (
                                <span className="flex items-center">
                                  <Phone className="w-3 h-3 mr-1" />
                                  {contact.phone}
                                </span>
                              )}
                              {contact.email && (
                                <span className="flex items-center">
                                  <Mail className="w-3 h-3 mr-1" />
                                  {contact.email}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {contact.phone && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleValidatePhone(contact.phone!);
                                }}
                                disabled={validatePhone.isPending}
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleBlockContact(contact.phone!);
                                }}
                                disabled={blockContact.isPending}
                              >
                                <Shield className="w-3 h-3" />
                              </Button>
                            </>
                          )}
                          <Button size="sm" variant="ghost">
                            <MoreVertical className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detalhes do Contato */}
          <div>
            {selectedContact ? (
              <Card>
                <CardHeader>
                  <CardTitle>Detalhes do Contato</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <Avatar className="w-20 h-20 mx-auto mb-4">
                      <AvatarImage src={selectedContact.profileImageUrl || ''} alt={selectedContact.name} />
                      <AvatarFallback className="bg-educhat-primary text-white text-lg">
                        {selectedContact.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="text-lg font-semibold text-educhat-dark">{selectedContact.name}</h3>
                    <div className="flex items-center justify-center space-x-1 mt-2">
                      <span className={`w-2 h-2 rounded-full ${selectedContact.isOnline ? 'bg-green-400' : 'bg-gray-300'}`}></span>
                      <span className={`text-sm ${selectedContact.isOnline ? 'text-green-600' : 'text-gray-500'}`}>
                        {selectedContact.isOnline ? 'Online' : 
                          selectedContact.lastSeenAt ? 
                            `Visto ${formatDistanceToNow(new Date(selectedContact.lastSeenAt), { addSuffix: true, locale: ptBR })}` :
                            'Nunca visto'
                        }
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {selectedContact.phone && (
                      <div className="flex items-center space-x-3">
                        <Phone className="w-4 h-4 text-educhat-medium" />
                        <span className="text-sm text-educhat-dark">{selectedContact.phone}</span>
                      </div>
                    )}
                    
                    {selectedContact.email && (
                      <div className="flex items-center space-x-3">
                        <Mail className="w-4 h-4 text-educhat-medium" />
                        <span className="text-sm text-educhat-dark">{selectedContact.email}</span>
                      </div>
                    )}
                    
                    {selectedContact.location && (
                      <div className="flex items-center space-x-3">
                        <MapPin className="w-4 h-4 text-educhat-medium" />
                        <span className="text-sm text-educhat-dark">{selectedContact.location}</span>
                      </div>
                    )}
                    
                    {selectedContact.age && (
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-4 h-4 text-educhat-medium" />
                        <span className="text-sm text-educhat-dark">{selectedContact.age} anos</span>
                      </div>
                    )}
                  </div>

                  {selectedContact.phone && (
                    <div className="pt-4 border-t space-y-2">
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => handleValidatePhone(selectedContact.phone)}
                        disabled={validatePhone.isPending}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Verificar WhatsApp
                      </Button>
                      
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => handleBlockContact(selectedContact.phone)}
                        disabled={blockContact.isPending}
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Bloquear Contato
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center p-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Phone className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-educhat-medium">Selecione um contato para ver os detalhes</p>
                </CardContent>
              </Card>
            )}

            {/* Contatos Z-API */}
            {zapiContacts && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <span className="text-green-600 mr-2">📱</span>
                    Contatos WhatsApp
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {zapiLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-educhat-primary mx-auto"></div>
                    </div>
                  ) : (
                    <div className="text-sm text-educhat-medium">
                      {zapiContacts.length || 0} contatos sincronizados
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}