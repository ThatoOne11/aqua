import {
  CsvUploadResponse,
  CsvUploadResult,
} from '@data-management/models/upload/csv-upload-response.model';

export function normalize(raw: CsvUploadResponse): CsvUploadResult {
  const message =
    raw.Message ??
    (raw.HasErrors ? 'CSV processing failed' : 'CSV successfully processed');

  if (!raw.HasErrors) return { ok: true, message, errors: [], id: raw.Data.id };

  const errors = extractErrorMessages(raw.Error);
  return { ok: false, message, errors, id: undefined };
}

export function extractErrorMessages(
  err?: string | Array<string | { message?: string }>
): string[] {
  if (err == null) return ['Unknown error. Please contact support.'];

  if (Array.isArray(err)) {
    return err
      .map((e) => (typeof e === 'string' ? e : e?.message ?? JSON.stringify(e)))
      .filter((s) => !!s && s.trim().length > 0);
  }

  const trimmed = err.trim();

  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed) as Array<
        string | { message?: string }
      >;
      return parsed
        .map((e) =>
          typeof e === 'string' ? e : e?.message ?? JSON.stringify(e)
        )
        .filter((s): s is string => typeof s === 'string' && s.length > 0);
    } catch {
      return ['Failed to parse errors array. Please contact support.'];
    }
  }

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    try {
      const obj = JSON.parse(trimmed) as {
        errors?: Array<string | { message?: string }>;
      };
      if (Array.isArray(obj?.errors)) {
        return obj.errors.map((e) =>
          typeof e === 'string' ? e : e?.message ?? JSON.stringify(e)
        );
      }
    } catch {
      return ['Failed to parse errors object. Please contact support.'];
    }
  }

  const lines = trimmed
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  return lines.length ? lines : [trimmed];
}
