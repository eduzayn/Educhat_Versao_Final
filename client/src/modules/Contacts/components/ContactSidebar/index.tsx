import { ContactHeader } from './ContactHeader';
import { ContactInfo } from './ContactInfo';
import { DealsSection } from './DealsSection';
import { TagsSection } from './TagsSection';
import { NotesSection } from './NotesSection';
import { StatsSection } from './StatsSection';

interface ContactSidebarProps {
  activeConversation: any;
  contactNotes: any[];
  contactDeals: any[];
  onAddNote: (note: string) => void;
  onEditNote?: (noteId: number, content: string) => void;
  onDeleteNote?: (noteId: number) => void;
}

export function ContactSidebar({ 
  activeConversation, 
  contactNotes, 
  contactDeals, 
  onAddNote,
  onEditNote,
  onDeleteNote
}: ContactSidebarProps) {
  if (!activeConversation) return null;

  const { contact, messages } = activeConversation;

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
      <div className="space-y-6">
        {/* Cabeçalho do Contato */}
        <ContactHeader contact={{ 
          id: contact.id, 
          name: contact.name, 
          profileImageUrl: contact.profileImageUrl, 
          isOnline: contact.isOnline 
        }} />

        {/* Informações de Contato */}
        <ContactInfo 
          contact={contact} 
          channelInfo={activeConversation.channelInfo}
        />

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
          onEditNote={onEditNote}
          onDeleteNote={onDeleteNote}
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