import { Express } from 'express';
import { registerZApiRoutes } from './utilities-zapi';
import { registerProxyRoutes } from './utilities-proxy';
import { registerProfileRoutes } from './utilities-profile';

export function registerUtilitiesRoutes(app: Express) {
  registerZApiRoutes(app);
  registerProxyRoutes(app);
  registerProfileRoutes(app);
}
