import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  input,
  OnInit,
  OnDestroy,
  output,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatChipsModule } from '@angular/material/chips';
import { ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, filter } from 'rxjs/operators';
import { MatDateFormats } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogDashboardGuide } from '@client-dashboard/dialogs/dialog-dashboard-guide/dialog-dashboard-guide';
import {
  FilterOptionsResponse,
  FilterParams,
  OptionWithStats,
} from '@client-dashboard/models/filters/filters.model';
import { Router, ActivatedRoute } from '@angular/router';

export const MY_DATE_FORMATS: MatDateFormats = {
  parse: { dateInput: 'DD/MM/YYYY' },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Component({
  selector: 'app-filters',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    MatChipsModule,
    ReactiveFormsModule,
    NgxMatSelectSearchModule,
  ],
  templateUrl: './filters.html',
  styleUrl: './filters.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FiltersComponent implements OnInit, OnDestroy {
  options = input.required<FilterOptionsResponse | null>();
  clientId = input.required<string>();

  // Initial params to set default date range and client ID
  initialParams = input<FilterParams | null>(null);

  filterChange = output<FilterParams>();

  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy$ = new Subject<void>();

  // --- Form Controls ---
  readonly dateRangeForm = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });

  readonly sitesCtrl = new FormControl<string[]>([], { nonNullable: true });
  readonly floorsCtrl = new FormControl<string[]>(
    { value: [], disabled: true },
    { nonNullable: true }
  );
  readonly areasCtrl = new FormControl<string[]>(
    { value: [], disabled: true },
    { nonNullable: true }
  );
  readonly locationsCtrl = new FormControl<string[]>(
    { value: [], disabled: true },
    { nonNullable: true }
  );
  readonly outletsCtrl = new FormControl<string[]>(
    { value: [], disabled: true },
    { nonNullable: true }
  );
  readonly chipsCtrl = new FormControl<string[]>([], { nonNullable: true });

  // --- Search Controls ---
  readonly siteFilterCtrl = new FormControl<string>('');
  readonly floorFilterCtrl = new FormControl<string>('');
  readonly areaFilterCtrl = new FormControl<string>('');
  readonly locationFilterCtrl = new FormControl<string>('');
  readonly outletFilterCtrl = new FormControl<string>('');

  // --- Signals for Search Term Filtering ---
  private readonly siteSearchTerm = signal<string>('');
  private readonly floorSearchTerm = signal<string>('');
  private readonly areaSearchTerm = signal<string>('');
  private readonly locationSearchTerm = signal<string>('');
  private readonly outletSearchTerm = signal<string>('');

  // --- Computed Signals for Available Options ---
  readonly availableSites = computed(() => this.options()?.sites ?? []);
  readonly availableFloors = computed(() => this.options()?.floors ?? []);
  readonly availableAreas = computed(() => this.options()?.areas ?? []);
  readonly availableLocations = computed(() => this.options()?.locations ?? []);
  readonly availableOutlets = computed(() => this.options()?.outlets ?? []);
  readonly availableParamTypes = computed(
    () => this.options()?.parameter_types ?? []
  );
  readonly chips = computed(() =>
    (this.options()?.parameter_types ?? []).map((p) => p.name)
  );

  // --- Computed Signals for Filtered Options (for search boxes) ---
  readonly filteredSites = this.buildFilteredOptions(
    this.availableSites,
    this.siteSearchTerm
  );
  readonly filteredFloors = this.buildFilteredOptions(
    this.availableFloors,
    this.floorSearchTerm
  );
  readonly filteredAreas = this.buildFilteredOptions(
    this.availableAreas,
    this.areaSearchTerm
  );
  readonly filteredLocations = this.buildFilteredOptions(
    this.availableLocations,
    this.locationSearchTerm
  );
  readonly filteredOutlets = this.buildFilteredOptions(
    this.availableOutlets,
    this.outletSearchTerm
  );

  constructor() {
    this.setupFilterChangeListeners();
  }

  ngOnInit() {
    const params = this.initialParams();
    if (params) {
      this.dateRangeForm.setValue(
        {
          start: new Date(params.p_start),
          end: new Date(params.p_end),
        },
        { emitEvent: false }
      );
      if (params.p_site_ids) {
        this.sitesCtrl.setValue(params.p_site_ids, { emitEvent: false });
        this.updateFilterStates();
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupFilterChangeListeners(): void {
    // --- Main Filter Subscriptions ---
    this.dateRangeForm.valueChanges
      .pipe(
        debounceTime(400),
        filter((value) => !!value.start && !!value.end),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        // If the URL contains a coaId, remove it upon date change.
        if (this.route.snapshot.queryParams['coaId']) {
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {}, // Clears all query parameters
            replaceUrl: true, // Replaces the current URL in history
          });
        }
        this.resetAllFilters();
        this.emitFilterChange();
      });

    this.sitesCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((values) => {
        this.resetAndDisable(['floors', 'areas', 'locations', 'outlets']);
        if (!values || values.length === 0) {
          this.chipsCtrl.setValue([], { emitEvent: false });
        }
        this.updateFilterStates();
        this.emitFilterChange();
      });

    this.floorsCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.resetAndDisable(['areas', 'locations', 'outlets']);
        this.updateFilterStates();
        this.emitFilterChange();
      });

    this.areasCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.resetAndDisable(['locations', 'outlets']);
      this.updateFilterStates();
      this.emitFilterChange();
    });

    this.locationsCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.resetAndDisable(['outlets']);
        this.updateFilterStates();
        this.emitFilterChange();
      });

    this.outletsCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.emitFilterChange();
      });

    this.chipsCtrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.emitFilterChange();
    });

    // --- Search Input Subscriptions ---
    this.siteFilterCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((v) => this.siteSearchTerm.set(v ?? ''));
    this.floorFilterCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((v) => this.floorSearchTerm.set(v ?? ''));
    this.areaFilterCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((v) => this.areaSearchTerm.set(v ?? ''));
    this.locationFilterCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((v) => this.locationSearchTerm.set(v ?? ''));
    this.outletFilterCtrl.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((v) => this.outletSearchTerm.set(v ?? ''));
  }

  private emitFilterChange() {
    this.filterChange.emit(this.buildParams());
  }

  private resetAllFilters() {
    this.sitesCtrl.setValue([], { emitEvent: false });
    this.chipsCtrl.setValue([], { emitEvent: false });
    this.resetAndDisable(['floors', 'areas', 'locations', 'outlets']);
    this.updateFilterStates();
  }

  private resetAndDisable(
    controls: ('floors' | 'areas' | 'locations' | 'outlets')[]
  ) {
    const controlMap = {
      floors: this.floorsCtrl,
      areas: this.areasCtrl,
      locations: this.locationsCtrl,
      outlets: this.outletsCtrl,
    };
    controls.forEach((key) => {
      controlMap[key].setValue([], { emitEvent: false });
    });
  }

  private updateFilterStates() {
    // Enable the next level dropdown only if exactly one item is selected in the current level.
    this.sitesCtrl.value?.length === 1
      ? this.floorsCtrl.enable({ emitEvent: false })
      : this.floorsCtrl.disable({ emitEvent: false });

    this.floorsCtrl.value?.length === 1
      ? this.areasCtrl.enable({ emitEvent: false })
      : this.areasCtrl.disable({ emitEvent: false });

    this.areasCtrl.value?.length === 1
      ? this.locationsCtrl.enable({ emitEvent: false })
      : this.locationsCtrl.disable({ emitEvent: false });

    this.locationsCtrl.value?.length === 1
      ? this.outletsCtrl.enable({ emitEvent: false })
      : this.outletsCtrl.disable({ emitEvent: false });
  }

  private buildParams(): FilterParams {
    const { start, end } = this.dateRangeForm.value;

    const selectedChips = this.chipsCtrl.value;
    const selectedParamIds = (selectedChips ?? [])
      .map(
        (name) => this.availableParamTypes().find((p) => p.name === name)?.id
      )
      .filter((id): id is string => !!id);

    return {
      p_start: (start as Date).toISOString(),
      p_end: (end as Date).toISOString(),
      p_client_ids: [this.clientId()],
      p_site_ids: this.nullIfEmpty(this.sitesCtrl.value),
      p_floors: this.nullIfEmpty(this.floorsCtrl.value),
      p_areas: this.nullIfEmpty(this.areasCtrl.value),
      p_locations: this.nullIfEmpty(this.locationsCtrl.value),
      p_outlets: this.nullIfEmpty(this.outletsCtrl.value),
      p_feed_type_ids: null,
      p_flush_type_ids: null,
      p_parameter_type_ids: this.nullIfEmpty(selectedParamIds),
      p_result_type_ids: null,
    };
  }

  private nullIfEmpty<T>(arr?: T[] | null): T[] | null {
    return arr && arr.length ? arr : null;
  }

  // --- Helpers ---
  siteName(id: string): string {
    return this.availableSites().find((x) => x.id === id)?.name ?? id;
  }

  formatSiteNames(ids: string[] | null): string {
    return (ids ?? []).map((id) => this.siteName(id)).join(', ');
  }

  formatList(values?: string[] | null): string {
    return values?.length ? values.join(', ') : '';
  }

  private buildFilteredOptions(
    source: () => OptionWithStats[],
    searchTerm: () => string
  ) {
    return computed(() => {
      const term = searchTerm()?.trim().toLowerCase();
      return !term
        ? source()
        : source().filter((o) => o.name.toLowerCase().includes(term));
    });
  }

  protected dialogButtonAction(): void {
    this.dialog.open(DialogDashboardGuide);
  }
}
