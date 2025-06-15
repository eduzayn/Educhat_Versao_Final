import { ContactHeader } from './ContactHeader';
import { ContactInfo } from './ContactInfo';
import { FormationSection } from './FormationSection';
import { InterestSection } from './InterestSection';
import { DealsSection } from './DealsSection';
import { TagsSection } from './TagsSection';
import { NotesSection } from './NotesSection';
import { StatsSection } from './StatsSection';

interface ContactSidebarProps {
  activeConversation: any;
  contactNotes: any[];
  contactDeals: any[];
  contactInterests: any[];
  onAddNote: (note: string) => void;
}

export function ContactSidebar({ 
  activeConversation, 
  contactNotes, 
  contactDeals, 
  contactInterests, 
  onAddNote 
}: ContactSidebarProps) {
  if (!activeConversation) return null;

  const { contact, messages } = activeConversation;

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
      <div className="space-y-6">
        {/* Cabeçalho do Contato */}
        <ContactHeader contact={contact} />

        {/* Informações de Contato */}
        <ContactInfo contact={contact} />

        {/* Área de Formação */}
        <FormationSection tags={contact.tags} />

        {/* Área de Interesse */}
        <InterestSection tags={contact.tags} />

        {/* Negócios */}
        <DealsSection 
          contact={{
            id: contact.id,
            name: contact.name,
            phone: contact.phone
          }}
          deals={contactDeals}
        />

        {/* Outras Tags */}
        <TagsSection tags={contact.tags} />

        {/* Notas do Contato */}
        <NotesSection 
          contactName={contact.name}
          notes={contactNotes}
          onAddNote={onAddNote}
        />

        {/* Resumo Estatístico */}
        <StatsSection 
          messagesCount={messages?.length || 0}
          dealsCount={contactDeals.length}
          notesCount={contactNotes.length}
          isOnline={contact.isOnline}
        />
      </div>
    </div>
  );
}