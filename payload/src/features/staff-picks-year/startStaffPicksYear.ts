import type { PayloadRequest } from 'payload';
import { hasRole } from '../../utils/auth';

const COLLECTION = 'year-end-staff-picks';

interface StaffPickDoc {
  name: string;
  dj?: number | null;
  showName?: string | null;
  details?: string | null;
}

/**
 * Copies each staff member from the latest earlier year into this year, in
 * the same order, with empty song and album lists. Last year's records stay
 * untouched, and anyone already in this year is skipped, so it's safe to
 * click twice.
 */
export const startStaffPicksYear = async (req: PayloadRequest): Promise<Response> => {
  if (!hasRole(req.user, ['admin', 'editor'])) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const toYear = new Date().getFullYear();
  const latest = await req.payload.find({
    collection: COLLECTION,
    where: { year: { less_than: toYear } },
    sort: '-year',
    limit: 1,
    depth: 0,
    req,
  });
  const fromYear = latest.docs[0]?.year as number | undefined;
  if (!fromYear) {
    return Response.json({ error: `No staff picks before ${toYear} to copy.` }, { status: 400 });
  }

  const [source, existing] = await Promise.all(
    [fromYear, toYear].map((year) => req.payload.find({
      collection: COLLECTION,
      where: { year: { equals: year } },
      sort: '_order',
      pagination: false,
      depth: 0,
      req,
    })),
  );
  const taken = new Set(existing.docs.map((doc) => String(doc.name).trim().toLowerCase()));

  const toCopy = (source.docs as unknown as StaffPickDoc[]).filter(
    (doc) => !taken.has(doc.name.trim().toLowerCase()),
  );
  // One at a time, so each new record lands after the previous one in the list order.
  await toCopy.reduce(async (previous, doc) => {
    await previous;
    await req.payload.create({
      collection: COLLECTION,
      data: {
        year: toYear,
        name: doc.name,
        dj: doc.dj ?? null,
        showName: doc.showName,
        details: doc.details,
      },
      req,
    });
  }, Promise.resolve());

  return Response.json({
    fromYear,
    toYear,
    created: toCopy.length,
    skipped: source.docs.length - toCopy.length,
  });
};
