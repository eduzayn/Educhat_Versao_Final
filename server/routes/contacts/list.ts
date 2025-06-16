import type { Express } from "express";
import { pool } from "../../db";

export function registerContactListRoutes(app: Express) {
  app.get('/api/contacts', async (req, res) => {
    try {
      const { search, page = '1', limit = '50' } = req.query;
      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string) || 50;
      const offset = (pageNum - 1) * limitNum;
      let whereClause = '';
      let params: any[] = [];
      if (search && typeof search === 'string' && search.trim() !== '') {
        const searchTerm = `%${search.trim()}%`;
        whereClause = ' WHERE (name ILIKE $1 OR phone ILIKE $1 OR email ILIKE $1)';
        params.push(searchTerm);
      }
      const countQuery = `SELECT COUNT(*) as total FROM contacts${whereClause}`;
      const countResult = await pool.query(countQuery, params);
      const total = parseInt(countResult.rows[0].total);
      const dataQuery = `SELECT * FROM contacts${whereClause} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limitNum, offset);
      const dataResult = await pool.query(dataQuery, params);
      res.json({
        data: dataResult.rows,
        total: total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      });
    } catch (error) {
      console.error('Error fetching contacts:', error);
      res.status(500).json({ message: 'Failed to fetch contacts' });
    }
  });
} 