import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { catchError, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';
import { InstrumentsService } from '../services/instruments.service';
import { Instrument } from '../models/instrument.model';
import { InstrumentFormComponent } from '../instrument-form/instrument-form.component';

@Component({
  selector: 'app-instrument-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatSnackBarModule,
    InstrumentFormComponent
  ],
  templateUrl: './instrument-detail.component.html',
  styleUrl: './instrument-detail.component.css'
})
export class InstrumentDetailComponent implements OnInit {
  readonly instrumentsService = inject(InstrumentsService);
  readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);

  readonly instrument = signal<Instrument | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly editing = signal(false);

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = parseInt(params['id'], 10);
      if (id) {
        this.loadInstrument(id);
      }
    });
  }

  /**
   * Load instrument by ID
   */
  loadInstrument(id: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.instrumentsService.get(id).subscribe({
      next: instrument => {
        this.instrument.set(instrument);
        this.loading.set(false);
      },
      error: err => {
        this.error.set(err.message || 'Failed to load instrument');
        this.loading.set(false);
        this.snackBar.open(this.error() || 'Error loading instrument', 'Close', {
          duration: 5000
        });
      }
    });
  }

  /**
   * Toggle edit mode
   */
  toggleEdit(): void {
    this.editing.set(!this.editing());
  }

  /**
   * Handle form save
   */
  onSave(dto: any): void {
    const instrument = this.instrument();
    if (!instrument) return;

    this.loading.set(true);
    this.instrumentsService.update(instrument.instrument_id, dto).subscribe({
      next: updated => {
        this.instrument.set(updated);
        this.editing.set(false);
        this.loading.set(false);
        this.snackBar.open('Instrument updated successfully', 'Close', {
          duration: 3000
        });
      },
      error: err => {
        this.loading.set(false);
        this.snackBar.open(err.message || 'Failed to update instrument', 'Close', {
          duration: 5000
        });
      }
    });
  }

  /**
   * Handle cancel
   */
  onCancel(): void {
    this.editing.set(false);
    // Reload to ensure we have latest data
    const instrument = this.instrument();
    if (instrument) {
      this.loadInstrument(instrument.instrument_id);
    }
  }

  /**
   * Retry loading on error
   */
  retry(): void {
    const instrument = this.instrument();
    if (instrument) {
      this.loadInstrument(instrument.instrument_id);
    }
  }

  /**
   * Get metadata as key-value pairs
   */
  getMetadataEntries(): Array<{ key: string; value: any }> {
    const instrument = this.instrument();
    if (!instrument) return [];

    const entries: Array<{ key: string; value: any }> = [];
    
    // Parse metadata_json if present
    if (instrument.metadata_json) {
      try {
        const metadata = JSON.parse(instrument.metadata_json);
        Object.keys(metadata).forEach(key => {
          entries.push({ key, value: metadata[key] });
        });
      } catch {
        // Invalid JSON, skip
      }
    }

    // Add other metadata fields
    const metadataFields = [
      'created_at', 'updated_at', 'last_price_date',
      'issue_date', 'expiration_date', 'first_call_date'
    ];

    metadataFields.forEach(field => {
      const value = (instrument as any)[field];
      if (value) {
        entries.push({ key: field.replace(/_/g, ' '), value });
      }
    });

    return entries;
  }
}
