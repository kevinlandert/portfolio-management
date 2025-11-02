import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { InstrumentDetailComponent } from './instrument-detail.component';
import { InstrumentsService } from '../services/instruments.service';
import { of, throwError, Subject } from 'rxjs';
import { Instrument } from '../models/instrument.model';

describe('InstrumentDetailComponent', () => {
  let component: InstrumentDetailComponent;
  let fixture: ComponentFixture<InstrumentDetailComponent>;
  let mockService: jasmine.SpyObj<InstrumentsService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockRoute: any;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;

  const mockInstrument: Instrument = {
    instrument_id: 1,
    short_name: 'AAPL',
    full_name: 'Apple Inc.',
      instrument_type: 'Equity',
    original_currency: 'USD',
    interest_currency: 'USD',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  };

  beforeEach(async () => {
    mockService = jasmine.createSpyObj('InstrumentsService', ['get', 'update']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
    
    mockRoute = {
      params: of({ id: '1' }),
      snapshot: {
        paramMap: {
          get: jasmine.createSpy('get').and.returnValue('1')
        }
      }
    };

    await TestBed.configureTestingModule({
      imports: [InstrumentDetailComponent, NoopAnimationsModule],
      providers: [
        { provide: InstrumentsService, useValue: mockService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockRoute },
        { provide: MatSnackBar, useValue: mockSnackBar }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(InstrumentDetailComponent);
    component = fixture.componentInstance;
    mockService.get.and.returnValue(of(mockInstrument));
    
    // Ensure mockSnackBar is properly set up
    if (!mockSnackBar.open) {
      mockSnackBar.open = jasmine.createSpy('open').and.returnValue({} as any);
    }
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load instrument on init', () => {
    fixture.detectChanges();
    expect(mockService.get).toHaveBeenCalledWith(1);
    expect(component.instrument()).toEqual(mockInstrument);
  });

  it('should toggle edit mode', () => {
    fixture.detectChanges();
    expect(component.editing()).toBe(false);
    component.toggleEdit();
    expect(component.editing()).toBe(true);
  });

  it('should handle update', () => {
    fixture.detectChanges();
    const updated = { ...mockInstrument, short_name: 'AAPL2' };
    mockService.update.and.returnValue(of(updated));
    
    component.onSave({ short_name: 'AAPL2' });
    expect(mockService.update).toHaveBeenCalledWith(1, { short_name: 'AAPL2' });
  });

  describe('Edge Cases', () => {
    it('should handle loading error', fakeAsync(() => {
      mockService.get.and.returnValue(throwError(() => ({ message: 'Not found' })));
      
      // Spy on component's actual snackbar
      const componentSnackBar = (component as any).snackBar;
      const snackBarSpy = spyOn(componentSnackBar, 'open').and.returnValue({} as any);
      
      fixture.detectChanges();
      tick(); // Process error handler

      expect(component.loading()).toBe(false);
      expect(component.error()).toBeTruthy();
      expect(snackBarSpy).toHaveBeenCalled();
    }));

    it('should handle invalid ID in route params', () => {
      mockRoute.params = of({ id: 'invalid' });
      fixture.detectChanges();

      expect(mockService.get).not.toHaveBeenCalled();
    });

    it('should handle missing ID in route params', () => {
      mockRoute.params = of({});
      fixture.detectChanges();

      expect(mockService.get).not.toHaveBeenCalled();
    });

    it('should toggle edit mode multiple times', () => {
      fixture.detectChanges();
      expect(component.editing()).toBe(false);
      
      component.toggleEdit();
      expect(component.editing()).toBe(true);
      
      component.toggleEdit();
      expect(component.editing()).toBe(false);
    });

    it('should handle cancel edit mode', () => {
      fixture.detectChanges();
      component.toggleEdit();
      expect(component.editing()).toBe(true);

      component.onCancel();
      expect(component.editing()).toBe(false);
      expect(mockService.get).toHaveBeenCalledTimes(2); // Initial + reload
    });

    it('should handle update error', fakeAsync(() => {
      fixture.detectChanges();
      
      // Set edit mode first
      component.toggleEdit();
      expect(component.editing()).toBe(true);
      
      // Spy on component's actual snackbar
      const componentSnackBar = (component as any).snackBar;
      const snackBarSpy = spyOn(componentSnackBar, 'open').and.returnValue({} as any);
      
      mockService.update.and.returnValue(throwError(() => ({ message: 'Update failed' })));

      component.onSave({ short_name: 'UPDATED' });
      tick(); // Process error handler

      expect(component.loading()).toBe(false);
      expect(snackBarSpy).toHaveBeenCalledWith(
        'Update failed',
        'Close',
        jasmine.any(Object)
      );
      // Editing mode should remain true on error (not set to false)
      expect(component.editing()).toBe(true);
    }));

    it('should handle update when instrument is null', () => {
      component.instrument.set(null);
      component.onSave({ short_name: 'UPDATED' });
      
      expect(mockService.update).not.toHaveBeenCalled();
    });

    it('should handle retry when instrument is null', () => {
      component.instrument.set(null);
      component.retry();
      
      expect(mockService.get).not.toHaveBeenCalled();
    });

    it('should handle retry on error', (done) => {
      fixture.detectChanges();
      
      // First load succeeds
      expect(mockService.get).toHaveBeenCalledTimes(1);

      // Simulate error
      component.error.set('Network error');

      // Retry
      mockService.get.and.returnValue(of(mockInstrument));
      component.retry();

      setTimeout(() => {
        expect(mockService.get).toHaveBeenCalledTimes(2);
        expect(component.error()).toBeNull();
        done();
      }, 50);
    });

    it('should handle getMetadataEntries with valid JSON', () => {
      const instrumentWithMetadata: Instrument = {
        ...mockInstrument,
        metadata_json: '{"key1": "value1", "key2": 123}'
      };
      component.instrument.set(instrumentWithMetadata);

      const entries = component.getMetadataEntries();
      expect(entries.length).toBeGreaterThan(0);
      const metadataEntry = entries.find(e => e.key === 'key1');
      expect(metadataEntry).toBeDefined();
      expect(metadataEntry?.value).toBe('value1');
    });

    it('should handle getMetadataEntries with invalid JSON', () => {
      const instrumentWithInvalidMetadata: Instrument = {
        ...mockInstrument,
        metadata_json: 'invalid json'
      };
      component.instrument.set(instrumentWithInvalidMetadata);

      const entries = component.getMetadataEntries();
      // Should not crash, should return entries from other fields
      expect(Array.isArray(entries)).toBe(true);
    });

    it('should handle getMetadataEntries with null metadata', () => {
      const instrumentWithoutMetadata: Instrument = {
        ...mockInstrument,
        metadata_json: null
      };
      component.instrument.set(instrumentWithoutMetadata);

      const entries = component.getMetadataEntries();
      expect(Array.isArray(entries)).toBe(true);
      // Should have entries from date fields if they exist
    });

    it('should handle getMetadataEntries with date fields', () => {
      const instrumentWithDates: Instrument = {
        ...mockInstrument,
        last_price_date: '2024-01-01',
        issue_date: '2023-01-01',
        expiration_date: '2025-01-01'
      };
      component.instrument.set(instrumentWithDates);

      const entries = component.getMetadataEntries();
      expect(entries.length).toBeGreaterThan(0);
      const dateEntry = entries.find(e => e.key.includes('date'));
      expect(dateEntry).toBeDefined();
    });

    it('should handle route param changes', fakeAsync(() => {
      // Start with initial params
      const paramsSubject = new Subject<any>();
      mockRoute.params = paramsSubject.asObservable();
      
      fixture.detectChanges();
      
      // Emit initial params
      paramsSubject.next({ id: '1' });
      tick(); // Process initial load
      
      expect(mockService.get).toHaveBeenCalledWith(1);
      mockService.get.calls.reset();

      // Change route param - emit new params
      const newInstrument = { ...mockInstrument, instrument_id: 2 };
      mockService.get.and.returnValue(of(newInstrument));
      
      // Emit new params
      paramsSubject.next({ id: '2' });
      tick(); // Process route params subscription

      expect(mockService.get).toHaveBeenCalledWith(2);
    }));
  });
});
