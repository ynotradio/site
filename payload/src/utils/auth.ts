/**
 * Shared authentication and authorization utilities for Payload collections
 */

/**
 * User type that matches the structure expected by Payload's access control
 */
export interface PayloadUser {
  id: string;
  email: string;
  role?: string | string[];
  [key: string]: unknown;
}

/**
 * Check if a user has one or more specific roles
 * @param user - The user object from the request context
 * @param roles - Role(s) to check for (string or array of strings)
 * @returns true if the user has any of the specified roles, false otherwise
 */
export const hasRole = (user: unknown, roles: string | string[]): boolean => {
  if (!user || typeof user !== 'object') {
    return false;
  }

  const typedUser = user as PayloadUser;
  if (!typedUser.role) {
    return false;
  }

  const userRoles = Array.isArray(typedUser.role) ? typedUser.role : [typedUser.role];
  const checkRoles = Array.isArray(roles) ? roles : [roles];

  return userRoles.some((role: string) => checkRoles.includes(role));
};

/**
 * Payload field `admin.condition` callback that shows a field only for admin users.
 * Hides the field from editors, DJs, and readonly users.
 *
 * Usage:
 *   admin: { condition: adminOnlyCondition }
 */
export const adminOnlyCondition = (
  _data: Record<string, unknown>,
  _siblingData: Record<string, unknown>,
  { user }: { user: unknown },
): boolean => hasRole(user, 'admin');
