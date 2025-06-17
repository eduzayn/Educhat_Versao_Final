// Re-export all types and interfaces
export type { AuthenticatedRequest, PermissionContext, AuditLogData } from './permissionTypes';

// Re-export the permission service
export { PermissionService } from './permissionService';

// Re-export all middlewares
export { 
  requirePermission, 
  requireAnyPermission, 
  requireAdmin, 
  requireTeamAccess 
} from './permissionMiddlewares';

// Re-export activity monitor
export { ActivityMonitor, updateLastActivity } from './activityMonitor'; 