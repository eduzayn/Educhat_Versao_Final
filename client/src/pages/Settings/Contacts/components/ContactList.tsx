import { Checkbox } from '@/shared/ui/ui/checkbox';
import { ContactTableRow } from './ContactTableRow';
import type { Contact } from '@shared/schema';

interface ContactListProps {
  contacts: Contact[];
  selectedContacts: number[];
  onSelectContact: (contactId: number, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onViewContact: (contact: Contact) => void;
  onEditContact: (contact: Contact) => void;
  onDeleteContact: (contact: Contact) => void;
  onUpdatePhoto: (phone: string) => void;
  isWhatsAppAvailable: boolean;
}

export function ContactList({
  contacts,
  selectedContacts,
  onSelectContact,
  onSelectAll,
  onViewContact,
  onEditContact,
  onDeleteContact,
  onUpdatePhoto,
  isWhatsAppAvailable
}: ContactListProps) {
  const allSelected = contacts.length > 0 && selectedContacts.length === contacts.length;
  const someSelected = selectedContacts.length > 0 && selectedContacts.length < contacts.length;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <Checkbox
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected;
                  }}
                  onCheckedChange={onSelectAll}
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contato
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Telefone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {contacts.map((contact) => (
              <ContactTableRow
                key={contact.id}
                contact={contact}
                isSelected={selectedContacts.includes(contact.id)}
                onSelect={onSelectContact}
                onView={onViewContact}
                onEdit={onEditContact}
                onDelete={onDeleteContact}
                onUpdatePhoto={onUpdatePhoto}
                isWhatsAppAvailable={isWhatsAppAvailable}
              />
            ))}
          </tbody>
        </table>
      </div>
      
      {contacts.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-2">Nenhum contato encontrado</div>
          <div className="text-sm text-gray-400">
            Tente ajustar os filtros ou sincronizar contatos do WhatsApp
          </div>
        </div>
      )}
    </div>
  );
}