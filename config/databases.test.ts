/**
 * Unit tests for centralized database configuration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock fs and dotenv
vi.mock('fs', () => ({
  existsSync: vi.fn(),
}));

vi.mock('dotenv', () => ({
  config: vi.fn(),
}));

describe('databases', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('parseFromToArgs', () => {
    it('should return defaults when no args provided', async () => {
      const { parseFromToArgs } = await import('./databases');

      const result = parseFromToArgs([]);

      expect(result.from).toBe('local-mysql');
      expect(result.to).toBe('production-db');
    });

    it('should parse --from local-mysql', async () => {
      const { parseFromToArgs } = await import('./databases');

      const result = parseFromToArgs(['--from', 'local-mysql']);

      expect(result.from).toBe('local-mysql');
    });

    it('should parse --from prod-mysql', async () => {
      const { parseFromToArgs } = await import('./databases');

      const result = parseFromToArgs(['--from', 'prod-mysql']);

      expect(result.from).toBe('prod-mysql');
    });

    it('should parse --to production-db', async () => {
      const { parseFromToArgs } = await import('./databases');

      const result = parseFromToArgs(['--to', 'production-db']);

      expect(result.to).toBe('production-db');
    });

    it('should normalize legacy --to aliases', async () => {
      const { parseFromToArgs } = await import('./databases');

      expect(parseFromToArgs(['--to', 'prod-neon']).to).toBe('production-db');
      expect(parseFromToArgs(['--to', 'prod']).to).toBe('production-db');
      expect(parseFromToArgs(['--to', 'dev-neon']).to).toBe('preview-db');
      expect(parseFromToArgs(['--to', 'dev']).to).toBe('preview-db');
    });

    it('should parse --to local-postgres', async () => {
      const { parseFromToArgs } = await import('./databases');

      const result = parseFromToArgs(['--to', 'local-postgres']);

      expect(result.to).toBe('local-postgres');
    });

    it('should parse both --from and --to together', async () => {
      const { parseFromToArgs } = await import('./databases');

      const result = parseFromToArgs(['--from', 'prod-mysql', '--to', 'local-postgres']);

      expect(result.from).toBe('prod-mysql');
      expect(result.to).toBe('local-postgres');
    });

    it('should handle args in any order', async () => {
      const { parseFromToArgs } = await import('./databases');

      const result = parseFromToArgs(['--to', 'local-postgres', '--from', 'prod-mysql']);

      expect(result.from).toBe('prod-mysql');
      expect(result.to).toBe('local-postgres');
    });

    it('should ignore unknown args', async () => {
      const { parseFromToArgs } = await import('./databases');

      const result = parseFromToArgs(['--unknown', 'value', '--from', 'prod-mysql']);

      expect(result.from).toBe('prod-mysql');
      expect(result.to).toBe('production-db');
    });

    it('should throw error for invalid --from value', async () => {
      const { parseFromToArgs } = await import('./databases');

      expect(() => parseFromToArgs(['--from', 'invalid'])).toThrow(
        '--from must be "local-mysql" or "prod-mysql"',
      );
    });

    it('should throw error for invalid --to value', async () => {
      const { parseFromToArgs } = await import('./databases');

      expect(() => parseFromToArgs(['--to', 'invalid'])).toThrow(
        '--to must be "local-postgres", "production-db", or "preview-db"',
      );
    });
  });

  describe('getMySQLConfig', () => {
    it('should return local MySQL config with defaults', async () => {
      const fs = await import('fs');
      (fs.existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false);

      const { getMySQLConfig } = await import('./databases');

      const config = getMySQLConfig('local-mysql');

      expect(config.host).toBe('localhost');
      expect(config.database).toBe('ynot_site');
      expect(config.user).toBe('root');
      expect(config.password).toBe('');
    });

    it('should return local MySQL config from environment', async () => {
      const fs = await import('fs');
      (fs.existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false);

      process.env.DB_HOST = 'mysql-host';
      process.env.DB_NAME = 'custom_db';
      process.env.DB_USER = 'custom_user';
      process.env.DB_PASSWORD = 'secret';

      const { getMySQLConfig } = await import('./databases');

      const config = getMySQLConfig('local-mysql');

      expect(config.host).toBe('mysql-host');
      expect(config.database).toBe('custom_db');
      expect(config.user).toBe('custom_user');
      expect(config.password).toBe('secret');
    });

    it('should throw error for prod-mysql without credentials', async () => {
      const fs = await import('fs');
      (fs.existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false);

      // Clear prod credentials
      delete process.env.PROD_MYSQL_HOST;
      delete process.env.PROD_MYSQL_USER;
      delete process.env.PROD_MYSQL_PASSWORD;

      const { getMySQLConfig } = await import('./databases');

      expect(() => getMySQLConfig('prod-mysql')).toThrow(
        'Production MySQL credentials not configured',
      );
    });

    it('should return prod MySQL config from environment', async () => {
      const fs = await import('fs');
      (fs.existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false);

      process.env.PROD_MYSQL_HOST = 'prod-host.example.com';
      process.env.PROD_MYSQL_DATABASE = 'prod_db';
      process.env.PROD_MYSQL_USER = 'prod_user';
      process.env.PROD_MYSQL_PASSWORD = 'prod_secret';
      process.env.PROD_MYSQL_PORT = '3307';

      const { getMySQLConfig } = await import('./databases');

      const config = getMySQLConfig('prod-mysql');

      expect(config.host).toBe('prod-host.example.com');
      expect(config.database).toBe('prod_db');
      expect(config.user).toBe('prod_user');
      expect(config.password).toBe('prod_secret');
      expect(config.port).toBe(3307);
    });
  });

  describe('getDatabaseUrl', () => {
    it('should throw error for production-db without URL', async () => {
      const fs = await import('fs');
      (fs.existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false);

      delete process.env.PRODUCTION_DATABASE_URL;
      delete process.env.NEON_PROD_DATABASE_URL;

      const { getDatabaseUrl } = await import('./databases');

      expect(() => getDatabaseUrl('production-db')).toThrow(
        'Production database URL not configured',
      );
    });

    it('should return production URL from provider-neutral env first', async () => {
      const fs = await import('fs');
      (fs.existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false);

      process.env.PRODUCTION_DATABASE_URL = 'postgres://prod:password@database.example.com/db';
      process.env.NEON_PROD_DATABASE_URL = 'postgres://prod:password@neon.example.com/db';

      const { getDatabaseUrl } = await import('./databases');

      const url = getDatabaseUrl('production-db');

      expect(url).toBe('postgres://prod:password@database.example.com/db');
    });

    it('should return preview URL from provider-neutral env first', async () => {
      const fs = await import('fs');
      (fs.existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false);

      process.env.PREVIEW_DATABASE_URL = 'postgres://preview:password@database.example.com/db';
      process.env.NEON_DEV_DATABASE_URL = 'postgres://preview:password@neon.example.com/db';

      const { getDatabaseUrl } = await import('./databases');

      const url = getDatabaseUrl('preview-db');

      expect(url).toBe('postgres://preview:password@database.example.com/db');
    });

    it('should throw error for local-postgres without URL', async () => {
      const fs = await import('fs');
      (fs.existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false);

      delete process.env.LOCAL_DATABASE_URL;
      delete process.env.PREVIEW_DATABASE_URL;
      delete process.env.NEON_DEV_DATABASE_URL;
      delete process.env.DATABASE_URI;

      const { getDatabaseUrl } = await import('./databases');

      expect(() => getDatabaseUrl('local-postgres')).toThrow(
        'Local database URL not configured',
      );
    });

    it('should return local postgres URL from LOCAL_DATABASE_URL', async () => {
      const fs = await import('fs');
      (fs.existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false);

      process.env.LOCAL_DATABASE_URL = 'postgres://local:password@localhost/local_db';

      const { getDatabaseUrl } = await import('./databases');

      const url = getDatabaseUrl('local-postgres');

      expect(url).toBe('postgres://local:password@localhost/local_db');
    });

    it('should return local postgres URL from DATABASE_URI as fallback', async () => {
      const fs = await import('fs');
      (fs.existsSync as ReturnType<typeof vi.fn>).mockReturnValue(false);

      delete process.env.LOCAL_DATABASE_URL;
      delete process.env.PREVIEW_DATABASE_URL;
      delete process.env.NEON_DEV_DATABASE_URL;
      process.env.DATABASE_URI = 'postgres://fallback:password@localhost/fallback_db';

      const { getDatabaseUrl } = await import('./databases');

      const url = getDatabaseUrl('local-postgres');

      expect(url).toBe('postgres://fallback:password@localhost/fallback_db');
    });
  });

  describe('migrationConfig', () => {
    it('should export baseUrl', async () => {
      const { migrationConfig } = await import('./databases');

      expect(migrationConfig.baseUrl).toBe('https://www.ynotradio.net/');
    });
  });
});
