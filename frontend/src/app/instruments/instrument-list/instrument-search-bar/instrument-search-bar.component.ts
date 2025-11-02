import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';

export interface SearchBarFilters {
  selectedType: string | null;
  selectedSector: string | null;
  selectedCountry: string | null;
}

export interface SearchBarOptions {
  types: string[];
  sectors: string[];
  countries: string[];
}

@Component({
  selector: 'app-instrument-search-bar',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatCardModule
  ],
  templateUrl: './instrument-search-bar.component.html',
  styleUrls: ['./instrument-search-bar.component.css']
})
export class InstrumentSearchBarComponent {
  @Input() searchControl!: FormControl;
  @Input() filters = signal<SearchBarFilters>({
    selectedType: null,
    selectedSector: null,
    selectedCountry: null
  });
  @Input() options = signal<SearchBarOptions>({
    types: [],
    sectors: [],
    countries: []
  });

  @Output() searchChange = new EventEmitter<string>();
  @Output() clearSearchClick = new EventEmitter<void>();
  @Output() typeFilterChange = new EventEmitter<string | null>();
  @Output() sectorFilterChange = new EventEmitter<string | null>();
  @Output() countryFilterChange = new EventEmitter<string | null>();
  @Output() clearAllFiltersClick = new EventEmitter<void>();

  clearSearch(): void {
    this.clearSearchClick.emit();
  }

  toggleTypeFilter(type: string): void {
    const current = this.filters().selectedType;
    const newValue = current === type ? null : type;
    this.typeFilterChange.emit(newValue);
  }

  toggleSectorFilter(sector: string): void {
    const current = this.filters().selectedSector;
    const newValue = current === sector ? null : sector;
    this.sectorFilterChange.emit(newValue);
  }

  toggleCountryFilter(country: string): void {
    const current = this.filters().selectedCountry;
    const newValue = current === country ? null : country;
    this.countryFilterChange.emit(newValue);
  }

  hasActiveFilters(): boolean {
    return !!(
      this.searchControl.value?.trim() ||
      this.filters().selectedType ||
      this.filters().selectedSector ||
      this.filters().selectedCountry
    );
  }

  clearAllFilters(): void {
    this.clearAllFiltersClick.emit();
  }
}

