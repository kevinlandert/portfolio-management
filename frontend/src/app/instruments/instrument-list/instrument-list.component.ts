import { Component, OnInit, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil, finalize } from 'rxjs/operators';
import { InstrumentsService } from '../services/instruments.service';
import { Instrument, InstrumentListParams } from '../models/instrument.model';
import { ConfirmDialogComponent } from './confirm-dialog.component';
import { InstrumentActionsComponent } from './instrument-actions/instrument-actions.component';
import { InstrumentSearchBarComponent, SearchBarFilters, SearchBarOptions } from './instrument-search-bar/instrument-search-bar.component';

@Component({
  selector: 'app-instrument-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatSnackBarModule,
    MatDialogModule,
    InstrumentActionsComponent,
    InstrumentSearchBarComponent
  ],
  templateUrl: './instrument-list.component.html',
  styleUrl: './instrument-list.component.css'
})
export class InstrumentListComponent implements OnInit, OnDestroy {
  private readonly instrumentsService = inject(InstrumentsService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly destroy$ = new Subject<void>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // Data
  readonly dataSource = new MatTableDataSource<Instrument>([]);
  readonly displayedColumns: string[] = [
    'short_name',
    'full_name',
    'instrument_type',
    'sector',
    'country',
    'original_currency',
    'last_price',
    'yahoo_symbol',
    'actions'
  ];

  // State
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly totalItems = signal(0);
  readonly pageSize = signal(10);
  readonly currentPage = signal(0);

  // Form controls
  readonly searchControl = new FormControl('');

  // Filters (for search bar component)
  readonly filters = signal<SearchBarFilters>({
    selectedType: null,
    selectedSector: null,
    selectedCountry: null
  });

  // Available filter options (for search bar component)
  readonly filterOptions = signal<SearchBarOptions>({
    types: [],
    sectors: [],
    countries: []
  });

  ngOnInit(): void {
    this.initializeFromRoute();
    this.setupSearchSubscription();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize component state from route query parameters
   */
  private initializeFromRoute(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.updateStateFromParams(params);
        this.loadInstruments();
      });
  }

  /**
   * Update component state from route parameters
   */
  private updateStateFromParams(params: any): void {
    const query = params['query'] || '';
    const page = this.parseIntParam(params['page'], 0);
    const size = this.parseIntParam(params['size'], 10);
    const type = params['type'] || null;
    const sector = params['sector'] || null;
    const country = params['country'] || null;

    this.searchControl.setValue(query, { emitEvent: false });
    this.filters.set({
      selectedType: type,
      selectedSector: sector,
      selectedCountry: country
    });
    this.currentPage.set(page);
    this.pageSize.set(size);
  }

  /**
   * Parse integer parameter with fallback
   */
  private parseIntParam(value: any, fallback: number): number {
    if (value === undefined || value === null) return fallback;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? fallback : parsed;
  }

  /**
   * Setup debounced search subscription
   */
  private setupSearchSubscription(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(query => {
        const queryValue = query?.trim() || undefined;
        this.currentPage.set(0);
        this.updateUrlAndReload({ query: queryValue, page: 0 });
      });
  }

