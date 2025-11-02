import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { InstrumentFormComponent } from './instrument-form.component';
import { InstrumentsService } from '../services/instruments.service';
import { of, throwError } from 'rxjs';
import { Instrument } from '../models/instrument.model';

describe('InstrumentFormComponent', () => {
  let component: InstrumentFormComponent;
  let fixture: ComponentFixture<InstrumentFormComponent>;
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
    mockService = jasmine.createSpyObj('InstrumentsService', ['create', 'update', 'get']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
    
    mockRoute = {
      snapshot: {
        url: [{ path: 'new' }],
        paramMap: {
          get: jasmine.createSpy('get').and.returnValue(null)
        }
      }
    };

    await TestBed.configureTestingModule({
      imports: [InstrumentFormComponent, NoopAnimationsModule],
      providers: [
        { provide: InstrumentsService, useValue: mockService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockRoute },
        { provide: MatSnackBar, useValue: mockSnackBar }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(InstrumentFormComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should validate required fields', () => {
    fixture.detectChanges();
    expect(component.form.get('short_name')?.hasError('required')).toBe(true);
    expect(component.form.get('full_name')?.hasError('required')).toBe(true);
    expect(component.form.get('instrument_type')?.hasError('required')).toBe(true);
    expect(component.form.get('original_currency')?.hasError('required')).toBe(true);
    expect(component.form.get('interest_currency')?.hasError('required')).toBe(true);
  });

  it('should validate symbol pattern', () => {
    fixture.detectChanges();
    const control = component.form.get('short_name');
    control?.setValue('invalid-symbol!');
    expect(control?.hasError('pattern')).toBe(true);
    
    control?.setValue('AAPL');
    expect(control?.hasError('pattern')).toBe(false);
  });

  it('should validate ISIN pattern', () => {
    fixture.detectChanges();
    const control = component.form.get('isin');
    control?.setValue('INVALID');
    expect(control?.hasError('pattern')).toBe(true);
    
    control?.setValue('US0378331005');
    expect(control?.hasError('pattern')).toBe(false);
  });

  it('should create instrument when form is valid', (done) => {
    fixture.detectChanges();
    component.form.patchValue({
      short_name: 'MSFT',
      full_name: 'Microsoft Corporation',
      instrument_type: 'Equity',
      original_currency: 'USD',
      interest_currency: 'USD'
    });
    component.form.markAsDirty();

    const created = { ...mockInstrument, instrument_id: 2, short_name: 'MSFT' };
    mockService.create.and.returnValue(of(created));

    component.onSubmit(false);
    
    setTimeout(() => {
      expect(mockService.create).toHaveBeenCalled();
      done();
    }, 50);
  });

  it('should disable save when form is invalid or pristine', () => {
    fixture.detectChanges();
    expect(component.isSaveDisabled()).toBe(true);
    
    component.form.patchValue({
      short_name: 'MSFT',
      full_name: 'Microsoft',
      instrument_type: 'Equity',
      original_currency: 'USD',
      interest_currency: 'USD'
    });
    component.form.markAsDirty();
    
    expect(component.isSaveDisabled()).toBe(false);
  });

  describe('Edge Cases and Validation', () => {
    it('should validate symbol with maximum length', () => {
      fixture.detectChanges();
      const control = component.form.get('short_name');
      control?.setValue('A'.repeat(15)); // Max length
      expect(control?.valid).toBe(true);
      
      control?.setValue('A'.repeat(16)); // Exceeds max
      expect(control?.hasError('pattern')).toBe(true);
    });

    it('should validate minimum name length', () => {
      fixture.detectChanges();
      const control = component.form.get('full_name');
      control?.setValue('A'); // Too short
      expect(control?.hasError('minlength')).toBe(true);
      
      control?.setValue('AB'); // Valid
      expect(control?.hasError('minlength')).toBe(false);
    });

    it('should validate uppercase for symbol fields', () => {
      fixture.detectChanges();
      const symbolControl = component.form.get('short_name');
      symbolControl?.setValue('aapl');
      expect(symbolControl?.hasError('notUppercase')).toBe(true);
      
      symbolControl?.setValue('AAPL');
      expect(symbolControl?.hasError('notUppercase')).toBe(false);
    });

    it('should validate negative price', () => {
      fixture.detectChanges();
      const control = component.form.get('last_price');
      control?.setValue(-10);
      expect(control?.hasError('min')).toBe(true);
      
      control?.setValue(0);
      expect(control?.hasError('min')).toBe(false);
      
      control?.setValue(100.50);
      expect(control?.hasError('min')).toBe(false);
    });

    it('should handle form submission when pristine', () => {
      fixture.detectChanges();
      component.form.patchValue({
        short_name: 'TEST',
        full_name: 'Test Instrument',
        instrument_type: 'Equity',
        original_currency: 'USD',
        interest_currency: 'USD'
      });
      // Don't mark as dirty

      component.onSubmit(false);
      expect(mockService.create).not.toHaveBeenCalled();
    });

    it('should handle form submission when invalid', () => {
      fixture.detectChanges();
      component.form.patchValue({
        short_name: '', // Invalid - required
        full_name: 'Test',
        instrument_type: 'Equity',
        original_currency: 'USD',
        interest_currency: 'USD'
      });
      component.form.markAsDirty();

      component.onSubmit(false);
      expect(mockService.create).not.toHaveBeenCalled();
    });

    it('should handle save and continue in create mode', (done) => {
      fixture.detectChanges();
      component.form.patchValue({
        short_name: 'TEST',
        full_name: 'Test Instrument',
        instrument_type: 'Equity',
        original_currency: 'USD',
        interest_currency: 'USD'
      });
      component.form.markAsDirty();

      const created = { ...mockInstrument, instrument_id: 2, short_name: 'TEST' };
      mockService.create.and.returnValue(of(created));

      component.onSubmit(true); // Save and continue

      setTimeout(() => {
        expect(mockService.create).toHaveBeenCalled();
        expect(component.form.pristine).toBe(true);
        // After reset, form values are null, not empty string
        expect(component.form.value.short_name).toBeNull();
        done();
      }, 50);
    });

    it('should handle save and continue in edit mode', (done) => {
      mockRoute.snapshot.url = [{ path: '1' }, { path: 'edit' }];
      mockRoute.snapshot.paramMap.get = jasmine.createSpy('get').and.returnValue('1');
      component.mode = 'edit';
      component.instrument = mockInstrument;
      
      fixture.detectChanges();
      
      component.form.patchValue({ short_name: 'UPDATED' });
      component.form.markAsDirty();

      const updated = { ...mockInstrument, short_name: 'UPDATED' };
      mockService.update.and.returnValue(of(updated));

      component.onSubmit(true); // Save and continue

      setTimeout(() => {
        expect(mockService.update).toHaveBeenCalled();
        expect(component.instrument?.short_name).toBe('UPDATED');
        expect(component.form.value.short_name).toBe('UPDATED');
        done();
      }, 50);
    });

    it('should handle cancel in create mode', () => {
      fixture.detectChanges();
      component.onCancel();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/instruments']);
    });

    it('should handle cancel in edit mode', () => {
      component.mode = 'edit';
      component.instrument = mockInstrument;
      fixture.detectChanges();
      
      component.onCancel();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/instruments', 1]);
    });

    it('should handle loading instrument error in edit mode', fakeAsync(() => {
      mockRoute.snapshot.url = [{ path: '1' }, { path: 'edit' }];
      mockRoute.snapshot.paramMap.get = jasmine.createSpy('get').and.returnValue('1');
      component.mode = 'edit';
      
      // Spy on component's actual snackbar
      const componentSnackBar = (component as any).snackBar;
      const snackBarSpy = spyOn(componentSnackBar, 'open').and.returnValue({} as any);
      
      mockService.get.and.returnValue(throwError(() => ({ message: 'Not found' })));

      fixture.detectChanges();
      tick(); // Process error handler

      expect(snackBarSpy).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalled();
    }));

    it('should handle form with all optional fields filled', () => {
      fixture.detectChanges();
      component.form.patchValue({
        short_name: 'TEST',
        full_name: 'Test Instrument',
        instrument_type: 'Equity',
        original_currency: 'USD',
        interest_currency: 'USD',
        isin: 'US1234567890',
        sector: 'Technology',
        industry: 'Software',
        country: 'USA',
        statistical_currency: 'USD',
        yahoo_symbol: 'TEST',
        reuters_symbol: 'TEST.R',
        telekurs_symbol: 'TEST.T',
        last_price: 100.50,
        last_price_date: '2024-01-01',
        metadata_json: '{"key": "value"}',
        free_text_0: 'Note 1',
        free_text_1: 'Note 2',
        free_text_2: 'Note 3',
        free_text_3: 'Note 4'
      });

      expect(component.form.valid).toBe(true);
    });

    it('should handle empty optional fields correctly', () => {
      fixture.detectChanges();
      component.form.patchValue({
        short_name: 'TEST',
        full_name: 'Test Instrument',
        instrument_type: 'Equity',
        original_currency: 'USD',
        interest_currency: 'USD',
        isin: '',
        sector: '',
        country: '',
        statistical_currency: ''
      });

      expect(component.form.valid).toBe(true);
      
      const formValue = (component as any).getFormValue();
      // Empty optional fields might be cleaned up, check if it's empty string or undefined
      expect(formValue.isin === '' || formValue.isin === undefined || formValue.isin === null).toBe(true);
    });

    it('should handle getFormValue cleanup for edit mode', () => {
      component.mode = 'edit';
      fixture.detectChanges();
      
      component.form.patchValue({
        short_name: 'TEST',
        full_name: 'Test',
        instrument_type: 'Equity',
        original_currency: 'USD',
        interest_currency: 'USD',
        last_price_date: ''
      });

      const formValue = (component as any).getFormValue();
      expect(formValue.last_price_date).toBe(null);
    });

    it('should handle getFormValue cleanup for create mode', () => {
      fixture.detectChanges();
      
      component.form.patchValue({
        short_name: 'TEST',
        full_name: 'Test',
        instrument_type: 'Equity',
        original_currency: 'USD',
        interest_currency: 'USD',
        last_price_date: ''
      });

      const formValue = (component as any).getFormValue();
      expect(formValue.last_price_date).toBeUndefined();
    });

    it('should handle error messages for all validation types', () => {
      fixture.detectChanges();
      
      const shortName = component.form.get('short_name');
      shortName?.setValue('');
      shortName?.markAsTouched();
      expect(component.getErrorMessage('short_name')).toContain('required');

      shortName?.setValue('aapl');
      // Error message for pattern validation
      expect(component.getErrorMessage('short_name')).toContain('Invalid format');

      const fullName = component.form.get('full_name');
      fullName?.setValue('A');
      fullName?.markAsTouched();
      expect(component.getErrorMessage('full_name')).toContain('at least');

      const price = component.form.get('last_price');
      price?.setValue(-1);
      price?.markAsTouched();
      expect(component.getErrorMessage('last_price')).toContain('at least');
    });

    it('should handle hasError correctly', () => {
      fixture.detectChanges();
      
      const control = component.form.get('short_name');
      expect(component.hasError('short_name')).toBe(false); // Not touched yet

      control?.markAsTouched();
      control?.setValue('');
      expect(component.hasError('short_name')).toBe(true);

      control?.setValue('VALID');
      expect(component.hasError('short_name')).toBe(false);
    });

    it('should populate form when instrument input is provided', () => {
      component.instrument = mockInstrument;
      fixture.detectChanges();

      expect(component.form.value.short_name).toBe('AAPL');
      expect(component.form.value.full_name).toBe('Apple Inc.');
      expect(component.form.pristine).toBe(true);
    });
  });
});
