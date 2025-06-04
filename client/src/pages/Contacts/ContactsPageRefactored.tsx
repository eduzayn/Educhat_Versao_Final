import { useState } from 'react';
import { Button } from '@/shared/ui/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/ui/card';
import { Input } from '@/shared/ui/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/ui/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/shared/ui/ui/alert-dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/shared/ui/ui/avatar';
import { Checkbox } from '@/shared/ui/ui/checkbox';
import { Search, Plus, Filter, Download, Eye, Edit, Trash2, Phone, ChevronRight, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/ui/select';
import { Textarea } from '@/shared/ui/ui/textarea';
import { Badge } from '@/shared/ui/ui/badge';
import { useContacts, useUpdateContact, useCreateContact, useDeleteContact, useImportZApiContacts, useZApiContactMetadata, useZApiProfilePicture } from '@/shared/lib/hooks/useContacts';
import { useToast } from '@/shared/lib/hooks/use-toast';
import { useZApiStore } from '@/shared/store/zapiStore';
import { useGlobalZApiMonitor } from '@/shared/lib/hooks/useGlobalZApiMonitor';
import { ZApiStatusIndicator } from '@/modules/Settings/ChannelsSettings/components/ZApiStatusIndicator';
import type { Contact } from '@shared/schema';
import { BackButton } from '@/shared/components/BackButton';

export function ContactsPageRefactored() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [viewingContact, setViewingContact] = useState<Contact | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '' });
  const [isCreating, setIsCreating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const contactsPerPage = 50;
  const [createForm, setCreateForm] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    company: '', 
    address: '', 
    contactType: 'Lead', 
    owner: '', 
    notes: '' 
  });
  const [newTags, setNewTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [selectedContactPhone, setSelectedContactPhone] = useState<string | null>(null);
  const [profilePicturePhone, setProfilePicturePhone] = useState<string | null>(null);
  const [updatingAllPhotos, setUpdatingAllPhotos] = useState(false);
  const { toast } = useToast();
  
  // Integração com Z-API para comunicação em tempo real
  const { status: zapiStatus, isConfigured } = useZApiStore();
  useGlobalZApiMonitor();
  
  // Verificar se WhatsApp está disponível para sincronização
  const isWhatsAppAvailable = isConfigured && zapiStatus?.connected && zapiStatus?.smartphoneConnected;
  
  const { data: allContacts = [], isLoading } = useContacts(searchQuery);
  const updateContact = useUpdateContact();
  const createContact = useCreateContact();
  const deleteContact = useDeleteContact();
  const importZApiContacts = useImportZApiContacts();
  
  // Hook para buscar metadados detalhados do contato via Z-API
  const { data: contactMetadata, isLoading: loadingMetadata, refetch: fetchMetadata } = useZApiContactMetadata(selectedContactPhone);
  
  // Hook para buscar foto de perfil atualizada via Z-API
  const { data: profilePicture, isLoading: loadingProfilePicture, refetch: fetchProfilePicture } = useZApiProfilePicture(profilePicturePhone);

  // Calcular paginação
  const totalContacts = allContacts.length;
  const totalPages = Math.ceil(totalContacts / contactsPerPage);
  const startIndex = (currentPage - 1) * contactsPerPage;
  const endIndex = startIndex + contactsPerPage;
  const contacts = allContacts.slice(startIndex, endIndex);

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

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
  };

  const handleViewContact = (contact: Contact) => {
    setViewingContact(contact);
    setSelectedContactPhone(null); // Reset metadata
    setProfilePicturePhone(null); // Reset profile picture
  };

  const handleFetchWhatsAppMetadata = (phone: string) => {
    setSelectedContactPhone(phone);
  };

  const handleFetchProfilePicture = (phone: string) => {
    setProfilePicturePhone(phone);
  };

  const handleUpdateAllProfilePictures = async () => {
    if (!isWhatsAppAvailable) {
      toast({
        title: "WhatsApp não conectado",
        description: "Configure o WhatsApp nas Configurações → Canais para atualizar fotos.",
        variant: "destructive"
      });
      return;
    }

    setUpdatingAllPhotos(true);
    try {
      const response = await fetch('/api/contacts/update-profile-pictures', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Falha ao atualizar fotos de perfil');
      }

      const result = await response.json();
      
      toast({
        title: "Fotos atualizadas",
        description: `${result.updated} fotos de perfil foram atualizadas com sucesso.`
      });

      // Recarregar a lista de contatos para mostrar as fotos atualizadas
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar as fotos de perfil.",
        variant: "destructive"
      });
    } finally {
      setUpdatingAllPhotos(false);
    }
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setEditForm({
      name: contact.name,
      email: contact.email || '',
      phone: contact.phone || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editingContact) return;
    
    try {
      await updateContact.mutateAsync({
        id: editingContact.id,
        contact: editForm
      });
      
      toast({
        title: "Contato atualizado",
        description: "As informações do contato foram salvas com sucesso."
      });
      
      setEditingContact(null);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o contato.",
        variant: "destructive"
      });
    }
  };

  const handleAddTag = () => {
    if (currentTag.trim() && !newTags.includes(currentTag.trim())) {
      setNewTags([...newTags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setNewTags(newTags.filter(tag => tag !== tagToRemove));
  };

  const handleCreateContact = async () => {
    try {
      // First, try to add contact to Z-API WhatsApp
      if (createForm.phone && isWhatsAppAvailable) {
        try {
          const [firstName, ...lastNameParts] = createForm.name.split(' ');
          const lastName = lastNameParts.join(' ');
          
          const response = await fetch("/api/zapi/contacts/add", {
            method: "POST",
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              firstName,
              lastName,
              phone: createForm.phone
            })
          });
          
          if (!response.ok) {
            throw new Error(`Failed to add contact to WhatsApp: ${response.status}`);
          }
          
          toast({
            title: "Contato adicionado ao WhatsApp",
            description: "O contato foi adicionado à sua agenda do WhatsApp."
          });
        } catch (zapiError) {

          toast({
            title: "Aviso",
            description: "Contato criado no sistema, mas não foi possível adicionar ao WhatsApp.",
            variant: "destructive"
          });
        }
      }
      
      // Then create in local database
      await createContact.mutateAsync({
        name: createForm.name,
        email: createForm.email,
        phone: createForm.phone
      });
      
      toast({
        title: "Contato criado",
        description: isWhatsAppAvailable && createForm.phone 
          ? "Contato criado no sistema e adicionado ao WhatsApp." 
          : "Contato criado no sistema."
      });
      
      setIsCreating(false);
      setCreateForm({ 
        name: '', 
        email: '', 
        phone: '', 
        company: '', 
        address: '', 
        contactType: 'Lead', 
        owner: '', 
        notes: '' 
      });
      setNewTags([]);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar o contato.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteContact = (contact: Contact) => {
    setContactToDelete(contact);
  };

  const handleConfirmDelete = async (contactId: number) => {
    try {
      await deleteContact.mutateAsync(contactId);
      toast({
        title: "Contato excluído",
        description: "O contato foi removido com sucesso."
      });
      setContactToDelete(null);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o contato.",
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
        <BackButton to="/" label="Voltar ao Dashboard" />
        
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
            <div className="flex items-center gap-4">
              <p className="text-educhat-medium">Gerencie seus contatos e integração WhatsApp</p>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Status WhatsApp:</span>
                <ZApiStatusIndicator />
              </div>
            </div>
          </div>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button className="bg-educhat-primary hover:bg-educhat-secondary text-white">
                <Plus className="w-4 h-4 mr-2" />
                Novo Contato
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">Novo Contato</DialogTitle>
                {isWhatsAppAvailable && (
                  <p className="text-sm text-green-600 bg-green-50 p-2 rounded-md mt-2">
                    ✓ Contatos com telefone serão automaticamente adicionados ao seu WhatsApp
                  </p>
                )}
                {!isWhatsAppAvailable && (
                  <p className="text-sm text-gray-500 bg-gray-50 p-2 rounded-md mt-2">
                    ⚠ WhatsApp não conectado. Configure nas Configurações → Canais para sincronização automática
                  </p>
                )}
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {/* Nome completo */}
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Nome completo</label>
                  <Input
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="Nome do contato"
                    className="w-full"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Email</label>
                  <Input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>

                {/* Telefone */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Telefone</label>
                  <Input
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    placeholder="+55 11 99999-9999"
                  />
                </div>

                {/* Empresa */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Empresa</label>
                  <Input
                    value={createForm.company}
                    onChange={(e) => setCreateForm({ ...createForm, company: e.target.value })}
                    placeholder="Nome da empresa"
                  />
                </div>

                {/* Tipo de contato */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Tipo de contato</label>
                  <Select value={createForm.contactType} onValueChange={(value) => setCreateForm({ ...createForm, contactType: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Lead">Lead</SelectItem>
                      <SelectItem value="Cliente">Cliente</SelectItem>
                      <SelectItem value="Parceiro">Parceiro</SelectItem>
                      <SelectItem value="Fornecedor">Fornecedor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Endereço */}
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Endereço</label>
                  <Input
                    value={createForm.address}
                    onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                    placeholder="Rua, número, complemento"
                  />
                </div>

                {/* Proprietário */}
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Proprietário</label>
                  <Select value={createForm.owner} onValueChange={(value) => setCreateForm({ ...createForm, owner: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o proprietário" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="João da Silva">João da Silva</SelectItem>
                      <SelectItem value="Maria Santos">Maria Santos</SelectItem>
                      <SelectItem value="Pedro Oliveira">Pedro Oliveira</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Tags */}
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Tags</label>
                  <div className="space-y-2">
                    {newTags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {newTags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            {tag}
                            <X 
                              className="w-3 h-3 cursor-pointer hover:text-red-500" 
                              onClick={() => handleRemoveTag(tag)}
                            />
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Input
                        value={currentTag}
                        onChange={(e) => setCurrentTag(e.target.value)}
                        placeholder="Nova tag"
                        onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                        className="flex-1"
                      />
                      <Button type="button" onClick={handleAddTag} variant="outline" size="sm">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    {newTags.length === 0 && (
                      <p className="text-sm text-gray-500">Nenhuma tag adicionada</p>
                    )}
                  </div>
                </div>

                {/* Notas */}
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Notas</label>
                  <Textarea
                    value={createForm.notes}
                    onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })}
                    placeholder="Adicione observações importantes sobre este contato"
                    rows={4}
                    className="resize-none"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsCreating(false);
                    setCreateForm({ 
                      name: '', 
                      email: '', 
                      phone: '', 
                      company: '', 
                      address: '', 
                      contactType: 'Lead', 
                      owner: '', 
                      notes: '' 
                    });
                    setNewTags([]);
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreateContact}
                  disabled={createContact.isPending || !createForm.name.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                >
                  {createContact.isPending ? 'Criando...' : 'Criar Contato'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Modal de Visualização */}
        <Dialog open={!!viewingContact} onOpenChange={(open) => !open && setViewingContact(null)}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes do Contato</DialogTitle>
            </DialogHeader>
            {viewingContact && (
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={profilePicture?.link || contactMetadata?.imgUrl || viewingContact.profileImageUrl || ''} alt={viewingContact.name} />
                    <AvatarFallback className={`text-white ${
                      viewingContact.phone?.includes('whatsapp') || viewingContact.phone?.startsWith('55') 
                        ? 'bg-green-500' 
                        : viewingContact.name.startsWith('M') 
                          ? 'bg-purple-500' 
                          : 'bg-blue-500'
                    }`}>
                      {viewingContact.name.substring(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{contactMetadata?.name || viewingContact.name}</h3>
                    <p className="text-sm text-gray-500">
                      {viewingContact.isOnline ? 'Online' : 'Offline'}
                    </p>
                    {viewingContact.phone && isWhatsAppAvailable && (
                      <div className="flex gap-2 mt-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleFetchWhatsAppMetadata(viewingContact.phone || '')}
                          disabled={loadingMetadata}
                        >
                          {loadingMetadata ? 'Carregando...' : 'Buscar Info WhatsApp'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleFetchProfilePicture(viewingContact.phone || '')}
                          disabled={loadingProfilePicture}
                        >
                          {loadingProfilePicture ? 'Carregando...' : 'Atualizar Foto'}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Informações Básicas */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email:</label>
                    <p className="text-sm">{viewingContact.email || 'Não informado'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Telefone:</label>
                    <p className="text-sm">{viewingContact.phone || 'Não informado'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Localização:</label>
                    <p className="text-sm">{viewingContact.location || 'Não informado'}</p>
                  </div>
                  {viewingContact.age && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Idade:</label>
                      <p className="text-sm">{viewingContact.age} anos</p>
                    </div>
                  )}
                </div>

                {/* Metadados do WhatsApp */}
                {contactMetadata && (
                  <div className="border-t pt-4">
                    <h4 className="text-lg font-semibold mb-3 text-green-600">Informações do WhatsApp</h4>
                    <div className="grid grid-cols-1 gap-3">
                      {contactMetadata.notify && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Nome no WhatsApp:</label>
                          <p className="text-sm">{contactMetadata.notify}</p>
                        </div>
                      )}
                      {contactMetadata.short && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Nome Curto:</label>
                          <p className="text-sm">{contactMetadata.short}</p>
                        </div>
                      )}
                      {contactMetadata.vname && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Nome do VCard:</label>
                          <p className="text-sm">{contactMetadata.vname}</p>
                        </div>
                      )}
                      <div>
                        <label className="text-sm font-medium text-gray-700">Telefone (WhatsApp):</label>
                        <p className="text-sm">{contactMetadata.phone}</p>
                      </div>
                      {contactMetadata.imgUrl && (
                        <div>
                          <label className="text-sm font-medium text-gray-700">Foto do Perfil:</label>
                          <p className="text-xs text-gray-500 mb-2">URL válida por 48 horas</p>
                          <img 
                            src={contactMetadata.imgUrl} 
                            alt="Foto do perfil" 
                            className="w-20 h-20 rounded-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de Edição */}
        <Dialog open={!!editingContact} onOpenChange={(open) => !open && setEditingContact(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Editar Contato</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Nome</label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Nome do contato"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Telefone</label>
                <Input
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="+55 11 99999-9999"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setEditingContact(null)}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSaveEdit}
                  disabled={updateContact.isPending}
                >
                  {updateContact.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de Confirmação de Exclusão */}
        <AlertDialog open={!!contactToDelete} onOpenChange={(open) => !open && setContactToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir contato</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir o contato "{contactToDelete?.name}"? 
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setContactToDelete(null)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (contactToDelete) {
                    handleConfirmDelete(contactToDelete.id);
                  }
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

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
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => importZApiContacts.mutate()}
                    disabled={importZApiContacts.isPending || !isWhatsAppAvailable}
                    title={!isWhatsAppAvailable ? 'WhatsApp não está conectado. Configure nas Configurações → Canais' : 'Sincronizar contatos do WhatsApp'}
                    className={isWhatsAppAvailable ? 'border-green-200 text-green-700 hover:bg-green-50' : 'border-gray-200 text-gray-400'}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {importZApiContacts.isPending ? 'Sincronizando...' : 'Sincronizar WhatsApp'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleUpdateAllProfilePictures}
                    disabled={updatingAllPhotos || !isWhatsAppAvailable}
                    title={!isWhatsAppAvailable ? 'WhatsApp não está conectado. Configure nas Configurações → Canais' : 'Atualizar fotos de perfil de todos os contatos'}
                    className={isWhatsAppAvailable ? 'border-blue-200 text-blue-700 hover:bg-blue-50' : 'border-gray-200 text-gray-400'}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {updatingAllPhotos ? 'Atualizando...' : 'Atualizar Fotos'}
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
                  <div className="col-span-1 text-right">Ações</div>
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
                      
                      <div className="col-span-1 flex justify-end">
                        <div className="flex items-center gap-1">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 w-7 p-0" 
                            title="Ver detalhes"
                            onClick={() => handleViewContact(contact)}
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 w-7 p-0" 
                            title="Editar"
                            onClick={() => handleEditContact(contact)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 w-7 p-0 text-red-600 hover:text-red-700" 
                            title="Excluir"
                            onClick={() => handleDeleteContact(contact)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination */}
              {totalContacts > 0 && (
                <div className="border-t border-gray-200 p-4 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Mostrando {startIndex + 1}-{Math.min(endIndex, totalContacts)} de {totalContacts} contatos
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    
                    {/* Páginas numeradas */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = Math.max(1, currentPage - 2) + i;
                      if (page > totalPages) return null;
                      
                      return (
                        <Button
                          key={page}
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageClick(page)}
                          className={page === currentPage ? "bg-educhat-primary text-white" : ""}
                        >
                          {page}
                        </Button>
                      );
                    })}
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                    >
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