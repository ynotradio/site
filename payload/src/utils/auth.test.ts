import { describe, it, expect } from 'vitest';
import { hasRole } from './auth';

describe('Auth Utils', () => {
  describe('hasRole', () => {
    it('returns true when user has the specified role (string)', () => {
      const user = { id: '1', email: 'test@example.com', role: 'admin' };
      expect(hasRole(user, 'admin')).toBe(true);
    });

    it('returns true when user has one of the specified roles (array)', () => {
      const user = { id: '1', email: 'test@example.com', role: 'editor' };
      expect(hasRole(user, ['admin', 'editor', 'viewer'])).toBe(true);
    });

    it('returns true when user has multiple roles and one matches (user roles as array)', () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        role: ['editor', 'viewer'],
      };
      expect(hasRole(user, 'editor')).toBe(true);
    });

    it('returns true when user has multiple roles and checking multiple roles', () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        role: ['editor', 'viewer'],
      };
      expect(hasRole(user, ['admin', 'editor'])).toBe(true);
    });

    it('returns false when user does not have the specified role', () => {
      const user = { id: '1', email: 'test@example.com', role: 'viewer' };
      expect(hasRole(user, 'admin')).toBe(false);
    });

    it('returns false when user does not have any of the specified roles', () => {
      const user = { id: '1', email: 'test@example.com', role: 'viewer' };
      expect(hasRole(user, ['admin', 'editor'])).toBe(false);
    });

    it('returns false when user has no role property', () => {
      const user = { id: '1', email: 'test@example.com' };
      expect(hasRole(user, 'admin')).toBe(false);
    });

    it('returns false when user is null', () => {
      expect(hasRole(null, 'admin')).toBe(false);
    });

    it('returns false when user is undefined', () => {
      expect(hasRole(undefined, 'admin')).toBe(false);
    });

    it('returns false when user is not an object', () => {
      expect(hasRole('not an object', 'admin')).toBe(false);
      expect(hasRole(123, 'admin')).toBe(false);
      expect(hasRole(true, 'admin')).toBe(false);
    });

    it('returns false when role is undefined', () => {
      const user = { id: '1', email: 'test@example.com', role: undefined };
      expect(hasRole(user, 'admin')).toBe(false);
    });

    it('handles empty role arrays', () => {
      const user = { id: '1', email: 'test@example.com', role: [] };
      expect(hasRole(user, 'admin')).toBe(false);
    });

    it('handles checking against empty role array', () => {
      const user = { id: '1', email: 'test@example.com', role: 'admin' };
      expect(hasRole(user, [])).toBe(false);
    });

    it('is case-sensitive for role matching', () => {
      const user = { id: '1', email: 'test@example.com', role: 'Admin' };
      expect(hasRole(user, 'admin')).toBe(false);
      expect(hasRole(user, 'Admin')).toBe(true);
    });
  });
});
