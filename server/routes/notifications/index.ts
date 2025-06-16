import type { Express } from "express";
import listRouter from './routes/list';
import statusRouter from './routes/status';
import manageRouter from './routes/manage';

export function registerNotificationRoutes(app: Express) {
  app.use(listRouter);
  app.use(statusRouter);
  app.use(manageRouter);
}