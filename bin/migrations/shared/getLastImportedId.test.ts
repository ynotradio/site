import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getLastImportedId, getLastImportedRecord } from './getLastImportedId';

describe('getLastImportedId', () => {
  let mockClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = {
      fetch: vi.fn(),
    };
  });

  it('returns the highest legacy ID for a content type', async () => {
    mockClient.fetch.mockResolvedValue({ legacyId: 12345 });

    const result = await getLastImportedId('concert', mockClient);

    expect(result).toBe(12345);
    expect(mockClient.fetch).toHaveBeenCalledWith(
      expect.stringContaining('*[_type == "concert"'),
    );
  });

  it('returns null when no records exist', async () => {
    mockClient.fetch.mockResolvedValue(null);

    const result = await getLastImportedId('concert', mockClient);

    expect(result).toBeNull();
  });

  it('returns null when legacyId is undefined', async () => {
    mockClient.fetch.mockResolvedValue({});

    const result = await getLastImportedId('concert', mockClient);

    expect(result).toBeNull();
  });

  it('queries with correct content type', async () => {
    mockClient.fetch.mockResolvedValue({ legacyId: 100 });

    await getLastImportedId('artist', mockClient);

    expect(mockClient.fetch).toHaveBeenCalledWith(
      expect.stringContaining('*[_type == "artist"'),
    );
  });

  it('orders by legacyId descending and gets first result', async () => {
    mockClient.fetch.mockResolvedValue({ legacyId: 999 });

    await getLastImportedId('show', mockClient);

    const query = mockClient.fetch.mock.calls[0][0];
    expect(query).toContain('order(legacyId desc)');
    expect(query).toContain('[0]');
  });
});

describe('getLastImportedRecord', () => {
  let mockClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = {
      fetch: vi.fn(),
    };
  });

  it('returns the complete last imported record', async () => {
    const mockRecord = {
      _id: 'concert-123',
      legacyId: 456,
      title: 'Test Concert',
      date: '2024-01-15',
    };
    mockClient.fetch.mockResolvedValue(mockRecord);

    const result = await getLastImportedRecord('concert', mockClient);

    expect(result).toEqual(mockRecord);
    expect(result?._id).toBe('concert-123');
    expect(result?.legacyId).toBe(456);
  });

  it('returns null when no records exist', async () => {
    mockClient.fetch.mockResolvedValue(null);

    const result = await getLastImportedRecord('concert', mockClient);

    expect(result).toBeNull();
  });

  it('queries with correct content type', async () => {
    mockClient.fetch.mockResolvedValue({ _id: 'test', legacyId: 1 });

    await getLastImportedRecord('artist', mockClient);

    expect(mockClient.fetch).toHaveBeenCalledWith(
      expect.stringContaining('*[_type == "artist"'),
    );
  });

  it('retrieves all fields from the record', async () => {
    mockClient.fetch.mockResolvedValue({ _id: 'test', legacyId: 1 });

    await getLastImportedRecord('show', mockClient);

    const query = mockClient.fetch.mock.calls[0][0];
    expect(query).not.toContain('{');
    expect(query).toContain('order(legacyId desc)');
  });
});
