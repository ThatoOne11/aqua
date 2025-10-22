import { CoaWarnings } from '@data-management/models/review-upload/coa-warnings.model';
import { ValidationMessage } from '@data-management/models/validation-block/validation-messages.model';

export function mapCoaWarningsToMessages(
  warnings: CoaWarnings
): ValidationMessage[] {
  const messages: ValidationMessage[] = [];
  const warn = (m: string) => messages.push({ message: m, type: 'WARN' });

  const siteName = warnings.site_name ?? 'Unknown site';

  // Normalize helpers
  const keyFloor = (f: string) => norm(f);
  const keyArea = (f: string, a: string) => `${norm(f)}\u0000${norm(a)}`;
  const keyLocation = (f: string, a: string, l: string) =>
    `${norm(f)}\u0000${norm(a)}\u0000${norm(l)}`;

  // Sets for quick “is parent new?” lookups
  const newFloorSet = new Set((warnings.new_floors ?? []).map(keyFloor));

  const newAreaSet = new Set(
    (warnings.new_areas ?? []).map(({ floor, area }) => keyArea(floor, area))
  );

  const newLocationSet = new Set(
    (warnings.new_locations ?? []).map(({ floor, area, location }) =>
      keyLocation(floor, area, location)
    )
  );

  // 1) Site-level
  if (warnings.is_new_site) {
    warn(`1x New site: ${siteName}`);
    // (We still continue to emit floor-level messages as per your spec)
  }

  // Floors
  uniqStrings(warnings.new_floors).forEach((floor) => {
    if (!floor) return;
    warn(`New floor for this site: ${floor}`);
  });

  // Areas (skip if parent floor is new)
  uniqBy(warnings.new_areas, (r) => keyArea(r.floor, r.area)).forEach(
    ({ floor, area }) => {
      if (!area) return;
      if (newFloorSet.has(keyFloor(floor))) return; // parent floor is new → suppress
      warn(`New area for this floor ${floor}: "${area}"`);
    }
  );

  // Locations (skip if parent floor or area is new)
  uniqBy(warnings.new_locations, (r) =>
    keyLocation(r.floor, r.area, r.location)
  ).forEach(({ floor, area, location }) => {
    if (!location) return;
    if (newFloorSet.has(keyFloor(floor))) return; // floor is new
    if (newAreaSet.has(keyArea(floor, area))) return; // area is new
    warn(`New location for this area ${area} on floor ${floor}: "${location}"`);
  });

  // Outlets (skip if parent floor OR area OR location is new)
  uniqBy(
    warnings.new_outlets,
    (r) => `${keyLocation(r.floor, r.area, r.location)}\u0000${norm(r.outlet)}`
  ).forEach(({ floor, area, location, outlet }) => {
    if (!outlet) return;
    if (newFloorSet.has(keyFloor(floor))) return; // floor is new
    if (newAreaSet.has(keyArea(floor, area))) return; // area is new
    if (newLocationSet.has(keyLocation(floor, area, location))) return; // location is new
    warn(
      `New outlets for this location ${location} / area ${area} on floor ${floor}: "${outlet}"`
    );
  });

  return messages;
}

function norm(v: string | null | undefined): string {
  return (v ?? '').trim().toLowerCase();
}

function uniqStrings(arr: string[] = []): string[] {
  return Array.from(new Set(arr ?? [])).filter(Boolean);
}

function uniqBy<T>(arr: T[] = [], keyFn: (t: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of arr ?? []) {
    const k = keyFn(item);
    if (k && !seen.has(k)) {
      seen.add(k);
      out.push(item);
    }
  }
  return out;
}
