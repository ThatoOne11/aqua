/** Fields shared across the file (base details) */
export interface CoaBaseDetails {
  'User ID': string;
  Username: string;
  'Notes (Metadata)': string;
  'Duedate (Metadata)': string;
  'Priority (Metadata)': string;
  'Location (Metadata);': string;
  Client: string;
  SiteName: string;
  ProjectManager: string;
  UserName: string;
  JobReference: string;
  TeamLeader: string;
  TeamLeaderUserName: string;
  Date: string;
  Parameters: string;
  ZetaSafeClientID: string;
  ZetaSafeClientAPI: string;
}

/** Everything else is a per-row reading */
export interface CoaReadingDetails {
  ID: string;
  Area: string;
  Location: string;
  FeedType: string;
  FlushType: string;
  OutletType: string;

  /** Bars / sample labels */
  LegBar: string;
  TVCBar: string;
  PseudoBar: string;
  PseudoABar: string;
  PseudoSBar: string;
  LeadCopBar: string;

  /** Results */
  LeadResult: string;
  EColiResult: string;
  TVC22Result: string;
  TVC37Result: string;
  CopperResult: string;
  ColiformResult: string;
  LegionellaResult: string;
  PseudoAeruResult: string;
  PseudoSpeciesResult: string;
  EnterococciResult: string;
  SilverResult: string;

  /** Context */
  FloorLevel: string;
  TimeSample: string;
  SampleIssue: string;
  Temperature: string;
  CommentCount: string;
  Comment: string;
}

/** A raw CSV row contains both base + reading fields */
export type CoaCsvRow = CoaBaseDetails & CoaReadingDetails;

/** Original parsed shape from your JSON */
export interface CoaCsvData {
  rows: CoaCsvRow[];
}

/** Convenient structured shape after grouping */
export interface CoaParsedFile {
  details: CoaBaseDetails; // taken from the base columns (typically from the first non-empty row)
  readings: CoaReadingDetails[]; // one entry per CSV row
}

export function parseCoaCsv(data: CoaCsvData): CoaParsedFile {
  if (!data.rows || data.rows.length === 0) {
    return { details: {} as CoaBaseDetails, readings: [] };
  }

  // We’ll use the first row as the "source of truth" for base details
  const firstRow = data.rows[0];

  const details: CoaBaseDetails = {
    'User ID': firstRow['User ID'],
    Username: firstRow.Username,
    'Notes (Metadata)': firstRow['Notes (Metadata)'],
    'Duedate (Metadata)': firstRow['Duedate (Metadata)'],
    'Priority (Metadata)': firstRow['Priority (Metadata)'],
    'Location (Metadata);': firstRow['Location (Metadata);'],
    Client: firstRow.Client,
    SiteName: firstRow.SiteName,
    ProjectManager: firstRow.ProjectManager,
    UserName: firstRow.UserName,
    JobReference: firstRow.JobReference,
    TeamLeader: firstRow.TeamLeader,
    TeamLeaderUserName: firstRow.TeamLeaderUserName,
    Date: firstRow.Date,
    Parameters: firstRow.Parameters,
    ZetaSafeClientID: firstRow.ZetaSafeClientID,
    ZetaSafeClientAPI: firstRow.ZetaSafeClientAPI,
  };

  const readings: CoaReadingDetails[] = data.rows.map((row) => ({
    ID: row.ID,
    Area: row.Area,
    Location: row.Location,
    FeedType: row.FeedType,
    FlushType: row.FlushType,
    OutletType: row.OutletType,

    LegBar: row.LegBar,
    TVCBar: row.TVCBar,
    PseudoBar: row.PseudoBar,
    PseudoABar: row.PseudoABar,
    PseudoSBar: row.PseudoSBar,
    LeadCopBar: row.LeadCopBar,

    LeadResult: row.LeadResult,
    EColiResult: row.EColiResult,
    TVC22Result: row.TVC22Result,
    TVC37Result: row.TVC37Result,
    CopperResult: row.CopperResult,
    ColiformResult: row.ColiformResult,
    LegionellaResult: row.LegionellaResult,
    EnterococciResult: row.EnterococciResult,
    PseudoAeruResult: row.PseudoAeruResult,
    PseudoSpeciesResult: row.PseudoSpeciesResult,
    SilverResult: row.SilverResult,

    FloorLevel: row.FloorLevel,
    TimeSample: row.TimeSample,
    SampleIssue: row.SampleIssue,
    Temperature: row.Temperature,
    CommentCount: row.CommentCount,
    Comment: row.Comment,
  }));

  return { details, readings };
}

export function sortRawCoaReadings(
  readings: CoaReadingDetails[]
): CoaReadingDetails[] {
  return [...readings].sort((a, b) => {
    const normalize = (val: string | null | undefined) =>
      (val ?? '').toString().trim().toLowerCase();

    // FloorLevel
    if (normalize(a.FloorLevel) !== normalize(b.FloorLevel)) {
      return normalize(a.FloorLevel).localeCompare(normalize(b.FloorLevel));
    }

    // Area
    if (normalize(a.Area) !== normalize(b.Area)) {
      return normalize(a.Area).localeCompare(normalize(b.Area));
    }

    // Location
    if (normalize(a.Location) !== normalize(b.Location)) {
      return normalize(a.Location).localeCompare(normalize(b.Location));
    }

    // OutletType
    if (normalize(a.OutletType) !== normalize(b.OutletType)) {
      return normalize(a.OutletType).localeCompare(normalize(b.OutletType));
    }

    // TimeSample (parse as HH:mm)
    const toMinutes = (val: string | null | undefined) => {
      if (!val) return Number.MAX_SAFE_INTEGER; // empty goes last
      const [hh, mm] = val.split(':').map(Number);
      return hh * 60 + mm;
    };

    return toMinutes(a.TimeSample) - toMinutes(b.TimeSample);
  });
}

export function toCoaCsvData(parsed: CoaParsedFile): CoaCsvData {
  //@ts-ignore
  const rows: CoaCsvRow[] = parsed.readings.map((reading) => ({
    ...reading,
  }));
  rows[0] = { ...parsed.details, ...rows[0] };

  return { rows };
}

export function coaCsvDataToString(data: CoaCsvData): string {
  if (!data.rows || data.rows.length === 0) {
    return '';
  }

  // Get headers from the keys of the first row
  const headers = Object.keys(data.rows[0]);

  // Escape function for CSV values
  const esc = (val: any): string => {
    if (val === null || val === undefined) return '';
    const s = String(val);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  // Build the CSV
  const csvRows = data.rows.map((row) =>
    headers.map((h) => esc((row as any)[h])).join(',')
  );

  return [headers.join(','), ...csvRows].join('\n');
}
