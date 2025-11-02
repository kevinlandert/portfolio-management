import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { InstrumentSearchBarComponent, SearchBarFilters, SearchBarOptions } from './instrument-search-bar.component';

describe('InstrumentSearchBarComponent', () => {
  let component: InstrumentSearchBarComponent;
  let fixture: ComponentFixture<InstrumentSearchBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstrumentSearchBarComponent, NoopAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(InstrumentSearchBarComponent);
    component = fixture.componentInstance;
    component.searchControl = new FormControl('');
    component.filters = signal<SearchBarFilters>({
      selectedType: null,
      selectedSector: null,
      selectedCountry: null
    });
    component.options = signal<SearchBarOptions>({
      types: [],
      sectors: [],
      countries: []
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Filter toggles', () => {
    beforeEach(() => {
      component.filters = signal<SearchBarFilters>({
        selectedType: null,
        selectedSector: null,
        selectedCountry: null
      });
      component.options = signal<SearchBarOptions>({
        types: ['Equity', 'Bond'],
        sectors: ['Technology'],
        countries: ['USA']
      });
    });

    it('should emit type filter change', () => {
      spyOn(component.typeFilterChange, 'emit');
      component.toggleTypeFilter('Equity');
      expect(component.typeFilterChange.emit).toHaveBeenCalledWith('Equity');
    });

    it('should toggle type filter off when already selected', () => {
      // Set filters with Equity already selected
      component.filters.set({
        selectedType: 'Equity',
        selectedSector: null,
        selectedCountry: null
      });
      spyOn(component.typeFilterChange, 'emit');
      component.toggleTypeFilter('Equity');
      expect(component.typeFilterChange.emit).toHaveBeenCalledWith(null);
    });

    it('should emit sector filter change', () => {
      spyOn(component.sectorFilterChange, 'emit');
      component.toggleSectorFilter('Technology');
      expect(component.sectorFilterChange.emit).toHaveBeenCalledWith('Technology');
    });

    it('should emit country filter change', () => {
      spyOn(component.countryFilterChange, 'emit');
      component.toggleCountryFilter('USA');
      expect(component.countryFilterChange.emit).toHaveBeenCalledWith('USA');
    });
  });

  describe('Clear actions', () => {
    it('should emit clear search click', () => {
      spyOn(component.clearSearchClick, 'emit');
      component.clearSearch();
      expect(component.clearSearchClick.emit).toHaveBeenCalled();
    });

    it('should emit clear all filters click', () => {
      spyOn(component.clearAllFiltersClick, 'emit');
      component.clearAllFilters();
      expect(component.clearAllFiltersClick.emit).toHaveBeenCalled();
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false when no filters are active', () => {
      component.searchControl.setValue('');
      component.filters = signal<SearchBarFilters>({
        selectedType: null,
        selectedSector: null,
        selectedCountry: null
      });
      expect(component.hasActiveFilters()).toBe(false);
    });

    it('should return true when search has value', () => {
      component.searchControl.setValue('test');
      component.filters = signal<SearchBarFilters>({
        selectedType: null,
        selectedSector: null,
        selectedCountry: null
      });
      expect(component.hasActiveFilters()).toBe(true);
    });

    it('should return true when type filter is active', () => {
      component.searchControl.setValue('');
      component.filters = signal<SearchBarFilters>({
        selectedType: 'Equity',
        selectedSector: null,
        selectedCountry: null
      });
      expect(component.hasActiveFilters()).toBe(true);
    });
  });
});

