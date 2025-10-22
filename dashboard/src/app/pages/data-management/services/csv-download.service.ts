import { Injectable } from '@angular/core';
import { CertificateOfAnalysisService } from '@data-management/services/certificate-of-analysis-service';
import { CoaDetails } from '@data-management/models/review-upload/coa-details.model';

import {
  CoaBaseDetails,
  CoaCsvData,
  coaCsvDataToString,
  CoaReadingDetails,
  parseCoaCsv,
  sortRawCoaReadings,
  toCoaCsvData,
} from '@data-management/models/coa-download/coa-download.model';
import {
  Reading,
  sortReadings,
} from '@data-management/models/review-upload/flattened-reading.model';
import { StaticService } from '@static/services/static.service';
import { ResultType } from '@static/models/dto/result-type.model';

@Injectable({ providedIn: 'root' })
export class CsvDownloadService {
  constructor(
    private coaService: CertificateOfAnalysisService,
    private staticService: StaticService
  ) {}

  async downloadCoaCsv(coaId: string) {
    return this.exportCoaCsv(coaId);
  }

  async exportCoaCsv(coaId: string) {
    const [details, readings, resultTypes] = await Promise.all([
      this.coaService.getCoaDetails(coaId),
      this.coaService.getCoaReadingsResults(coaId),
      this.staticService.GetResultTypes(),
    ]);
    if (!details || !readings) {
      throw new Error('No COA Details');
    }
    const csv = this.buildCsv(details, readings, resultTypes);

    const original = this.cleanOriginalFilename(details?.file_name);

    const suggested =
      original || this.defaultFilename(details?.site_name ?? undefined, coaId);

    this.download(csv, suggested);
  }

  private buildCsv(
    details: CoaDetails,
    readings: Reading[],
    resultTypes: ResultType[]
  ): string {
    console.log({ raw: details?.raw_data });
    const raw: CoaCsvData = details.raw_data as CoaCsvData;
    const parsed = parseCoaCsv(raw);
    console.log({ raw, parsed });

    const mergedDetails: CoaBaseDetails = {
      'User ID': parsed.details['User ID'],
      Username: details.coa_username ?? parsed.details.UserName,
      'Notes (Metadata)': parsed.details['Notes (Metadata)'],
      'Duedate (Metadata)': parsed.details['Duedate (Metadata)'],
      'Priority (Metadata)': parsed.details['Priority (Metadata)'],
      'Location (Metadata);': parsed.details['Location (Metadata);'],
      Client: details.client_name,
      SiteName: details.site_name ?? parsed.details.SiteName,
      ProjectManager:
        details.coa_project_manager ?? parsed.details.ProjectManager,
      UserName: details.coa_username ?? parsed.details.UserName,
      JobReference: details.coa_job_reference ?? parsed.details.JobReference,
      TeamLeader: details.coa_team_leader ?? parsed.details.TeamLeader,
      TeamLeaderUserName: parsed.details.TeamLeaderUserName,
      Date: this.toDateDmyMon(details.coa_reading_date)!,
      Parameters: parsed.details.Parameters,
      ZetaSafeClientID:
        details.coa_zeta_safe_client_id ?? parsed.details.ZetaSafeClientID,
      ZetaSafeClientAPI:
        details.coa_zeta_safe_client_api ?? parsed.details.ZetaSafeClientAPI,
    };

    const mergedReadings: CoaReadingDetails[] = [];
    readings = sortReadings(readings);

    parsed.readings = sortRawCoaReadings(parsed.readings);

    if (readings.length != parsed.readings.length) {
      throw new Error('Readings mismatch between provided and saved');
    }

    readings.forEach((reading, i) => {
      const rawReading = parsed.readings[i];
      const readingResults = reading.coa_results_list
        .map((r) => ({
          fieldName:
            resultTypes.find((rt) => rt.id === r.result_type_id)
              ?.display_name ?? 'UnknownResult',
          value: '' + r.value,
        }))
        .reduce<Record<string, string>>((acc, { fieldName, value }) => {
          acc[fieldName] = value;
          return acc;
        }, {});

      mergedReadings.push({
        ID: rawReading.ID,
        Area: reading.area,
        Location: reading.location,
        FeedType: reading.feed_type,
        FlushType: reading.flush_type,
        OutletType: reading.outlet,
        LegBar: rawReading.LegBar,
        TVCBar: rawReading.TVCBar,
        PseudoBar: rawReading.PseudoBar,
        PseudoABar: rawReading.PseudoABar,
        PseudoSBar: rawReading.PseudoSBar,
        LeadCopBar: rawReading.LeadCopBar,
        LeadResult: rawReading.LeadResult,
        SilverResult: rawReading.SilverResult,
        EColiResult: rawReading.EColiResult,
        TVC22Result: rawReading.TVC22Result,
        TVC37Result: rawReading.TVC37Result,
        CopperResult: rawReading.CopperResult,
        ColiformResult: rawReading.ColiformResult,
        LegionellaResult: rawReading.LegionellaResult,
        PseudoAeruResult: rawReading.PseudoAeruResult,
        PseudoSpeciesResult: rawReading.PseudoSpeciesResult,
        EnterococciResult: rawReading.EnterococciResult,
        Temperature: rawReading.Temperature,
        FloorLevel: reading.floor,
        TimeSample: this.toUtcTimeHms(reading.sample_time),
        SampleIssue: rawReading.SampleIssue,
        CommentCount: rawReading.CommentCount,
        Comment: rawReading.Comment,
        ...readingResults,
      });
    });

    const mergedCoaRows = toCoaCsvData({
      readings: mergedReadings,
      details: mergedDetails,
    });

    console.log({
      readingTimes: readings.map((r) => r.sample_time),
      mergedTimes: mergedCoaRows.rows.map((r) => r.TimeSample),
    });

    return coaCsvDataToString(mergedCoaRows);
  }

  private defaultFilename(siteName?: string, coaId?: string) {
    const safeSite = (siteName ?? 'site')
      .replace(/[^\w\- ]+/g, '')
      .replace(/\s+/g, '_');
    return `coa_${safeSite}_${coaId ?? 'export'}.csv`;
  }

  private cleanOriginalFilename(name?: string | null): string {
    if (!name) return '';

    const trimmed = name.trim().replace(/^"+|"+$/g, '');
    return (trimmed.split(/[\\/]/).pop() || trimmed).trim();
  }

  private download(csv: string, filename: string) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename; // ← no forced ".csv"
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
  }
  /** Format to `DD-MMM-YYYY` in UTC, e.g. 27-Mar-2025 */
  private toDateDmyMon(iso?: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const day = d.getUTCDate();
    const mon = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ][d.getUTCMonth()];
    const year = d.getUTCFullYear();
    return `${day}-${mon}-${year}`;
  }

  /** Format to UTC `HH:mm:ss` */
  private toUtcTimeHms(iso?: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const hh = String(d.getUTCHours()).padStart(2, '0');
    const mm = String(d.getUTCMinutes()).padStart(2, '0');
    const ss = String(d.getUTCSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }
}
