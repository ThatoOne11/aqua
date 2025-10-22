export type ReadingResult = {
  value: number;
  result_type: string;
  result_type_id: string;
  reading_result_id: string;
};

export type Reading = {
  reading_id: string;
  certificate_of_analysis_id: string;
  sample_time: string;
  floor: string;
  area: string;
  location: string;
  outlet: string;
  feed_type: string;
  flush_type: string;
  coa_results_list: ReadingResult[];
};

export type FlattenedReading = Omit<Reading, 'coa_results_list'> & {
  [key: string]: string | number | null;
};

export function sortReadings(readings: Reading[]): Reading[] {
  return [...readings].sort((a, b) => {
    const normalize = (val: string | number | null | undefined) =>
      (val ?? '').toString().trim().toLowerCase();

    // Floor
    if (normalize(a.floor) !== normalize(b.floor)) {
      return normalize(a.floor).localeCompare(normalize(b.floor));
    }

    // Area
    if (normalize(a.area) !== normalize(b.area)) {
      return normalize(a.area).localeCompare(normalize(b.area));
    }

    // Location
    if (normalize(a.location) !== normalize(b.location)) {
      return normalize(a.location).localeCompare(normalize(b.location));
    }

    // Outlet
    if (normalize(a.outlet) !== normalize(b.outlet)) {
      return normalize(a.outlet).localeCompare(normalize(b.outlet));
    }

    // Sample time (parse as HH:mm)
    const toMinutes = (val: string | null | undefined) => {
      if (!val) return Number.MAX_SAFE_INTEGER; // empty → last
      const [hh, mm] = val.split(':').map(Number);
      if (isNaN(hh) || isNaN(mm)) return Number.MAX_SAFE_INTEGER; // invalid → last
      return hh * 60 + mm;
    };

    return toMinutes(a.sample_time) - toMinutes(b.sample_time);
  });
}
