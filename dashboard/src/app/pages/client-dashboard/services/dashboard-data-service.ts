import { Injectable } from '@angular/core';
import {
  DashboardDataResponse,
  ReadingResultViewRow,
} from '@client-dashboard/models/filters/filters.model';

@Injectable({
  providedIn: 'root',
})
export class DashboardDataService {
  /**
   * Processes a raw array of reading results to calculate dashboard metrics.
   * This logic is now performed on the client-side instead of in the database.
   * @param rawData The raw data fetched from the reading_results_view.
   * @returns A DashboardDataResponse object with calculated monthly and parameter data.
   */
  calculateDashboardData(
    rawData: ReadingResultViewRow[]
  ): DashboardDataResponse {
    if (!rawData || rawData.length === 0) {
      return { monthly: [], parameters: [] };
    }

    // Logic for Bar Chart (counting failed SAMPLES per month)
    const monthlyCoaSummary = new Map<
      string,
      { month: string; failed: boolean }
    >();
    for (const row of rawData) {
      const key = `${row.month_start}|${row.reading_result_id}`;
      if (!monthlyCoaSummary.has(key)) {
        monthlyCoaSummary.set(key, { month: row.month_start, failed: false });
      }
      if (row.is_fail) {
        monthlyCoaSummary.get(key)!.failed = true;
      }
    }

    const monthlyMap = new Map<string, { passed: number; failed: number }>();
    for (const summary of monthlyCoaSummary.values()) {
      if (!monthlyMap.has(summary.month)) {
        monthlyMap.set(summary.month, { passed: 0, failed: 0 });
      }
      const monthData = monthlyMap.get(summary.month)!;
      if (summary.failed) {
        monthData.failed++;
      } else {
        monthData.passed++;
      }
    }

    const monthly = Array.from(monthlyMap.entries())
      .map(([month, counts]) => ({ month, ...counts }))
      .sort(
        (a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()
      );

    // Logic for Alerts Summary (counting individual PARAMETER failures)
    const parameterMap = new Map<
      string,
      { passed: number; failed: number; id: string }
    >();
    for (const row of rawData) {
      if (row.parameter_type && row.parameter_type_id) {
        if (!parameterMap.has(row.parameter_type)) {
          parameterMap.set(row.parameter_type, {
            passed: 0,
            failed: 0,
            id: row.parameter_type_id,
          });
        }
        const paramData = parameterMap.get(row.parameter_type)!;
        if (row.is_fail) {
          paramData.failed++;
        } else {
          paramData.passed++;
        }
      }
    }

    const parameters = Array.from(parameterMap.entries())
      .map(([parameter, counts]) => ({
        parameter,
        parameter_id: counts.id,
        passed: counts.passed,
        failed: counts.failed,
      }))
      .sort((a, b) => b.failed - a.failed);

    return { monthly, parameters };
  }
}
