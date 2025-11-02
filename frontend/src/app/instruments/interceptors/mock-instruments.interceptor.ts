import { HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { of, delay, throwError } from 'rxjs';
import { Instrument } from '../models/instrument.model';

/**
 * Flag to enable/disable mock data
 * Set to false to use real API
 */
export const USE_MOCK_DATA = true;

/**
 * Mock data store (in-memory)
 */
let mockInstruments: Instrument[] = [
  {
    instrument_id: 1,
    short_name: 'AAPL',
    full_name: 'Apple Inc.',
    isin: 'US0378331005',
    instrument_type: 'Equity',
    sector: 'Technology',
    industry: 'Consumer Electronics',
    country: 'USA',
    original_currency: 'USD',
    interest_currency: 'USD',
    statistical_currency: 'USD',
    preferred_exchange: 'NASDAQ',
    yahoo_symbol: 'AAPL',
    reuters_symbol: 'AAPL.O',
    last_price: 175.50,
    last_price_date: '2024-01-15',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z'
  },
  {
    instrument_id: 2,
    short_name: 'MSFT',
    full_name: 'Microsoft Corporation',
    isin: 'US5949181045',
    instrument_type: 'Equity',
    sector: 'Technology',
    industry: 'Software',
    country: 'USA',
    original_currency: 'USD',
    interest_currency: 'USD',
    statistical_currency: 'USD',
    preferred_exchange: 'NASDAQ',
    yahoo_symbol: 'MSFT',
    reuters_symbol: 'MSFT.O',
    last_price: 380.25,
    last_price_date: '2024-01-15',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z'
  },
  {
    instrument_id: 3,
    short_name: 'TSLA',
    full_name: 'Tesla, Inc.',
    isin: 'US88160R1014',
    instrument_type: 'Equity',
    sector: 'Consumer Cyclical',
    industry: 'Auto Manufacturers',
    country: 'USA',
    original_currency: 'USD',
    interest_currency: 'USD',
    statistical_currency: 'USD',
    preferred_exchange: 'NASDAQ',
    yahoo_symbol: 'TSLA',
    reuters_symbol: 'TSLA.O',
    last_price: 248.50,
    last_price_date: '2024-01-15',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z'
  }
];

let nextId = 4;

/**
 * Simulate network delay
 */
const DELAY_MS = 300;

/**
 * HTTP Interceptor for mocking instruments API
 */
export const mockInstrumentsInterceptor: HttpInterceptorFn = (req, next) => {
  // Only intercept if mock is enabled and request is for instruments API
  if (!USE_MOCK_DATA || (!req.url.includes('/api/v1/instruments') && !req.url.includes('/api/instruments'))) {
    return next(req);
  }

  // Parse URL and method
  const url = req.url;
  const method = req.method;
  const urlMatch = url.match(/\/api\/(?:v1\/)?instruments(?:\/(\d+))?/);
  const id = urlMatch?.[1] ? parseInt(urlMatch[1], 10) : null;

  // Simulate errors (for testing rollback functionality)
  // Uncomment to test error scenarios:
  // if (method === 'POST' && Math.random() > 0.7) {
  //   return throwError(() => new HttpResponse({ status: 500, body: { detail: 'Simulated server error' } }))
  //     .pipe(delay(DELAY_MS));
  // }

  // Handle different HTTP methods
  if (method === 'GET' && id === null) {
    // GET /api/instruments - List with pagination and filters
    return handleList(req).pipe(delay(DELAY_MS));
  } else if (method === 'GET' && id !== null) {
    // GET /api/instruments/:id - Get single instrument
    return handleGet(id).pipe(delay(DELAY_MS));
  } else if (method === 'POST') {
    // POST /api/instruments - Create
    return handleCreate(req.body as any).pipe(delay(DELAY_MS));
  } else if (method === 'PUT' && id !== null) {
    // PUT /api/instruments/:id - Update
    return handleUpdate(id, req.body as any).pipe(delay(DELAY_MS));
  } else if (method === 'DELETE' && id !== null) {
    // DELETE /api/instruments/:id - Delete
    return handleDelete(id).pipe(delay(DELAY_MS));
  }

  // Fallback to real request
  return next(req);
};

/**
 * Handle list request with pagination and filtering
 */
function handleList(req: HttpRequest<any>) {
  const params = req.params;
  const query = params.get('query') || '';
  const limit = parseInt(params.get('limit') || '100', 10);
  const offset = parseInt(params.get('offset') || '0', 10);
  const sort = params.get('sort') || '';
  const instrument_type = params.get('instrument_type');
  const sector = params.get('sector');
  const country = params.get('country');
  
  // Calculate page/size for client-side filtering
  const page = Math.floor(offset / limit);
  const size = limit;

  let filtered = [...mockInstruments];

  // Apply search query
  if (query) {
    const q = query.toLowerCase();
    filtered = filtered.filter(i =>
      i.short_name.toLowerCase().includes(q) ||
      i.full_name.toLowerCase().includes(q) ||
      i.isin?.toLowerCase().includes(q) ||
      i.yahoo_symbol?.toLowerCase().includes(q)
    );
  }

  // Apply filters
  if (instrument_type) {
    filtered = filtered.filter(i => i.instrument_type === instrument_type);
  }
  if (sector) {
    filtered = filtered.filter(i => i.sector === sector);
  }
  if (country) {
    filtered = filtered.filter(i => i.country === country);
  }

  // Apply sorting
  if (sort) {
    const [field, direction] = sort.split(',');
    const dir = direction === 'desc' ? -1 : 1;
    filtered.sort((a, b) => {
      const aVal = (a as any)[field];
      const bVal = (b as any)[field];
      if (aVal < bVal) return -1 * dir;
      if (aVal > bVal) return 1 * dir;
      return 0;
    });
  }

    // Apply pagination
    const total = filtered.length;
    const start = offset;
    const end = start + limit;
    const items = filtered.slice(start, end);

    return of(new HttpResponse({
      status: 200,
      body: items // Backend returns array directly, we'll wrap it in service
    }));
}

/**
 * Handle get single instrument
 */
function handleGet(id: number) {
  const instrument = mockInstruments.find(i => i.instrument_id === id);
  if (!instrument) {
    return throwError(() => new HttpResponse({
      status: 404,
      body: { detail: `Instrument with ID ${id} not found` }
    }));
  }
  return of(new HttpResponse({
    status: 200,
    body: instrument
  }));
}

/**
 * Handle create instrument
 */
function handleCreate(dto: any) {
  const now = new Date().toISOString();
  const newInstrument: Instrument = {
    ...dto,
    instrument_id: nextId++,
    created_at: now,
    updated_at: now
  };
  mockInstruments.push(newInstrument);
  return of(new HttpResponse({
    status: 201,
    body: newInstrument
  }));
}

/**
 * Handle update instrument
 */
function handleUpdate(id: number, dto: any) {
  const index = mockInstruments.findIndex(i => i.instrument_id === id);
  if (index === -1) {
    return throwError(() => new HttpResponse({
      status: 404,
      body: { detail: `Instrument with ID ${id} not found` }
    }));
  }
  const updated: Instrument = {
    ...mockInstruments[index],
    ...dto,
    instrument_id: id, // Ensure ID can't be changed
    updated_at: new Date().toISOString()
  };
  mockInstruments[index] = updated;
  return of(new HttpResponse({
    status: 200,
    body: updated
  }));
}

/**
 * Handle delete instrument
 */
function handleDelete(id: number) {
  const index = mockInstruments.findIndex(i => i.instrument_id === id);
  if (index === -1) {
    return throwError(() => new HttpResponse({
      status: 404,
      body: { detail: `Instrument with ID ${id} not found` }
    }));
  }
  mockInstruments.splice(index, 1);
  return of(new HttpResponse({
    status: 204,
    body: null
  }));
}

