import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PayloadRequest } from 'payload';
import { startStaffPicksYear } from './startStaffPicksYear';

const THIS_YEAR = new Date().getFullYear();
const LAST_YEAR = THIS_YEAR - 1;

const lastYearStaff = [
  {
    id: 1,
    year: LAST_YEAR,
    name: 'Josh T. Landow',
    dj: 7,
    showName: null,
    details: 'Owner',
    songs: [{ title: 'x' }],
  },
  {
    id: 2,
    year: LAST_YEAR,
    name: 'Joey O.',
    dj: null,
    showName: 'Joey Show',
    details: null,
  },
];

describe('startStaffPicksYear', () => {
  const find = vi.fn();
  const create = vi.fn();
  const request = (role: string | null) => ({
    user: role ? { role } : null,
    payload: { find, create },
  }) as unknown as PayloadRequest;

  const stubYears = (thisYear: Array<{ name: string }>) => {
    find.mockImplementation(async ({ where, limit }) => {
      if (limit === 1) return { docs: [lastYearStaff[0]] };
      return { docs: where.year.equals === LAST_YEAR ? lastYearStaff : thisYear };
    });
  };

  beforeEach(() => {
    find.mockReset();
    create.mockReset();
  });

  it("copies last year's staff in order with empty pick lists", async () => {
    stubYears([]);
    const res = await startStaffPicksYear(request('editor'));

    expect(await res.json()).toEqual({
      fromYear: LAST_YEAR,
      toYear: THIS_YEAR,
      created: 2,
      skipped: 0,
    });
    expect(create.mock.calls.map(([args]) => args.data)).toEqual([
      {
        year: THIS_YEAR,
        name: 'Josh T. Landow',
        dj: 7,
        showName: null,
        details: 'Owner',
      },
      {
        year: THIS_YEAR,
        name: 'Joey O.',
        dj: null,
        showName: 'Joey Show',
        details: null,
      },
    ]);
    expect(find).toHaveBeenCalledWith(expect.objectContaining({ sort: '_order' }));
  });

  it('skips staff already started this year', async () => {
    stubYears([{ name: 'joey o.' }]);
    const res = await startStaffPicksYear(request('admin'));

    expect((await res.json()).skipped).toBe(1);
    expect(create).toHaveBeenCalledTimes(1);
    expect(create.mock.calls[0][0].data.name).toBe('Josh T. Landow');
  });

  it('reports when there is no earlier year to copy', async () => {
    find.mockResolvedValue({ docs: [] });
    const res = await startStaffPicksYear(request('editor'));

    expect(res.status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });

  it('rejects users who cannot edit staff picks', async () => {
    const res = await startStaffPicksYear(request(null));

    expect(res.status).toBe(403);
    expect(find).not.toHaveBeenCalled();
  });
});
