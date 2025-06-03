import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/shared/ui/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/ui/card';
import { BackButton } from '@/shared/components/BackButton';
import { ContactFilters } from './components/ContactFilters';
import { ContactList } from './components/ContactList';
import { ContactPagination } from './components/ContactPagination';
import { CreateContactDialog } from './components/CreateContactDialog';
import { ViewContactDialog } from './components/ViewContactDialog';
import { DeleteContactDialog } from './components/DeleteContactDialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Plus, Users } from 'lucide-react';
import type { Contact } from '@shared/schema';

const CONTACTS_PER_PAGE = 10;

export default function ContactsSettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Estados para diálogos
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  // Estados para formulários
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [newContactForm, setNewContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    contactType: '',
    owner: '',
    notes: ''
  });
  const [newTags, setNewTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');

  // Queries
  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['/api/contacts'],
    enabled: true
  });

  const { data: zapiStatus } = useQuery({
    queryKey: ['/api/zapi/status'],
    enabled: true
  });

  // Filtros e paginação
  const filteredContacts = useMemo(() => {
    return contacts.filter((contact: Contact) =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (contact.email && contact.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (contact.phone && contact.phone.includes(searchQuery))
    );
  }, [contacts, searchQuery]);

  const totalPages = Math.ceil(filteredContacts.length / CONTACTS_PER_PAGE);
  const paginatedContacts = filteredContacts.slice(
    (currentPage - 1) * CONTACTS_PER_PAGE,
    currentPage * CONTACTS_PER_PAGE
  );

  // Mutations
  const createContactMutation = useMutation({
    mutationFn: (contactData: any) => apiRequest('/api/contacts', {
      method: 'POST',
      body: JSON.stringify(contactData)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      setCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Contato criado",
        description: "O contato foi criado com sucesso."
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar contato.",
        variant: "destructive"
      });
    }
  });

  const deleteContactMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/contacts/${id}`, {
      method: 'DELETE'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      setDeleteDialogOpen(false);
      setSelectedContact(null);
      toast({
        title: "Contato excluído",
        description: "O contato foi excluído com sucesso."
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir contato.",
        variant: "destructive"
      });
    }
  });

  const syncContactsMutation = useMutation({
    mutationFn: () => apiRequest('/api/contacts/sync', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      toast({
        title: "Sincronização concluída",
        description: "Contatos do WhatsApp sincronizados com sucesso."
      });
    }
  });

  const updateAllPhotosMutation = useMutation({
    mutationFn: () => apiRequest('/api/contacts/update-photos', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      toast({
        title: "Fotos atualizadas",
        description: "Fotos dos contatos atualizadas com sucesso."
      });
    }
  });

  // Handlers
  const resetForm = () => {
    setNewContactForm({
      name: '',
      email: '',
      phone: '',
      company: '',
      address: '',
      contactType: '',
      owner: '',
      notes: ''
    });
    setNewTags([]);
    setCurrentTag('');
  };

  const handleCreateContact = () => {
    const contactData = {
      ...newContactForm,
      tags: newTags
    };
    createContactMutation.mutate(contactData);
  };

  const handleSelectContact = (contactId: number, selected: boolean) => {
    if (selected) {
      setSelectedContacts([...selectedContacts, contactId]);
    } else {
      setSelectedContacts(selectedContacts.filter(id => id !== contactId));
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedContacts(paginatedContacts.map((contact: Contact) => contact.id));
    } else {
      setSelectedContacts([]);
    }
  };

  const handleViewContact = (contact: Contact) => {
    setSelectedContact(contact);
    setViewDialogOpen(true);
  };

  const handleEditContact = (contact: Contact) => {
    // Implementar edição futuramente
    toast({
      title: "Em desenvolvimento",
      description: "Funcionalidade de edição será implementada em breve."
    });
  };

  const handleDeleteContact = (contact: Contact) => {
    setSelectedContact(contact);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedContact) {
      deleteContactMutation.mutate(selectedContact.id);
    }
  };

  const handleUpdatePhoto = async (phone: string) => {
    try {
      await apiRequest(`/api/contacts/update-photo/${phone}`, { method: 'POST' });
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      toast({
        title: "Foto atualizada",
        description: "Foto do contato atualizada com sucesso."
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar foto do contato.",
        variant: "destructive"
      });
    }
  };

  const handleExportContacts = () => {
    // Implementar exportação futuramente
    toast({
      title: "Em desenvolvimento",
      description: "Funcionalidade de exportação será implementada em breve."
    });
  };

  const isWhatsAppAvailable = zapiStatus?.connected || false;

  return (
    <div className="space-y-6">
      <BackButton to="/settings" label="Voltar às Configurações" />
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestão de Contatos</h2>
          <p className="text-muted-foreground">
            Gerencie todos os contatos do sistema e sincronize com WhatsApp
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Contato
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Contatos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contacts.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">WhatsApp Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {contacts.filter((c: Contact) => c.phone).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selecionados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedContacts.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status WhatsApp</CardTitle>
            <div className={`h-3 w-3 rounded-full ${isWhatsAppAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {isWhatsAppAvailable ? 'Conectado' : 'Desconectado'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <ContactFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedContacts={selectedContacts}
        isWhatsAppAvailable={isWhatsAppAvailable}
        onSyncContacts={() => syncContactsMutation.mutate()}
        onUpdateAllPhotos={() => updateAllPhotosMutation.mutate()}
        onExportContacts={handleExportContacts}
        updatingAllPhotos={updateAllPhotosMutation.isPending}
        syncingContacts={syncContactsMutation.isPending}
      />

      {/* Lista de contatos */}
      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">Carregando contatos...</div>
          </CardContent>
        </Card>
      ) : (
        <ContactList
          contacts={paginatedContacts}
          selectedContacts={selectedContacts}
          onSelectContact={handleSelectContact}
          onSelectAll={handleSelectAll}
          onViewContact={handleViewContact}
          onEditContact={handleEditContact}
          onDeleteContact={handleDeleteContact}
          onUpdatePhoto={handleUpdatePhoto}
          isWhatsAppAvailable={isWhatsAppAvailable}
        />
      )}

      {/* Paginação */}
      <ContactPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalContacts={filteredContacts.length}
        contactsPerPage={CONTACTS_PER_PAGE}
        onPageChange={setCurrentPage}
      />

      {/* Diálogos */}
      <CreateContactDialog
        isOpen={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateContact}
        form={newContactForm}
        onFormChange={setNewContactForm}
        newTags={newTags}
        onTagsChange={setNewTags}
        currentTag={currentTag}
        onCurrentTagChange={setCurrentTag}
        isWhatsAppAvailable={isWhatsAppAvailable}
        isCreating={createContactMutation.isPending}
      />

      <ViewContactDialog
        contact={selectedContact}
        isOpen={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
      />

      <DeleteContactDialog
        contact={selectedContact}
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        isDeleting={deleteContactMutation.isPending}
      />
    </div>
  );
}