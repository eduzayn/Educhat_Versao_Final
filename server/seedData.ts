import { storage } from './storage';

export async function seedDatabase() {
  try {
    // Create sample contacts
    const contact1 = await storage.createContact({
      name: 'João Silva',
      phone: '+55 11 99999-1234',
      email: 'joao.silva@email.com',
      location: 'São Paulo, SP',
      age: 28,
      isOnline: true,
    });

    const contact2 = await storage.createContact({
      name: 'Maria Santos',
      phone: '+55 21 98888-5678',
      email: 'maria.santos@email.com',
      location: 'Rio de Janeiro, RJ',
      age: 34,
      isOnline: false,
    });

    const contact3 = await storage.createContact({
      name: 'Pedro Oliveira',
      phone: '+55 85 97777-9012',
      email: 'pedro.oliveira@email.com',
      location: 'Fortaleza, CE',
      age: 22,
      isOnline: true,
    });

    // Create conversations
    const conversation1 = await storage.createConversation({
      contactId: contact1.id,
      channel: 'whatsapp',
      status: 'open',
      unreadCount: 2,
    });

    const conversation2 = await storage.createConversation({
      contactId: contact2.id,
      channel: 'instagram',
      status: 'pending',
      unreadCount: 0,
    });

    const conversation3 = await storage.createConversation({
      contactId: contact3.id,
      channel: 'facebook',
      status: 'open',
      unreadCount: 1,
    });

    // Create messages
    await storage.createMessage({
      conversationId: conversation1.id,
      content: 'Olá! Gostaria de saber mais sobre os cursos de programação disponíveis.',
      isFromContact: true,
      messageType: 'text',
    });

    await storage.createMessage({
      conversationId: conversation1.id,
      content: 'Olá João! Ficamos felizes com seu interesse. Temos cursos de React, Node.js e Python. Qual área te interessa mais?',
      isFromContact: false,
      messageType: 'text',
    });

    await storage.createMessage({
      conversationId: conversation1.id,
      content: 'Estou interessado em desenvolvimento web full-stack. Vocês têm algum curso que cubra tanto frontend quanto backend?',
      isFromContact: true,
      messageType: 'text',
    });

    await storage.createMessage({
      conversationId: conversation2.id,
      content: 'Vi o post sobre o curso de JavaScript. Qual é o valor?',
      isFromContact: true,
      messageType: 'text',
    });

    await storage.createMessage({
      conversationId: conversation2.id,
      content: 'Olá Maria! O curso completo de JavaScript custa R$ 497,00 à vista ou em até 12x no cartão. Gostaria de mais detalhes?',
      isFromContact: false,
      messageType: 'text',
    });

    await storage.createMessage({
      conversationId: conversation3.id,
      content: 'Oi! Quando começa a próxima turma?',
      isFromContact: true,
      messageType: 'text',
    });

    // Add tags
    await storage.addContactTag({
      contactId: contact1.id,
      tag: 'Lead Quente',
      color: 'red',
    });

    await storage.addContactTag({
      contactId: contact1.id,
      tag: 'Interessado em Full-Stack',
      color: 'blue',
    });

    await storage.addContactTag({
      contactId: contact2.id,
      tag: 'Lead',
      color: 'yellow',
    });

    await storage.addContactTag({
      contactId: contact2.id,
      tag: 'JavaScript',
      color: 'green',
    });

    await storage.addContactTag({
      contactId: contact3.id,
      tag: 'Novo Lead',
      color: 'purple',
    });

    console.log('✅ Database seeded successfully with sample data');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
}