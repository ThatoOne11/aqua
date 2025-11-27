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
  ReadingResultViewRow,
  LineChartRow,
} from '@client-dashboard/models/filters/filters.model';
import { BarChartComponent } from './data-summary/bar-chart/bar-chart';
import { AlertsSummaryComponent } from './data-summary/alerts-summary/alerts-summary';
import { LoaderService } from '@core/services/loading.service';
import { DashboardDataService } from '@client-dashboard/services/dashboard-data-service';
import { ReadingResultsLineChartComponent } from './data-summary/line-graph/line-chart.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ChartDownloadService } from '../../../../shared/services/chart-download.service';

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
    MatButtonModule,
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
  private readonly chartDownloadService = inject(ChartDownloadService);

  readonly options = signal<FilterOptionsResponse | null>(null);
  readonly dashboardData = signal<DashboardDataResponse | null>(null);
  readonly error = signal<string | null>(null);
  readonly initialFilterParams = signal<FilterParams | null>(null);
  readonly singleOutletSelected = signal(false);
  readonly rawResults = signal<ReadingResultViewRow[] | null>(null);

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
    this.initialFilterParams.set(params);
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

    // Lookup pretty names and order from RESULT TYPES
    const opt = this.options();
    const resultTypes = opt?.result_types ?? [];
    const nameById = new Map(
      resultTypes.filter((o) => !!o.id).map((o) => [o.id as string, o.name])
    );
    const orderById = new Map(
      resultTypes
        .filter((o) => !!o.id)
        .map((o) => [o.id as string, o.order as number])
    );

    // Group by result_type_id
    const byResult = new Map<string, LineChartRow[]>();
    for (const r of rows) {
      const key = (r.result_type_id ?? 'unknown') as string;
      const arr = byResult.get(key) ?? [];
      arr.push(r);
      byResult.set(key, arr);
    }

    // Build groups for the template, then sort
    return Array.from(byResult.entries())
      .map(([id, rs]) => ({
        id,
        title:
          nameById.get(id) ??
          (id === 'unknown' ? 'Unspecified result' : `Result ${id}`),
        rows: rs,
      }))
      .sort((a, b) => {
        const orderA = orderById.get(a.id) as number;
        const orderB = orderById.get(b.id) as number;
        return orderA - orderB;
      });
  });

  // for *ngFor trackBy
  trackByParam = (_: number, g: { id: string }) => g.id;

  getSiteName(siteId: string | null | undefined): string {
    if (!siteId) return '';
    const sites = this.options()?.sites ?? [];
    return sites.find((s) => s.id === siteId)?.name ?? '';
  }

  downloadChart(chartGroup: { title: string }, element: HTMLElement): void {
    const filters = this.initialFilterParams();
    const site = this.getSiteName(filters?.p_site_ids?.[0]);
    const location = filters?.p_locations?.[0] ?? '';
    const outlet = filters?.p_outlets?.[0] ?? '';

    const filename = [chartGroup.title, site, location, outlet]
      .filter(Boolean) // Remove empty parts
      .join('_')
      .replace(/[^a-zA-Z0-9_-]/g, ''); // Sanitize filename

    this.chartDownloadService.downloadElementAsImage(
      element,
      `${filename}.png`
    );
  }

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
      this.rawResults.set(rawResults);

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
  private toLineChartRow(r: ReadingResultViewRow): LineChartRow {
    // Be lenient with types/field names; fall back where sensible
    return {
      sample_dt: r.sample_dt,
      value: Number(r.value ?? 0),
      feed_type: r.feed_type ?? null,
      flush_type: r.flush_type ?? null,
      unit: r.unit ?? null,
      parameter_type_id: r.parameter_type_id ?? null,
      result_type_id: r.result_type_id ?? null,
      temperature: r.temperature,
    };
  }
}
