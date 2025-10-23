// Role definitions
export const ROLES = {
  SYSTEM_ADMIN: 'System Administrator',
  SAFETY_ANALYST: 'Safety Analyst',
  FLEET_MANAGER: 'Fleet Manager',
  DATA_ANALYST: 'Data Analyst',
  VIEWER: 'Viewer',
} as const;

// Route permissions by role
export const ROUTE_PERMISSIONS = {
  // Public routes - no authentication required
  PUBLIC: [],

  // Dashboard - all authenticated users
  DASHBOARD: [
    ROLES.SYSTEM_ADMIN,
    ROLES.SAFETY_ANALYST,
    ROLES.FLEET_MANAGER,
    ROLES.DATA_ANALYST,
    ROLES.VIEWER,
  ],

  // Flight Analysis - analysts and admins
  FLIGHT_ANALYSIS: [
    ROLES.SYSTEM_ADMIN,
    ROLES.SAFETY_ANALYST,
    ROLES.DATA_ANALYST,
    ROLES.VIEWER,
  ],

  // Fleet Management - fleet managers and admins
  FLEET_MANAGEMENT: [
    ROLES.SYSTEM_ADMIN,
    ROLES.FLEET_MANAGER,
    ROLES.SAFETY_ANALYST,
  ],

  // Upload Data - analysts and fleet managers
  UPLOAD_DATA: [
    ROLES.SYSTEM_ADMIN,
    ROLES.SAFETY_ANALYST,
    ROLES.FLEET_MANAGER,
    ROLES.DATA_ANALYST,
  ],

  // Reports - all except viewers
  REPORTS: [
    ROLES.SYSTEM_ADMIN,
    ROLES.SAFETY_ANALYST,
    ROLES.FLEET_MANAGER,
    ROLES.DATA_ANALYST,
  ],

  // User Management - admins only
  USER_MANAGEMENT: [ROLES.SYSTEM_ADMIN],

  // Organizations - admins and fleet managers
  ORGANIZATIONS: [ROLES.SYSTEM_ADMIN, ROLES.FLEET_MANAGER],

  // System Admin - admins only
  SYSTEM_ADMIN: [ROLES.SYSTEM_ADMIN],

  // Security - admins only
  SECURITY: [ROLES.SYSTEM_ADMIN],

  // API Keys - admins and data analysts
  API_KEYS: [ROLES.SYSTEM_ADMIN, ROLES.DATA_ANALYST],

  // Notifications - all authenticated users
  NOTIFICATIONS: [
    ROLES.SYSTEM_ADMIN,
    ROLES.SAFETY_ANALYST,
    ROLES.FLEET_MANAGER,
    ROLES.DATA_ANALYST,
    ROLES.VIEWER,
  ],

  // Profile - all authenticated users
  PROFILE: [
    ROLES.SYSTEM_ADMIN,
    ROLES.SAFETY_ANALYST,
    ROLES.FLEET_MANAGER,
    ROLES.DATA_ANALYST,
    ROLES.VIEWER,
  ],
} as const;

// Helper function to check if user has access to a route
export const hasRouteAccess = (userRole: string, allowedRoles: readonly string[]): boolean => {
  return allowedRoles.includes(userRole);
};

// Get default route based on user role
export const getDefaultRoute = (userRole: string): string => {
  switch (userRole) {
    case ROLES.SYSTEM_ADMIN:
      return '/dashboard';
    case ROLES.SAFETY_ANALYST:
      return '/analysis';
    case ROLES.FLEET_MANAGER:
      return '/fleet';
    case ROLES.DATA_ANALYST:
      return '/analysis';
    case ROLES.VIEWER:
      return '/dashboard';
    default:
      return '/dashboard';
  }
};
