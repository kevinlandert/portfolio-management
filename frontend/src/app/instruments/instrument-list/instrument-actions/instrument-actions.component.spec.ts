import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { InstrumentActionsComponent } from './instrument-actions.component';
import { Instrument } from '../../models/instrument.model';

describe('InstrumentActionsComponent', () => {
  let component: InstrumentActionsComponent;
  let fixture: ComponentFixture<InstrumentActionsComponent>;

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
    await TestBed.configureTestingModule({
      imports: [InstrumentActionsComponent, NoopAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(InstrumentActionsComponent);
    component = fixture.componentInstance;
    component.instrument = mockInstrument;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit view event when view is clicked', () => {
    spyOn(component.view, 'emit');
    component.onView();
    expect(component.view.emit).toHaveBeenCalledWith(1);
  });

  it('should emit edit event when edit is clicked', () => {
    spyOn(component.edit, 'emit');
    component.onEdit();
    expect(component.edit.emit).toHaveBeenCalledWith(1);
  });

  it('should emit delete event when delete is clicked', () => {
    spyOn(component.delete, 'emit');
    component.onDelete();
    expect(component.delete.emit).toHaveBeenCalledWith(1);
  });

  it('should render menu button', () => {
    const compiled = fixture.nativeElement;
    const menuButton = compiled.querySelector('[data-testid="btn-menu-1"]');
    expect(menuButton).toBeTruthy();
  });
});

