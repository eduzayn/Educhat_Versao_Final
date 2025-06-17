import type { Express } from "express";

export function registerUserRoutes(app: Express) {
  // Redirect legacy user routes to admin endpoints for backward compatibility
  app.get('/api/users', (req, res) => {
    res.redirect(301, '/api/admin/users');
  });
  
  app.get('/api/users/:id', (req, res) => {
    res.redirect(301, `/api/admin/users/${req.params.id}`);
  });
  
  app.post('/api/users', (req, res) => {
    res.redirect(307, '/api/admin/users');
  });
  
  app.put('/api/users/:id', (req, res) => {
    res.redirect(307, `/api/admin/users/${req.params.id}`);
  });
  
  app.delete('/api/users/:id', (req, res) => {
    res.redirect(307, `/api/admin/users/${req.params.id}`);
  });
}