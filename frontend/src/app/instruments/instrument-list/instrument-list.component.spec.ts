import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { InstrumentListComponent } from './instrument-list.component';
import { InstrumentsService } from '../services/instruments.service';
import { Instrument } from '../models/instrument.model';
import { ConfirmDialogComponent } from './confirm-dialog.component';

describe('InstrumentListComponent', () => {
  let component: InstrumentListComponent;
  let fixture: ComponentFixture<InstrumentListComponent>;
  let mockService: jasmine.SpyObj<InstrumentsService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockRoute: any;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockDialog: MatDialog;

  const mockInstruments: Instrument[] = [
    {
      instrument_id: 1,
      short_name: 'AAPL',
      full_name: 'Apple Inc.',
      instrument_type: 'Equity',
      original_currency: 'USD',
      interest_currency: 'USD',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ];

  beforeEach(async () => {
    mockService = jasmine.createSpyObj('InstrumentsService', ['list', 'remove']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockRouter.navigate.and.returnValue(Promise.resolve(true));
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
    
    mockRoute = {
      queryParams: of({}),
      snapshot: { queryParams: {} }
    };

    await TestBed.configureTestingModule({
      imports: [InstrumentListComponent, NoopAnimationsModule, MatDialogModule],
      providers: [
        { provide: InstrumentsService, useValue: mockService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockRoute },
        { provide: MatSnackBar, useValue: mockSnackBar }
      ]
    }).compileComponents();


    mockDialog = TestBed.inject(MatDialog);
    fixture = TestBed.createComponent(InstrumentListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load instruments on init', () => {
    mockService.list.and.returnValue(of({ items: mockInstruments, total: 1 }));
    fixture.detectChanges();
    
    expect(mockService.list).toHaveBeenCalled();
    expect(component.loading()).toBe(false);
    expect(component.totalItems()).toBe(1);
  });

  it('should show empty state when no instruments are found', () => {
    mockService.list.and.returnValue(of({ items: [], total: 0 }));
    fixture.detectChanges();
    
    expect(component.loading()).toBe(false);
    expect(component.totalItems()).toBe(0);
    expect(component.dataSource.data.length).toBe(0);
  });

  it('should handle errors gracefully', () => {
    const error = { message: 'Network error' };
    mockService.list.and.returnValue(throwError(() => error));
    
    fixture.detectChanges();
    
    expect(component.loading()).toBe(false);
    expect(component.error()).toBeTruthy();
    expect(component.totalItems()).toBe(0);
  });

  it('should navigate to create page', () => {
    component.createNew();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/instruments/new']);
  });

  it('should navigate to detail page', () => {
    component.onView(1);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/instruments', 1]);
  });

  it('should navigate to edit page', () => {
    component.onEdit(1);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/instruments', 1, 'edit']);
  });

  it('should handle pagination change', fakeAsync(() => {
    mockService.list.and.returnValue(of({ items: mockInstruments, total: 1 }));
    fixture.detectChanges();
    tick();

    const pageEvent = {
      pageIndex: 1,
      pageSize: 10,
      length: 1
    } as any;

    component.onPageChange(pageEvent);
    tick();

    expect(component.currentPage()).toBe(1);
    expect(component.pageSize()).toBe(10);
    expect(mockRouter.navigate).toHaveBeenCalled();
  }));

  it('should handle delete with confirmation dialog', fakeAsync(() => {
    mockService.list.and.returnValue(of({ items: mockInstruments, total: 1 }));
    fixture.detectChanges();
    tick(); // Let initial load complete

    const dialogRef = { 
      afterClosed: () => of(false),
      componentInstance: {},
      close: jasmine.createSpy('close')
    };
    
    // Ensure dataSource has the instrument
    expect(component.dataSource.data.length).toBeGreaterThan(0);
    
    // Access the component's dialog via type assertion since it's private
    const componentDialog = (component as any).dialog;
    const openSpy = spyOn(componentDialog, 'open').and.returnValue(dialogRef as any);

    component.onDelete(1);
    tick(); // Process dialog open and subscription

    expect(openSpy).toHaveBeenCalled();
    expect(openSpy).toHaveBeenCalledWith(
      ConfirmDialogComponent,
      jasmine.objectContaining({
        data: jasmine.objectContaining({
          title: 'Delete Instrument',
          message: jasmine.stringContaining('AAPL')
        })
      })
    );
    expect(mockService.remove).not.toHaveBeenCalled();
  }));

  it('should perform delete when confirmed', fakeAsync(() => {
    mockService.list.and.returnValue(of({ items: mockInstruments, total: 1 }));
    fixture.detectChanges();
    tick();

    const dialogRef = { 
      afterClosed: () => of(true),
      componentInstance: {},
      close: jasmine.createSpy('close')
    };
    
    const componentDialog = (component as any).dialog;
    const openSpy = spyOn(componentDialog, 'open').and.returnValue(dialogRef as any);
    mockService.remove.and.returnValue(of(void 0));
    mockService.list.and.returnValue(of({ items: [], total: 0 }));

    component.onDelete(1);
    tick(); // Process dialog subscription (afterClosed emits true)
    tick(); // Process delete subscription

    expect(openSpy).toHaveBeenCalled();
    expect(mockService.remove).toHaveBeenCalledWith(1);
    expect(mockService.list).toHaveBeenCalled(); // Should reload after delete
  }));

  it('should handle delete error', fakeAsync(() => {
    mockService.list.and.returnValue(of({ items: mockInstruments, total: 1 }));
    fixture.detectChanges();
    tick();
    
    const dialogRef = { 
      afterClosed: () => of(true),
      componentInstance: {},
      close: jasmine.createSpy('close')
    };
    
    const componentDialog = (component as any).dialog;
    const componentSnackBar = (component as any).snackBar;
    
    const openSpy = spyOn(componentDialog, 'open').and.returnValue(dialogRef as any);
    const snackBarSpy = spyOn(componentSnackBar, 'open').and.returnValue({} as any);
    
    const errorObj = { message: 'Delete failed' };
    mockService.remove.and.returnValue(throwError(() => errorObj));

    component.onDelete(1);
    tick(); // Process dialog subscription (afterClosed emits true)
    tick(); // Process delete subscription and error

    expect(openSpy).toHaveBeenCalled();
    expect(mockService.remove).toHaveBeenCalledWith(1);
    expect(snackBarSpy).toHaveBeenCalledWith(
      'Delete failed',
      'Close',
      jasmine.any(Object)
    );
  }));

  it('should update filters from route params', () => {
    mockRoute.queryParams = of({ type: 'Equity', sector: 'Technology', country: 'USA' });
    mockRoute.snapshot.queryParams = { type: 'Equity', sector: 'Technology', country: 'USA' };
    mockService.list.and.returnValue(of({ items: mockInstruments, total: 1 }));
    
    fixture.detectChanges();

    const filters = component.filters();
    expect(filters.selectedType).toBe('Equity');
    expect(filters.selectedSector).toBe('Technology');
    expect(filters.selectedCountry).toBe('USA');
  });

  it('should handle filter change events', fakeAsync(() => {
    mockService.list.and.returnValue(of({ items: mockInstruments, total: 1 }));
    fixture.detectChanges();
    tick();

    component.onTypeFilterChange('Equity');
    tick();

    const filters = component.filters();
    expect(filters.selectedType).toBe('Equity');
    expect(component.currentPage()).toBe(0); // Should reset to first page
  }));

  it('should clear all filters', fakeAsync(() => {
    component.filters.set({
      selectedType: 'Equity',
      selectedSector: 'Technology',
      selectedCountry: 'USA'
    });
    component.searchControl.setValue('test');
    
    mockService.list.and.returnValue(of({ items: mockInstruments, total: 1 }));
    fixture.detectChanges();
    tick();

    component.onClearAllFilters();
    tick();

    const filters = component.filters();
    expect(filters.selectedType).toBeNull();
    expect(filters.selectedSector).toBeNull();
    expect(filters.selectedCountry).toBeNull();
    expect(component.searchControl.value).toBe('');
  }));

  it('should update filter options from loaded instruments', () => {
    const instruments: Instrument[] = [
      { ...mockInstruments[0], instrument_type: 'Equity', sector: 'Tech', country: 'USA' },
      { ...mockInstruments[0], instrument_id: 2, instrument_type: 'Bond', sector: 'Finance', country: 'CH' }
    ];

    mockService.list.and.returnValue(of({ items: instruments, total: 2 }));
    fixture.detectChanges();

    const options = component.filterOptions();
    expect(options.types).toContain('Equity');
    expect(options.types).toContain('Bond');
    expect(options.sectors).toContain('Tech');
    expect(options.sectors).toContain('Finance');
    expect(options.countries).toContain('USA');
    expect(options.countries).toContain('CH');
  });

  it('should detect active filters', () => {
    expect(component.hasActiveFilters()).toBe(false);

    component.searchControl.setValue('test');
    expect(component.hasActiveFilters()).toBe(true);

    component.searchControl.setValue('');
    component.filters.set({ selectedType: 'Equity', selectedSector: null, selectedCountry: null });
    expect(component.hasActiveFilters()).toBe(true);
  });

  it('should handle retry after error', fakeAsync(() => {
    mockService.list.and.returnValue(throwError(() => ({ message: 'Network error' })));
    fixture.detectChanges();
    tick();

    expect(component.error()).toBeTruthy();
    
    mockService.list.and.returnValue(of({ items: mockInstruments, total: 1 }));
    component.retry();
    tick();

    expect(component.error()).toBeNull();
    expect(component.dataSource.data.length).toBeGreaterThan(0);
  }));

  it('should parse invalid page/size params with defaults', () => {
    mockRoute.queryParams = of({ page: 'invalid', size: 'invalid' });
    mockRoute.snapshot.queryParams = { page: 'invalid', size: 'invalid' };
    mockService.list.and.returnValue(of({ items: mockInstruments, total: 1 }));
    
    fixture.detectChanges();

    expect(component.currentPage()).toBe(0);
    expect(component.pageSize()).toBe(10);
  });
});
