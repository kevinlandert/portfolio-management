import { Component, OnInit, Input, Output, EventEmitter, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { InstrumentsService } from '../services/instruments.service';
import { Instrument, InstrumentCreate, InstrumentUpdate } from '../models/instrument.model';
import { getInstrumentTypes, getCurrencies } from '../models/enums';

/**
 * Validation patterns
 */
const SYMBOL_PATTERN = /^[A-Z0-9.\-]{1,15}$/;
const ISIN_PATTERN = /^[A-Z]{2}[A-Z0-9]{9}\d$/;
const CURRENCY_PATTERN = /^[A-Z]{3}$/;

@Component({
  selector: 'app-instrument-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatCheckboxModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatSnackBarModule
  ],
  templateUrl: './instrument-form.component.html',
  styleUrl: './instrument-form.component.css'
})
export class InstrumentFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly instrumentsService = inject(InstrumentsService);
  private readonly snackBar = inject(MatSnackBar);

  @Input() instrument: Instrument | null = null;
  @Input() mode: 'create' | 'edit' = 'create';
  @Output() save = new EventEmitter<InstrumentCreate | InstrumentUpdate>();
  @Output() saveAndContinue = new EventEmitter<InstrumentCreate | InstrumentUpdate>();
  @Output() cancel = new EventEmitter<void>();

  readonly form!: FormGroup;
  readonly loading = signal(false);
  readonly submitting = signal(false);

  // Instrument types - from enum
  readonly instrumentTypes = getInstrumentTypes();

  // Currency codes - from enum
  readonly currencies = getCurrencies();

  constructor() {
    this.form = this.createForm();
  }

  ngOnInit(): void {
    // Determine mode from route
    const url = this.route.snapshot.url.join('/');
    if (url.includes('/edit')) {
      this.mode = 'edit';
    } else if (url.includes('/new')) {
      this.mode = 'create';
    }

    // Load instrument if editing
    if (this.mode === 'edit') {
      const id = parseInt(this.route.snapshot.paramMap.get('id') || '0', 10);
      if (id && !this.instrument) {
        this.loadInstrument(id);
      } else if (this.instrument) {
        this.populateForm(this.instrument);
      }
    } else if (this.instrument) {
      this.populateForm(this.instrument);
    }
  }

  /**
   * Load instrument for editing
   */
  private loadInstrument(id: number): void {
    this.loading.set(true);
    this.instrumentsService.get(id).subscribe({
      next: instrument => {
        this.instrument = instrument;
        this.populateForm(instrument);
        this.loading.set(false);
      },
      error: err => {
        this.loading.set(false);
        this.snackBar.open(err.message || 'Failed to load instrument', 'Close', {
          duration: 5000
        });
        this.onCancel();
      }
    });
  }

  /**
   * Create the reactive form with validation
   */
  private createForm(): FormGroup {
    return this.fb.group({
      short_name: ['', [
        Validators.required,
        Validators.pattern(SYMBOL_PATTERN),
        this.uppercaseValidator
      ]],
      full_name: ['', [
        Validators.required,
        Validators.minLength(2)
      ]],
      instrument_type: ['', Validators.required],
      isin: ['', [Validators.pattern(ISIN_PATTERN)]],
      sector: [''],
      industry: [''],
      country: [''],
      original_currency: ['', [
        Validators.required
      ]],
      interest_currency: ['', [
        Validators.required
      ]],
      statistical_currency: [''],
      preferred_exchange: [''],
      yahoo_symbol: ['', [Validators.pattern(SYMBOL_PATTERN), this.uppercaseValidator]],
      reuters_symbol: [''],
      telekurs_symbol: [''],
      last_price: [null, [Validators.min(0)]],
      last_price_date: [''],
      metadata_json: [''],
      free_text_0: [''],
      free_text_1: [''],
      free_text_2: [''],
      free_text_3: ['']
    });
  }

  /**
   * Populate form with instrument data
   */
  private populateForm(instrument: Instrument): void {
    this.form.patchValue({
      short_name: instrument.short_name,
      full_name: instrument.full_name,
      instrument_type: instrument.instrument_type,
      isin: instrument.isin || '',
      sector: instrument.sector || '',
      industry: instrument.industry || '',
      country: instrument.country || '',
      original_currency: instrument.original_currency,
      interest_currency: instrument.interest_currency,
      statistical_currency: instrument.statistical_currency || '',
      preferred_exchange: instrument.preferred_exchange || '',
      yahoo_symbol: instrument.yahoo_symbol || '',
      reuters_symbol: instrument.reuters_symbol || '',
      telekurs_symbol: instrument.telekurs_symbol || '',
      last_price: instrument.last_price || null,
      last_price_date: instrument.last_price_date || '',
      metadata_json: instrument.metadata_json || '',
      free_text_0: instrument.free_text_0 || '',
      free_text_1: instrument.free_text_1 || '',
      free_text_2: instrument.free_text_2 || '',
      free_text_3: instrument.free_text_3 || ''
    });
    this.form.markAsPristine();
  }

  /**
   * Uppercase validator
   */
  private uppercaseValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const value = control.value as string;
    return value === value.toUpperCase() ? null : { notUppercase: true };
  }

  /**
   * Get form value as DTO
   */
  private getFormValue(): InstrumentCreate | InstrumentUpdate {
    const value = this.form.value;
    
    // Clean up empty strings to null/undefined
    const cleaned: any = {};
    Object.keys(value).forEach(key => {
      const val = value[key];
      if (val === '' || val === null) {
        // Skip empty strings for optional fields in update mode
        if (this.mode === 'edit') {
          cleaned[key] = null;
        }
        // In create mode, don't include empty optional fields
      } else {
        cleaned[key] = val;
      }
    });

    // Convert date string to proper format if provided
    if (cleaned.last_price_date && cleaned.last_price_date.trim()) {
      // Keep as-is (ISO format expected)
    } else if (this.mode === 'edit') {
      cleaned.last_price_date = null;
    } else {
      delete cleaned.last_price_date;
    }

    // Convert numbers
    if (cleaned.last_price !== null && cleaned.last_price !== undefined) {
      cleaned.last_price = parseFloat(cleaned.last_price);
      if (isNaN(cleaned.last_price)) {
        cleaned.last_price = null;
      }
    }

    return cleaned;
  }

  /**
   * Handle form submission
   */
  onSubmit(saveAndContinue: boolean = false): void {
    if (this.form.invalid || this.form.pristine) {
      this.markFormGroupTouched(this.form);
      return;
    }

    this.submitting.set(true);
    const formValue = this.getFormValue();

    if (this.mode === 'create') {
      this.instrumentsService.create(formValue as InstrumentCreate).subscribe({
        next: created => {
          this.submitting.set(false);
          this.snackBar.open('Instrument created successfully', 'Close', {
            duration: 3000
          });
          if (saveAndContinue) {
            this.form.reset();
            this.form.markAsPristine();
          } else {
            this.router.navigate(['/instruments', created.instrument_id]);
          }
        },
        error: err => {
          this.submitting.set(false);
          this.snackBar.open(err.message || 'Failed to create instrument', 'Close', {
            duration: 5000
          });
        }
      });
    } else {
      // Edit mode
      const id = parseInt(this.route.snapshot.paramMap.get('id') || '0', 10);
      this.instrumentsService.update(id, formValue as InstrumentUpdate).subscribe({
        next: updated => {
          this.submitting.set(false);
          this.snackBar.open('Instrument updated successfully', 'Close', {
            duration: 3000
          });
          if (saveAndContinue) {
            // Reload the form with updated data
            this.instrument = updated;
            this.populateForm(updated);
          } else {
            this.router.navigate(['/instruments', updated.instrument_id]);
          }
        },
        error: err => {
          this.submitting.set(false);
          this.snackBar.open(err.message || 'Failed to update instrument', 'Close', {
            duration: 5000
          });
        }
      });
    }
  }

  /**
   * Handle cancel
   */
  onCancel(): void {
    if (this.instrument && this.mode === 'edit') {
      this.router.navigate(['/instruments', this.instrument.instrument_id]);
    } else {
      this.router.navigate(['/instruments']);
    }
  }

  /**
   * Mark all form fields as touched
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * Get error message for a form field
   */
  getErrorMessage(fieldName: string): string {
    const control = this.form.get(fieldName);
    if (!control || !control.errors || !control.touched) {
      return '';
    }

    if (control.errors['required']) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }
    if (control.errors['minlength']) {
      return `${this.getFieldLabel(fieldName)} must be at least ${control.errors['minlength'].requiredLength} characters`;
    }
    if (control.errors['pattern']) {
      return `Invalid format for ${this.getFieldLabel(fieldName)}`;
    }
    if (control.errors['notUppercase']) {
      return `${this.getFieldLabel(fieldName)} must be uppercase`;
    }
    if (control.errors['min']) {
      return `${this.getFieldLabel(fieldName)} must be at least ${control.errors['min'].min}`;
    }

    return `${this.getFieldLabel(fieldName)} is invalid`;
  }

  /**
   * Get human-readable field label
   */
  private getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      short_name: 'Symbol',
      full_name: 'Name',
      instrument_type: 'Instrument Type',
      isin: 'ISIN',
      original_currency: 'Original Currency',
      interest_currency: 'Interest Currency',
      statistical_currency: 'Statistical Currency',
      yahoo_symbol: 'Yahoo Symbol',
      last_price: 'Last Price'
    };
    return labels[fieldName] || fieldName;
  }

  /**
   * Check if field has error
   */
  hasError(fieldName: string): boolean {
    const control = this.form.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }

  /**
   * Check if save button should be disabled
   */
  isSaveDisabled(): boolean {
    return this.form.invalid || this.form.pristine || this.submitting();
  }
}
