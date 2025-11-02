import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { catchError, map, tap, switchMap } from 'rxjs/operators';
import { Instrument, InstrumentCreate, InstrumentUpdate, InstrumentListResponse, InstrumentListParams } from '../models/instrument.model';

/**
 * Service for managing instruments with optimistic updates
 */
@Injectable({
  providedIn: 'root'
})
export class InstrumentsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/instruments';
  
  // State management for optimistic updates
  private readonly instrumentsCache = new Map<number, Instrument>();
  private readonly listCache$ = new BehaviorSubject<InstrumentListResponse | null>(null);
  private readonly lastParams$ = new BehaviorSubject<InstrumentListParams | null>(null);

  /**
   * Get list of instruments with pagination and filtering
   */
  list(params: InstrumentListParams = {}): Observable<InstrumentListResponse> {
    // Build query parameters
    let httpParams = new HttpParams();
    
    // Note: Backend uses limit/offset, but we accept page/size and convert
    if (params.query) {
      // Client-side search will be handled after fetching
      // For now, we'll fetch all and filter client-side
    }
    if (params.size !== undefined) {
      httpParams = httpParams.set('limit', params.size.toString());
    } else {
      httpParams = httpParams.set('limit', '100'); // Default
    }
    if (params.page !== undefined && params.size !== undefined) {
      const offset = params.page * params.size;
      httpParams = httpParams.set('offset', offset.toString());
    }
    if (params.instrument_type) {
      httpParams = httpParams.set('instrument_type', params.instrument_type);
    }
    if (params.sector) {
      httpParams = httpParams.set('sector', params.sector);
    }
    if (params.country) {
      httpParams = httpParams.set('country', params.country);
    }

    return this.http.get<Instrument[]>(`${this.baseUrl}/`, { params: httpParams }).pipe(
      map((instruments: Instrument[]) => {
        // Ensure instruments is an array
        const instrumentsArray = Array.isArray(instruments) ? instruments : [];
        
        // Apply client-side search if needed
        let filtered = instrumentsArray;
        if (params.query) {
          const q = params.query.toLowerCase();
          filtered = instrumentsArray.filter(i =>
            i.short_name.toLowerCase().includes(q) ||
            i.full_name.toLowerCase().includes(q) ||
            i.isin?.toLowerCase().includes(q) ||
            i.yahoo_symbol?.toLowerCase().includes(q)
          );
        }

        // Always sort by full_name ascending (default sort)
        filtered.sort((a, b) => {
          const aVal = a.full_name || '';
          const bVal = b.full_name || '';
          if (aVal < bVal) return -1;
          if (aVal > bVal) return 1;
          return 0;
        });

        // Apply client-side pagination
        const total = filtered.length;
        const page = params.page || 0;
        const size = params.size || 10;
        const start = page * size;
        const items = filtered.slice(start, start + size);

        return { items, total };
      }),
      tap(response => {
        // Update cache
        this.listCache$.next(response);
        this.lastParams$.next(params);
        // Update individual item cache
        if (response.items && Array.isArray(response.items)) {
          response.items.forEach(item => this.instrumentsCache.set(item.instrument_id, item));
        }
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Get a single instrument by ID
   */
  get(id: number): Observable<Instrument> {
    // Check cache first
    const cached = this.instrumentsCache.get(id);
    if (cached) {
      return of(cached);
    }

    return this.http.get<Instrument>(`${this.baseUrl}/${id}`).pipe(
      tap(instrument => {
        // Update cache
        this.instrumentsCache.set(instrument.instrument_id, instrument);
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Create a new instrument with optimistic update
   */
  create(dto: InstrumentCreate): Observable<Instrument> {
    // Create optimistic instrument (will be replaced with server response)
    const optimisticId = Date.now(); // Temporary ID
    const optimistic: Instrument = {
      ...dto,
      instrument_id: optimisticId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Optimistically update cache
    this.instrumentsCache.set(optimisticId, optimistic);
    this.updateListCacheOptimistically(optimistic, 'create');

    return this.http.post<Instrument>(`${this.baseUrl}/`, dto).pipe(
      tap(created => {
        // Remove optimistic entry and add real one
        this.instrumentsCache.delete(optimisticId);
        this.instrumentsCache.set(created.instrument_id, created);
        this.updateListCacheWithReal(optimisticId, created);
      }),
      catchError(error => {
        // Rollback optimistic update
        this.instrumentsCache.delete(optimisticId);
        this.rollbackListCache();
        return this.handleError(error);
      })
    );
  }

  /**
   * Update an instrument with optimistic update
   */
  update(id: number, dto: InstrumentUpdate): Observable<Instrument> {
    // Get current value for rollback
    const current = this.instrumentsCache.get(id);
    if (!current) {
      // If not in cache, fetch it first then update
      return this.get(id).pipe(
        switchMap(fetched => {
          this.instrumentsCache.set(id, fetched);
          return this.updateInternal(id, dto, fetched);
        })
      );
    }

    return this.updateInternal(id, dto, current);
  }

  /**
   * Internal update method (used after ensuring item is cached)
   */
  private updateInternal(id: number, dto: InstrumentUpdate, current: Instrument): Observable<Instrument> {

    // Create optimistic update
    const optimistic: Instrument = {
      ...current,
      ...dto,
      updated_at: new Date().toISOString()
    };

    // Optimistically update cache
    this.instrumentsCache.set(id, optimistic);
    this.updateListCacheOptimistically(optimistic, 'update');

    return this.http.put<Instrument>(`${this.baseUrl}/${id}`, dto).pipe(
      tap(updated => {
        // Update with real response
        this.instrumentsCache.set(id, updated);
        this.updateListCacheWithReal(id, updated);
      }),
      catchError(error => {
        // Rollback optimistic update
        this.instrumentsCache.set(id, current);
        this.rollbackListCache();
        return this.handleError(error);
      })
    );
  }

  /**
   * Delete an instrument with optimistic update
   */
  remove(id: number): Observable<void> {
    // Get current value for rollback
    const current = this.instrumentsCache.get(id);
    
    // Optimistically remove from cache
    this.instrumentsCache.delete(id);
    this.updateListCacheOptimistically({ instrument_id: id } as Instrument, 'delete');

    return this.http.delete<void>(`${this.baseUrl}/${id}`).pipe(
      tap(() => {
        // Already removed, just ensure list cache is updated
        this.refreshListCacheIfNeeded();
      }),
      catchError(error => {
        // Rollback: restore deleted item
        if (current) {
          this.instrumentsCache.set(id, current);
          this.rollbackListCache();
        }
        return this.handleError(error);
      })
    );
  }

  /**
   * Update list cache optimistically
   */
  private updateListCacheOptimistically(instrument: Instrument, operation: 'create' | 'update' | 'delete'): void {
    const current = this.listCache$.value;
    if (!current) return;

    const newItems = [...current.items];
    
    if (operation === 'create') {
      newItems.push(instrument);
      this.listCache$.next({ items: newItems, total: current.total + 1 });
    } else if (operation === 'update') {
      const index = newItems.findIndex(i => i.instrument_id === instrument.instrument_id);
      if (index !== -1) {
        newItems[index] = instrument;
        this.listCache$.next({ items: newItems, total: current.total });
      }
    } else if (operation === 'delete') {
      const index = newItems.findIndex(i => i.instrument_id === instrument.instrument_id);
      if (index !== -1) {
        newItems.splice(index, 1);
        this.listCache$.next({ items: newItems, total: Math.max(0, current.total - 1) });
      }
    }
  }

  /**
   * Update list cache with real server response
   */
  private updateListCacheWithReal(oldId: number, real: Instrument): void {
    const current = this.listCache$.value;
    if (!current) return;

    const newItems = [...current.items];
    const index = newItems.findIndex(i => i.instrument_id === oldId || i.instrument_id === real.instrument_id);
    if (index !== -1) {
      newItems[index] = real;
      this.listCache$.next({ items: newItems, total: current.total });
    }
  }

  /**
   * Rollback list cache (re-fetch if needed)
   */
  private rollbackListCache(): void {
    const lastParams = this.lastParams$.value;
    if (lastParams) {
      // Re-fetch to restore correct state
      this.list(lastParams).subscribe();
    }
  }

  /**
   * Refresh list cache if needed
   */
  private refreshListCacheIfNeeded(): void {
    const lastParams = this.lastParams$.value;
    if (lastParams) {
      this.list(lastParams).subscribe();
    }
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      if (error.error?.detail) {
        errorMessage = error.error.detail;
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }
}

