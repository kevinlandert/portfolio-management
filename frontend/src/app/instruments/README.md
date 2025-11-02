# Instruments Feature

Full CRUD feature for managing financial instruments with Angular Material UI, optimistic updates, and comprehensive validation.

## Overview

The instruments feature provides a complete interface for managing financial instruments including:

- **List View**: Searchable, sortable, filterable table with pagination
- **Create/Edit Forms**: Reactive forms with comprehensive validation
- **Detail View**: Read-only summary with inline editing capability
- **Optimistic UI**: Instant feedback with automatic rollback on errors

## Architecture

### Components

- **`InstrumentListComponent`**: Main list view with Material table
- **`InstrumentFormComponent`**: Create/edit form with validation
- **`InstrumentDetailComponent`**: Detail view with inline editing
- **`ConfirmDialogComponent`**: Reusable confirmation dialog

### Services

- **`InstrumentsService`**: 
  - CRUD operations with optimistic updates
  - Caching for performance
  - Automatic rollback on error

### Models

- **`Instrument`**: Full instrument model matching backend schema
- **`InstrumentCreate`**: DTO for creation (excludes auto-generated fields)
- **`InstrumentUpdate`**: DTO for updates (all fields optional)
- **`InstrumentListParams`**: Query parameters for list endpoint
- **`InstrumentListResponse`**: Paginated response structure

### Interceptors

- **`mockInstrumentsInterceptor`**: HTTP interceptor for mock data (switchable)

## Features

### List Page

- ✅ Material table with all columns
- ✅ Sticky header, responsive layout
- ✅ MatSort and MatPaginator integration
- ✅ Debounced search (300ms) with URL persistence
- ✅ Filter chips for type, sector, and country
- ✅ Toolbar with "New Instrument" button
- ✅ Row actions: view, edit, delete (with confirmation)
- ✅ Loading states and error handling with retry

### Create/Edit Form

- ✅ Reactive forms with typed validation
- ✅ Immediate validation feedback
- ✅ Required fields: symbol, name, currencies, type
- ✅ Pattern validation: ISIN, symbols, currencies
- ✅ Uppercase enforcement for codes
- ✅ Save, Save and Continue, Cancel actions
- ✅ Disabled save until valid and dirty

### Detail View

- ✅ Summary card with all key fields
- ✅ Metadata key-value table
- ✅ Inline edit toggle (reuses instrument-form)
- ✅ Back navigation
- ✅ Loading and error states

### State Management

- ✅ Optimistic updates for create/update/delete
- ✅ Automatic rollback on API errors
- ✅ Client-side caching for performance
- ✅ URL state synchronization

## API Integration

### Base URL

The service uses `/api/v1/instruments` as the base URL, matching the FastAPI backend.

### Endpoints

- `GET /api/v1/instruments` - List with query params (limit, offset, filters)
- `GET /api/v1/instruments/:id` - Get single instrument
- `POST /api/v1/instruments` - Create new instrument
- `PUT /api/v1/instruments/:id` - Update instrument
- `DELETE /api/v1/instruments/:id` - Delete instrument

### Request/Response Format

**List Request:**
```
GET /api/v1/instruments?limit=10&offset=0&instrument_type=Equity&sector=Technology
```

**List Response:** Array of instruments (service wraps in pagination structure)

**Create Request:**
```json
{
  "short_name": "AAPL",
  "full_name": "Apple Inc.",
  "instrument_type": "Equity",
  "original_currency": "USD",
  "interest_currency": "USD"
}
```

**Create Response:**
```json
{
  "instrument_id": 1,
  "short_name": "AAPL",
  ...all fields with auto-generated values...
}
```

## Mock Data Layer

### Enabling/Disabling Mock Data

The mock data interceptor can be toggled via the `USE_MOCK_DATA` flag:

**File:** `frontend/src/app/instruments/interceptors/mock-instruments.interceptor.ts`

```typescript
export const USE_MOCK_DATA = true;  // Set to false to use real API
```

### Switching to Real API

1. Set `USE_MOCK_DATA = false` in the interceptor file
2. Ensure backend is running at `http://localhost:8000`
3. Configure API proxy in `angular.json` if needed:

