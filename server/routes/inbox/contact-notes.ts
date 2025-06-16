import { Router } from 'express';
import { storage } from '../../storage';
import { insertContactNoteSchema } from '@shared/schema';

const router = Router();

// Listar notas de um contato
router.get('/contact/:contactId', async (req, res) => {
  try {
    const contactId = parseInt(req.params.contactId);
    const notes = await storage.getContactNotes(contactId);
    res.json(notes);
  } catch (error) {
    console.error('Error fetching contact notes:', error);
    res.status(500).json({ message: 'Failed to fetch contact notes' });
  }
});

// Criar nota
router.post('/', async (req, res) => {
  try {
    const validatedData = insertContactNoteSchema.parse(req.body);
    const note = await storage.createContactNote(validatedData);
    res.status(201).json(note);
  } catch (error) {
    console.error('Error creating contact note:', error);
    res.status(400).json({ message: 'Invalid note data' });
  }
});

// Atualizar nota
router.patch('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const validatedData = insertContactNoteSchema.partial().parse(req.body);
    const note = await storage.updateContactNote(id, validatedData);
    res.json(note);
  } catch (error) {
    console.error('Error updating contact note:', error);
    res.status(400).json({ message: 'Failed to update contact note' });
  }
});

// Remover nota
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await storage.deleteContactNote(id);
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting contact note:', error);
    res.status(500).json({ message: 'Failed to delete contact note' });
  }
});

export default router; 