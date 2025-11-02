import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { InstrumentsService } from './instruments.service';
import { Instrument, InstrumentCreate, InstrumentUpdate } from '../models/instrument.model';

describe('InstrumentsService', () => {
  let service: InstrumentsService;
  let httpMock: HttpTestingController;

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

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [InstrumentsService]
    });
    service = TestBed.inject(InstrumentsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('list', () => {
    it('should fetch list of instruments', () => {
      const mockInstruments: Instrument[] = [mockInstrument];

      service.list().subscribe(response => {
        expect(response.items).toEqual(mockInstruments);
        expect(response.total).toBe(1);
      });

      const req = httpMock.expectOne(req => {
        return req.url === '/api/v1/instruments/' &&
               req.params.get('limit') === '100';
      });
      expect(req.request.method).toBe('GET');
      req.flush(mockInstruments);
    });

    it('should apply pagination parameters', () => {
      service.list({ page: 1, size: 10 }).subscribe();

      const req = httpMock.expectOne(req => {
        return req.url === '/api/v1/instruments/' &&
               req.params.get('limit') === '10' &&
               req.params.get('offset') === '10';
      });
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('should apply filters', () => {
      service.list({ instrument_type: 'Equity', sector: 'Technology' }).subscribe();

      const req = httpMock.expectOne(req => {
        return req.params.get('instrument_type') === 'Equity' &&
               req.params.get('sector') === 'Technology';
      });
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('should apply search query', () => {
      service.list({ query: 'AAPL' }).subscribe(response => {
        expect(response.items.length).toBe(1);
        expect(response.items[0].short_name).toBe('AAPL');
      });

      const req = httpMock.expectOne(req => {
        return req.url === '/api/v1/instruments/' &&
               req.params.get('limit') === '100';
      });
      req.flush([mockInstrument]);
    });
  });

  describe('get', () => {
    it('should fetch single instrument', () => {
      service.get(1).subscribe(instrument => {
        expect(instrument).toEqual(mockInstrument);
      });

      const req = httpMock.expectOne('/api/v1/instruments/1');
      expect(req.request.method).toBe('GET');
      req.flush(mockInstrument);
    });

    it('should return cached instrument on second call', () => {
      service.get(1).subscribe();
      const req1 = httpMock.expectOne('/api/v1/instruments/1');
      req1.flush(mockInstrument);

      // Second call should use cache (no HTTP request)
      service.get(1).subscribe(instrument => {
        expect(instrument).toEqual(mockInstrument);
      });
      httpMock.expectNone('/api/v1/instruments/1');
    });
  });

  describe('create', () => {
    it('should create new instrument', () => {
      const createDto: InstrumentCreate = {
        short_name: 'MSFT',
        full_name: 'Microsoft Corporation',
        instrument_type: 'Equity',
        original_currency: 'USD',
        interest_currency: 'USD'
      };

      service.create(createDto).subscribe(instrument => {
        expect(instrument.instrument_id).toBe(2);
        expect(instrument.short_name).toBe('MSFT');
      });

      const req = httpMock.expectOne(req => req.url === '/api/v1/instruments/' && req.method === 'POST');
      expect(req.request.body).toEqual(createDto);
      req.flush({ ...createDto, instrument_id: 2, created_at: '2024-01-02T00:00:00Z', updated_at: '2024-01-02T00:00:00Z' });
    });
  });

  describe('update', () => {
    it('should update instrument', () => {
      const updateDto: InstrumentUpdate = {
        last_price: 175.50
      };

      const updated = { ...mockInstrument, ...updateDto, updated_at: '2024-01-02T00:00:00Z' };

      // First get the instrument to cache it
      service.get(1).subscribe();
      const getReq = httpMock.expectOne('/api/v1/instruments/1');
      getReq.flush(mockInstrument);

      // Then update
      service.update(1, updateDto).subscribe(instrument => {
        expect(instrument.last_price).toBe(175.50);
      });

      const req = httpMock.expectOne('/api/v1/instruments/1');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateDto);
      req.flush(updated);
    });
  });

  describe('remove', () => {
    it('should delete instrument', () => {
      // Cache the instrument first
      service.get(1).subscribe();
      const getReq = httpMock.expectOne('/api/v1/instruments/1');
      getReq.flush(mockInstrument);

      service.remove(1).subscribe(() => {
        expect(true).toBeTruthy();
      });

      const req = httpMock.expectOne('/api/v1/instruments/1');
      expect(req.request.method).toBe('DELETE');
      req.flush(null, { status: 204, statusText: 'No Content' });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty response array', () => {
      service.list().subscribe(response => {
        expect(response.items).toEqual([]);
        expect(response.total).toBe(0);
      });

      const req = httpMock.expectOne(req => req.url.startsWith('/api/v1/instruments/'));
      req.flush([]);
    });

    it('should handle null response gracefully', () => {
      service.list().subscribe(response => {
        expect(response.items).toEqual([]);
        expect(response.total).toBe(0);
      });

      const req = httpMock.expectOne(req => req.url.startsWith('/api/v1/instruments/'));
      req.flush(null);
    });

    it('should handle search with special characters', () => {
      service.list({ query: 'AAPL & Co.' }).subscribe(response => {
        expect(response.items).toBeDefined();
      });

      const req = httpMock.expectOne(req => req.url.startsWith('/api/v1/instruments/'));
      req.flush([mockInstrument]);
    });

    it('should handle sorting with null values', () => {
      const instrumentsWithNulls: Instrument[] = [
        { ...mockInstrument, sector: null },
        { ...mockInstrument, instrument_id: 2, sector: 'Technology' }
      ];

      service.list({ sort: 'sector,asc' }).subscribe(response => {
        expect(response.items).toBeDefined();
      });

      const req = httpMock.expectOne(req => req.url.startsWith('/api/v1/instruments/'));
      req.flush(instrumentsWithNulls);
    });

    it('should handle pagination beyond available data', () => {
      service.list({ page: 99, size: 10 }).subscribe(response => {
        expect(response.items).toEqual([]);
        expect(response.total).toBe(0);
      });

      const req = httpMock.expectOne(req => req.url.startsWith('/api/v1/instruments/'));
      req.flush([]);
    });

    it('should handle optimistic create rollback on error', (done) => {
      const createDto: InstrumentCreate = {
        short_name: 'TEST',
        full_name: 'Test Instrument',
        instrument_type: 'Equity',
        original_currency: 'USD',
        interest_currency: 'USD'
      };

      const testId = 999999;

      service.create(createDto).subscribe({
        next: () => fail('Should have errored'),
        error: () => {
          // Cache should not have the optimistic entry
          // Verify by making a GET request - it should make HTTP call, not use cache
          service.get(testId).subscribe({
            next: () => fail('Should not find cached entry'),
            error: () => {
              done();
            }
          });
          
          // Expect and flush the GET request
          const getReq = httpMock.expectOne('/api/v1/instruments/999999');
          expect(getReq.request.method).toBe('GET');
          getReq.flush(null, { status: 404, statusText: 'Not Found' });
        }
      });

      const req = httpMock.expectOne(req => req.url === '/api/v1/instruments/' && req.method === 'POST');
      req.flush(null, { status: 400, statusText: 'Bad Request' });
    });

    it('should handle optimistic update rollback on error', (done) => {
      const original: Instrument = { ...mockInstrument, short_name: 'ORIGINAL' };
      const updateDto: InstrumentUpdate = { short_name: 'UPDATED' };

      // First cache the instrument
      service.get(1).subscribe();
      const getReq = httpMock.expectOne('/api/v1/instruments/1');
      getReq.flush(original);

      // Update with error
      service.update(1, updateDto).subscribe({
        next: () => fail('Should have errored'),
        error: () => {
          // Cache should have original value
          service.get(1).subscribe(instrument => {
            expect(instrument.short_name).toBe('ORIGINAL');
            done();
          });
        }
      });

      const req = httpMock.expectOne('/api/v1/instruments/1');
      req.flush(null, { status: 400, statusText: 'Bad Request' });
    });

    it('should handle optimistic delete rollback on error', (done) => {
      // First cache the instrument
      service.get(1).subscribe();
      const getReq = httpMock.expectOne('/api/v1/instruments/1');
      getReq.flush(mockInstrument);

      // Delete with error
      service.remove(1).subscribe({
        next: () => fail('Should have errored'),
        error: () => {
          // Cache should have restored the instrument
          service.get(1).subscribe(instrument => {
            expect(instrument).toEqual(mockInstrument);
            done();
          });
        }
      });

      const req = httpMock.expectOne('/api/v1/instruments/1');
      req.flush(null, { status: 404, statusText: 'Not Found' });
    });

    it('should handle update when instrument is not cached', () => {
      const updateDto: InstrumentUpdate = { short_name: 'UPDATED' };
      const updated = { ...mockInstrument, short_name: 'UPDATED' };

      // Update without caching first - should fetch then update
      service.update(1, updateDto).subscribe(instrument => {
        expect(instrument.short_name).toBe('UPDATED');
      });

      // Should fetch first
      const getReq = httpMock.expectOne('/api/v1/instruments/1');
      getReq.flush(mockInstrument);

      // Then update
      const updateReq = httpMock.expectOne('/api/v1/instruments/1');
      expect(updateReq.request.method).toBe('PUT');
      updateReq.flush(updated);
    });

    it('should handle multiple filter combinations', () => {
      service.list({
        instrument_type: 'Equity',
        sector: 'Technology',
        country: 'USA',
        query: 'AAPL',
        page: 0,
        size: 10
      }).subscribe();

      const req = httpMock.expectOne(req => {
        return req.params.get('instrument_type') === 'Equity' &&
               req.params.get('sector') === 'Technology' &&
               req.params.get('country') === 'USA';
      });
      req.flush({ items: [mockInstrument], total: 1 });
      
      expect(req.request.method).toBe('GET');
    });

    it('should handle HTTP 404 error for get', (done) => {
      service.get(999).subscribe({
        next: () => fail('Should have errored'),
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      const req = httpMock.expectOne('/api/v1/instruments/999');
      req.flush(null, { status: 404, statusText: 'Not Found' });
    });

    it('should handle HTTP 500 error gracefully', (done) => {
      service.list().subscribe({
        next: () => fail('Should have errored'),
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      const req = httpMock.expectOne(req => req.url.startsWith('/api/v1/instruments/'));
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle network error', (done) => {
      service.list().subscribe({
        next: () => fail('Should have errored'),
        error: (error) => {
          expect(error.message).toBeTruthy();
          done();
        }
      });

      const req = httpMock.expectOne(req => req.url.startsWith('/api/v1/instruments/'));
      req.error(new ProgressEvent('error'));
    });
  });
});