```json
{
  "serve": {
    "options": {
      "proxyConfig": "proxy.conf.json"
    }
  }
}
```

### Mock Data Features

- Simulates network delay (300ms)
- Supports all CRUD operations
- Handles pagination and filtering
- Can simulate errors (commented code in interceptor)

## Validation Rules

### Required Fields

- `short_name`: Symbol (1-15 chars, uppercase alphanumeric, dots, hyphens)
- `full_name`: Full name (min 2 chars)
- `instrument_type`: Instrument type (dropdown selection)
- `original_currency`: 3-letter currency code (uppercase)
- `interest_currency`: 3-letter currency code (uppercase)

### Pattern Validation

- **Symbol fields** (`short_name`, `yahoo_symbol`): `[A-Z0-9.\-]{1,15}`
- **ISIN**: `[A-Z]{2}[A-Z0-9]{9}\d` (ISO 6166 format)
- **Currency codes**: `[A-Z]{3}` (ISO 4217 format)

### Field Descriptions

- **short_name**: Trading symbol (e.g., "AAPL")
- **full_name**: Legal/company name
- **isin**: International Securities Identification Number
- **instrument_type**: Type of instrument (Equity, Bond, ETF, or Future)
- **original_currency**: Currency of the instrument's home market
- **interest_currency**: Currency for interest/dividend payments
- **statistical_currency**: Currency for reporting/statistics

## Testing

### Running Tests

```bash
# Run all tests
ng test

# Run with coverage
ng test --code-coverage

# Watch mode
ng test --watch
```

### Test Coverage

- **Service Tests**: HTTP requests, caching, optimistic updates
- **Component Tests**: User interactions, form validation, navigation
- **Target Coverage**: 80%+

### Test Files

- `instruments.service.spec.ts` - Service unit tests
- `instrument-list.component.spec.ts` - List component tests
- `instrument-form.component.spec.ts` - Form validation tests
- `instrument-detail.component.spec.ts` - Detail component tests

## Usage Examples

### Creating an Instrument

1. Navigate to Instruments page
2. Click "New Instrument" button
3. Fill required fields:
   - Symbol: `AAPL`
   - Full Name: `Apple Inc.`
   - Instrument Type: `Equity` (must be one of: Equity, Bond, ETF, or Future)
   - Original Currency: `USD`
   - Interest Currency: `USD`
4. Optionally fill additional fields
5. Click "Save" or "Save and Continue"

### Editing an Instrument

1. Navigate to Instruments page
2. Click menu (three dots) on a row
3. Select "Edit"
4. Modify fields
5. Save changes

### Inline Editing (Detail View)

1. Navigate to instrument detail page
2. Click edit icon (pencil)
3. Form appears inline
4. Make changes and save

### Searching and Filtering

1. Use search box to filter by name, symbol, or ISIN
2. Click filter chips to filter by type, sector, or country
3. All filters persist in URL

## Development Notes

### Standalone Components

All components are standalone (no NgModules). This provides:
- Better tree-shaking
- Lazy loading benefits
- Simpler dependency management

### Type Safety

- Strict TypeScript enabled
- Typed reactive forms
- Full interface definitions for API contracts

### State Management

The service implements:
- In-memory caching for individual items
- Optimistic UI updates
- Automatic rollback on errors
- Cache invalidation strategies

### Performance

- Client-side pagination and sorting for small datasets
- Debounced search (300ms) to reduce API calls
- Material table virtual scrolling ready
- Optimistic updates for instant feedback

## Future Enhancements

- [ ] Server-side sorting (currently client-side)
- [ ] Server-side search (currently client-side)
- [ ] Column selector for instrument types
- [ ] Bulk operations
- [ ] Export functionality
- [ ] Advanced filtering UI
- [ ] Real-time updates via WebSocket

## Troubleshooting

### Mock data not working

- Check `USE_MOCK_DATA` flag is `true`
- Verify interceptor is registered in `app.config.ts`
- Check browser console for errors

### API calls failing

- Verify backend is running
- Check CORS configuration
- Verify API base URL matches backend (`/api/v1/instruments`)

### Form validation not working

- Ensure all required fields are filled
- Check uppercase requirements for codes
- Verify pattern matching for ISIN/symbols

