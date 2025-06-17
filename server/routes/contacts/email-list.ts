import { Router } from 'express';
import { db } from '../../db';
import { contacts } from '../../../shared/schema';
import { requireAuth } from '../conversations/middleware';
import { isNotNull } from 'drizzle-orm';

const router = Router();

// Buscar contatos com email para lista de destinatários
router.get('/', requireAuth, async (req, res) => {
  try {
    const contactsList = await db
      .select({
        id: contacts.id,
        name: contacts.name,
        email: contacts.email,
        phone: contacts.phone
      })
      .from(contacts)
      .where(isNotNull(contacts.email))
      .orderBy(contacts.name);

    res.json(contactsList);
  } catch (error) {
    console.error('Erro ao buscar contatos com email:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro interno do servidor' 
    });
  }
});

export default router;