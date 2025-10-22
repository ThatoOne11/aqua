export type CsvUploadResponse = {
  Message: string;
  HasErrors: boolean;
  Data: { id: string };
  Error?: string; // may be a plain string OR a JSON-stringified array of objects
};

export type CsvUploadResult =
  | { ok: true; id: string; message: string; errors: [] }
  | { ok: false; id: string | undefined; message: string; errors: string[] };
