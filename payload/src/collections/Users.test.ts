import { describe, expect, it } from 'vitest';
import { Users } from './Users';
import { flattenRowFields } from './testUtils';

describe('Users', () => {
  it('has the correct slug', () => {
    expect(Users.slug).toBe('users');
  });

  it('has correct labels', () => {
    expect(Users.labels?.singular).toBe('User');
    expect(Users.labels?.plural).toBe('Users');
  });

  it('uses email as admin title', () => {
    expect(Users.admin?.useAsTitle).toBe('email');
  });

  it('is grouped under People', () => {
    expect(Users.admin?.group).toBe('People');
  });

  it('has default columns including email and role', () => {
    expect(Users.admin?.defaultColumns).toContain('email');
    expect(Users.admin?.defaultColumns).toContain('role');
  });

  it('is configured as an auth collection', () => {
    expect(Users.auth).toBeDefined();
  });

  it('has 4-hour token expiration', () => {
    const auth = Users.auth as { tokenExpiration?: number };
    expect(auth?.tokenExpiration).toBe(60 * 60 * 4);
  });

  it('has verify enabled', () => {
    const auth = Users.auth as { verify?: boolean };
    expect(auth?.verify).toBe(true);
  });

  describe('access: read', () => {
    const readFn = Users.access?.read as (args: {
      req: { user: unknown };
      id?: string;
    }) => boolean;

    it('denies unauthenticated users', () => {
      expect(readFn({ req: { user: null } })).toBe(false);
    });

    it('allows admin to read all users', () => {
      expect(readFn({ req: { user: { id: '1', role: 'admin' } } })).toBe(true);
    });

    it('allows a user to read their own profile by id', () => {
      expect(readFn({ req: { user: { id: '42', role: 'editor' } }, id: '42' })).toBe(true);
    });

    it('denies a user from reading another user profile', () => {
      expect(readFn({ req: { user: { id: '42', role: 'editor' } }, id: '99' })).toBe(false);
    });

    it('denies non-admin users without a matching id', () => {
      expect(readFn({ req: { user: { id: '42', role: 'editor' } } })).toBe(false);
    });
  });

  it('requires admin role to create', () => {
    const createFn = Users.access?.create as (args: { req: { user: unknown } }) => boolean;
    expect(createFn({ req: { user: { role: 'admin' } } })).toBe(true);
    expect(createFn({ req: { user: { role: 'editor' } } })).toBe(false);
    expect(createFn({ req: { user: null } })).toBe(false);
  });

  it('allows any authenticated user to update', () => {
    const updateFn = Users.access?.update as (args: { req: { user: unknown } }) => boolean;
    expect(updateFn({ req: { user: { role: 'editor' } } })).toBe(true);
    expect(updateFn({ req: { user: { role: 'readonly' } } })).toBe(true);
    expect(updateFn({ req: { user: null } })).toBe(false);
  });

  it('requires admin role to delete', () => {
    const deleteFn = Users.access?.delete as (args: { req: { user: unknown } }) => boolean;
    expect(deleteFn({ req: { user: { role: 'admin' } } })).toBe(true);
    expect(deleteFn({ req: { user: { role: 'editor' } } })).toBe(false);
    expect(deleteFn({ req: { user: null } })).toBe(false);
  });

  it('hides from navigation for non-admin users', () => {
    const hiddenFn = Users.admin?.hidden as (args: { user: unknown }) => boolean;
    expect(hiddenFn({ user: { role: 'admin' } })).toBe(false);
    expect(hiddenFn({ user: { role: 'editor' } })).toBe(true);
    expect(hiddenFn({ user: null })).toBe(true);
  });

  it('has role as a required select field with default editor', () => {
    const allFields = flattenRowFields(Users.fields);
    const roleField = allFields.find((f) => f.name === 'role');
    expect(roleField?.type).toBe('select');
    expect(roleField?.required).toBe(true);
    expect(roleField?.defaultValue).toBe('editor');
  });

  it('has role options for admin, editor, and readonly', () => {
    const allFields = flattenRowFields(Users.fields);
    const roleField = allFields.find((f) => f.name === 'role') as {
      options?: Array<{ value: string }>;
    };
    const values = roleField?.options?.map((o) => o.value);
    expect(values).toContain('admin');
    expect(values).toContain('editor');
    expect(values).toContain('readonly');
  });

  it('has role saved to JWT', () => {
    const allFields = flattenRowFields(Users.fields);
    const roleField = allFields.find((f) => f.name === 'role') as { saveToJWT?: boolean };
    expect(roleField?.saveToJWT).toBe(true);
  });

  it('has lastLoggedIn as a date field', () => {
    const allFields = flattenRowFields(Users.fields);
    const lastLoggedInField = allFields.find((f) => f.name === 'lastLoggedIn');
    expect(lastLoggedInField?.type).toBe('date');
  });

  it('has timestamps enabled', () => {
    expect(Users.timestamps).toBe(true);
  });
});
