import { Express } from 'express';
import { registerQuickRepliesGetRoutes } from './quick-replies-get';
import { registerQuickRepliesPostRoutes } from './quick-replies-post';
import { registerQuickRepliesPutRoutes } from './quick-replies-put';
import { registerQuickRepliesDeleteRoutes } from './quick-replies-delete';
import { registerQuickRepliesPatchRoutes } from './quick-replies-patch';
import { registerQuickRepliesShareRoutes } from './quick-replies-share';

export function registerQuickRepliesRoutes(app: Express) {
  registerQuickRepliesGetRoutes(app);
  registerQuickRepliesPostRoutes(app);
  registerQuickRepliesPutRoutes(app);
  registerQuickRepliesDeleteRoutes(app);
  registerQuickRepliesPatchRoutes(app);
  registerQuickRepliesShareRoutes(app);
}