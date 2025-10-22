import {
  FlattenedReading,
  Reading,
} from '@data-management/models/review-upload/flattened-reading.model';

// Flatten a single row
const flattenReading = (row: Reading): FlattenedReading => {
  const { coa_results_list, ...base } = row;

  const results = coa_results_list.reduce<Record<string, number>>((acc, r) => {
    const key = r.result_type.toLowerCase().replace(/[\s.]+/g, '_');
    acc[key] = r.value;
    return acc;
  }, {});

  return { ...base, ...results };
};

// Flatten all rows
export const flattenReadings = (rows: Reading[]): FlattenedReading[] => {
  return rows.map(flattenReading);
};

// Collect headers (union of all keys across flattened rows)
export const getHeaders = (flatRows: FlattenedReading[]): string[] => {
  const headerSet = new Set<string>();
  flatRows.forEach((row) => {
    Object.keys(row).forEach((k) => headerSet.add(k));
  });
  return Array.from(headerSet);
};