  /**
   * Load instruments with current filters and pagination
   */
  loadInstruments(): void {
    this.loading.set(true);
    this.error.set(null);

    const params = this.buildListParams();

    this.instrumentsService.list(params).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: response => this.handleLoadSuccess(response),
      error: err => this.handleLoadError(err)
    });
  }

  /**
   * Build list parameters from current state
   */
  private buildListParams(): InstrumentListParams {
    const filters = this.filters();
    return {
      query: this.searchControl.value?.trim() || undefined,
      page: this.currentPage(),
      size: this.pageSize(),
      instrument_type: filters.selectedType || undefined,
      sector: filters.selectedSector || undefined,
      country: filters.selectedCountry || undefined,
      sort: 'full_name,asc' // Default sort
    };
  }

  /**
   * Handle successful instrument load
   */
  private handleLoadSuccess(response: any): void {
    try {
      this.dataSource.data = response?.items || [];
      this.totalItems.set(response?.total ?? 0);
      this.updateFilterOptions(response?.items || []);
    } catch (e) {
      console.error('Error processing response:', e);
      this.handleEmptyData();
    }
  }

  /**
   * Handle load error
   */
  private handleLoadError(err: any): void {
    console.error('Error loading instruments:', err);
    const errorMessage = err?.message || 'Failed to load instruments';
    this.error.set(errorMessage);
    this.handleEmptyData();
    this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
  }

  /**
   * Reset data to empty state
   */
  private handleEmptyData(): void {
    this.dataSource.data = [];
    this.totalItems.set(0);
  }

  /**
   * Update available filter options from loaded instruments
   */
  private updateFilterOptions(instruments: Instrument[]): void {
    const typesSet = new Set<string>();
    const sectorsSet = new Set<string>();
    const countriesSet = new Set<string>();

    instruments.forEach(instrument => {
      if (instrument.instrument_type) typesSet.add(instrument.instrument_type);
      if (instrument.sector) sectorsSet.add(instrument.sector);
      if (instrument.country) countriesSet.add(instrument.country);
    });

    this.filterOptions.set({
      types: Array.from(typesSet).sort(),
      sectors: Array.from(sectorsSet).sort(),
      countries: Array.from(countriesSet).sort()
    });
  }

  /**
   * Handle pagination change
   */
  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.updateUrlAndReload({
      page: event.pageIndex,
      size: event.pageSize
    });
  }

  /**
   * Build query params object from component state and overrides
   */
  private buildQueryParams(overrides: Partial<InstrumentListParams & { type?: string; sector?: string; country?: string }> = {}): Record<string, any> {
    const filters = this.filters();
    const queryParams: Record<string, any> = {
      query: this.searchControl.value?.trim() || undefined,
      page: this.currentPage(),
      size: this.pageSize(),
      type: filters.selectedType || undefined,
      sector: filters.selectedSector || undefined,
      country: filters.selectedCountry || undefined
    };

    // Apply overrides
    Object.assign(queryParams, overrides);

    // Remove undefined/null/empty values
    return Object.fromEntries(
      Object.entries(queryParams).filter(([_, value]) => 
        value !== undefined && value !== null && value !== ''
      )
    );
  }

  /**
   * Update URL and reload instruments
   */
  private async updateUrlAndReload(params: Partial<InstrumentListParams & { type?: string; sector?: string; country?: string }> = {}): Promise<void> {
    const queryParams = this.buildQueryParams(params);
    await this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      replaceUrl: true
    });
    // Reload instruments after URL update
    // Route subscription will also trigger, but we reload immediately for tests
    this.loadInstruments();
  }

  /**
   * Handle search bar events
   */
  onTypeFilterChange(type: string | null): void {
    this.filters.update(f => ({ ...f, selectedType: type }));
    this.currentPage.set(0);
    this.updateUrlAndReload({ type: type || undefined, page: 0 });
  }

  onSectorFilterChange(sector: string | null): void {
    this.filters.update(f => ({ ...f, selectedSector: sector }));
    this.currentPage.set(0);
    this.updateUrlAndReload({ sector: sector || undefined, page: 0 });
  }

  onCountryFilterChange(country: string | null): void {
    this.filters.update(f => ({ ...f, selectedCountry: country }));
    this.currentPage.set(0);
    this.updateUrlAndReload({ country: country || undefined, page: 0 });
  }

  onClearSearch(): void {
    this.searchControl.setValue('');
  }

  onClearAllFilters(): void {
    this.searchControl.setValue('');
    this.filters.set({
      selectedType: null,
      selectedSector: null,
      selectedCountry: null
    });
    this.currentPage.set(0);
    this.updateUrlAndReload({ query: undefined, type: undefined, sector: undefined, country: undefined, page: 0 });
  }

  /**
   * Check if there are active filters
   */
  hasActiveFilters(): boolean {
    const filters = this.filters();
    return !!(
      this.searchControl.value?.trim() ||
      filters.selectedType ||
      filters.selectedSector ||
      filters.selectedCountry
    );
  }

  /**
   * Navigate to create new instrument
   */
  createNew(): void {
    this.router.navigate(['/instruments/new']);
  }

  /**
   * Handle action events from actions component
   */
  onView(id: number): void {
    this.router.navigate(['/instruments', id]);
  }

  onEdit(id: number): void {
    this.router.navigate(['/instruments', id, 'edit']);
  }

  onDelete(id: number): void {
    // Need to get the instrument name for the dialog
    const instrument = this.dataSource.data.find(i => i.instrument_id === id);
    const name = instrument?.short_name || 'this instrument';
    
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Instrument',
        message: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.performDelete(id);
      }
    });
  }

  /**
   * Perform the actual delete operation
   */
  private performDelete(id: number): void {
    this.loading.set(true);
    this.instrumentsService.remove(id).subscribe({
      next: () => {
        this.snackBar.open('Instrument deleted successfully', 'Close', { duration: 3000 });
        this.loadInstruments();
      },
      error: err => {
        this.loading.set(false);
        this.snackBar.open(
          err.message || 'Failed to delete instrument',
          'Close',
          { duration: 5000 }
        );
      }
    });
  }

  /**
   * Retry loading after error
   */
  retry(): void {
    this.loadInstruments();
  }
}
