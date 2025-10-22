import {
  Component,
  ChangeDetectionStrategy,
  signal,
  input,
  OnInit,
  inject,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FiltersComponent } from '@client-dashboard/components/data-visualization/filters/filters';
import { FilterOptionsService } from '@client-dashboard/services/filter-options.service';
import {
  FilterOptionsResponse,
  FilterParams,
  DashboardDataResponse,
} from '@client-dashboard/models/filters/filters.model';
import { BarChartComponent } from './data-summary/bar-chart/bar-chart';
import { AlertsSummaryComponent } from './data-summary/alerts-summary/alerts-summary';
import { LoaderService } from '@core/services/loading.service';
import { DashboardDataService } from '@client-dashboard/services/dashboard-data-service';
import { ReadingResultsLineChartComponent } from './data-summary/line-graph/line-chart.component';
import { LineChartRow } from '@client-dashboard/models/filters/filters.model';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-data-visualization',
  standalone: true,
  imports: [
    CommonModule,
    FiltersComponent,
    BarChartComponent,
    AlertsSummaryComponent,
    ReadingResultsLineChartComponent,
    MatIconModule,
  ],
  templateUrl: './data-visualization.html',
  styleUrl: './data-visualization.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataVisualizationComponent implements OnInit {
  clientId = input.required<string>();
  clientName = input.required<string>();
  coaFilters = input<Partial<FilterParams> | null>();

  private readonly loaderService = inject(LoaderService);
  private readonly filterOptionsService = inject(FilterOptionsService);
  private readonly dashboardDataService = inject(DashboardDataService);

  readonly options = signal<FilterOptionsResponse | null>(null);
  readonly dashboardData = signal<DashboardDataResponse | null>(null);
  readonly error = signal<string | null>(null);
  readonly initialFilterParams = signal<FilterParams | null>(null);
  readonly singleOutletSelected = signal(false);

  readonly loading = this.loaderService.loading;

  readonly hasData = computed(() => {
    const data = this.dashboardData();
    return (
      (data?.monthly?.length ?? 0) > 0 || (data?.parameters?.length ?? 0) > 0
    );
  });

  async ngOnInit() {
    const coaFilters = this.coaFilters();
    let initialParams;
    if (coaFilters) {
      initialParams = this.buildInitialParamsFromCoa(coaFilters);
    } else {
      initialParams = this.buildInitialParams();
    }

    this.initialFilterParams.set(initialParams);
    await this.loadData(initialParams);
  }

  async onFilterChange(params: FilterParams) {
    this.singleOutletSelected.set((params.p_outlets?.length ?? 0) === 1);
    await this.loadData(params);
  }

  private buildInitialParamsFromCoa(
    coaFilters: Partial<FilterParams>
  ): FilterParams {
    const endDate = new Date(coaFilters.p_end!);
    endDate.setHours(23, 59, 59, 999);

    return {
      p_start: coaFilters.p_start!,
      p_end: endDate.toISOString(),
      p_client_ids: [this.clientId()],
      p_site_ids: coaFilters.p_site_ids!,
      p_floors: null,
      p_areas: null,
      p_locations: null,
      p_outlets: null,
      p_feed_type_ids: null,
      p_flush_type_ids: null,
      p_parameter_type_ids: null,
      p_result_type_ids: null,
    };
  }

  readonly lineRows = signal<LineChartRow[]>([]);
  readonly groupedCharts = computed(() => {
    if (!this.singleOutletSelected()) return [];
    const rows = this.lineRows();
    if (!rows.length) return [];

    // Lookup pretty names from RESULT TYPES (not parameter types)
    const opt = this.options();
    const nameById = new Map(
      (opt?.result_types ?? [])
        .filter((o) => !!o.id)
        .map((o) => [o.id as string, o.name])
    );

    // Group by result_type_id
    const byResult = new Map<string, LineChartRow[]>();
    for (const r of rows) {
      const key = (r.result_type_id ?? 'unknown') as string;
      const arr = byResult.get(key) ?? [];
      arr.push(r);
      byResult.set(key, arr);
    }

    // Build groups for the template
    return Array.from(byResult.entries()).map(([id, rs]) => ({
      id,
      title:
        nameById.get(id) ??
        (id === 'unknown' ? 'Unspecified result' : `Result ${id}`),
      rows: rs,
    }));
  });

  // for *ngFor trackBy
  trackByParam = (_: number, g: { id: string }) => g.id;

  /**
   * Consolidated data loading and processing function.
   */
  private async loadData(params: FilterParams) {
    this.loaderService.loadingOn();
    this.error.set(null);
    try {
      // Fetch options and raw data in parallel
      const [optionsResponse, rawResults] = await Promise.all([
        this.filterOptionsService.getFilterOptions(params),
        this.filterOptionsService.getRawResults(params),
      ]);

      // Set the options for the filters component
      this.options.set(optionsResponse);

      // Pass the raw data to the new service for client-side processing
      const calculatedData =
        this.dashboardDataService.calculateDashboardData(rawResults);

      // Set the processed data for the charts
      this.dashboardData.set(calculatedData);
      this.lineRows.set((rawResults ?? []).map((r) => this.toLineChartRow(r)));
    } catch (err: any) {
      console.error('[loadData] error', err);
      this.error.set(err?.message ?? 'Failed to fetch dashboard data');
      // Set default empty states on error
      this.options.set({
        sites: [],
        floors: [],
        areas: [],
        locations: [],
        outlets: [],
        feed_types: [],
        flush_types: [],
        parameter_types: [],
        result_types: [],
        summary: {
          total: 0,
          passed: 0,
          failed: 0,
          pass_pct: null,
          fail_pct: null,
        },
      });
      this.dashboardData.set({ monthly: [], parameters: [] });
    } finally {
      this.loaderService.loadingOff();
    }
  }

  private buildInitialParams(): FilterParams {
    const DEFAULT_FILTER_RANGE = 90 * 24 * 3600 * 1000;
    return {
      p_start: new Date(Date.now() - DEFAULT_FILTER_RANGE).toISOString(),
      p_end: new Date().toISOString(),
      p_client_ids: [this.clientId()],
      p_site_ids: null,
      p_floors: null,
      p_areas: null,
      p_locations: null,
      p_outlets: null,
      p_feed_type_ids: null,
      p_flush_type_ids: null,
      p_parameter_type_ids: null,
      p_result_type_ids: null,
    };
  }
  private toLineChartRow(r: any): LineChartRow {
    // Be lenient with types/field names; fall back where sensible
    return {
      sample_dt: r.sample_dt ?? r.coa_reading_date, // ISO
      value: Number(r.value ?? 0),
      feed_type: r.feed_type ?? null,
      flush_type: r.flush_type ?? null,
      unit: r.unit ?? null,
      parameter_type_id: r.parameter_type_id ?? null,
      result_type_id: r.result_type_id ?? null,
    };
  }
}
