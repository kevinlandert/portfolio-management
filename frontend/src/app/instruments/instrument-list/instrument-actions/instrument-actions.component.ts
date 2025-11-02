import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Instrument } from '../../models/instrument.model';

@Component({
  selector: 'app-instrument-actions',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule
  ],
  templateUrl: './instrument-actions.component.html',
  styles: [`
    button[mat-icon-button] {
      color: rgba(0, 0, 0, 0.54);
    }
  `]
})
export class InstrumentActionsComponent {
  @Input({ required: true }) instrument!: Instrument;
  @Output() view = new EventEmitter<number>();
  @Output() edit = new EventEmitter<number>();
  @Output() delete = new EventEmitter<number>();

  onView(): void {
    this.view.emit(this.instrument.instrument_id!);
  }

  onEdit(): void {
    this.edit.emit(this.instrument.instrument_id!);
  }

  onDelete(): void {
    this.delete.emit(this.instrument.instrument_id!);
  }
}

