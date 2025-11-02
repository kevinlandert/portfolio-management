/**
 * Instrument model matching the backend API
 */
export interface Instrument {
  instrument_id: number;
  short_name: string;
  full_name: string;
  isin?: string | null;
  instrument_type: string;
  sector?: string | null;
  industry?: string | null;
  country?: string | null;
  original_currency: string;
  interest_currency: string;
  statistical_currency?: string | null;
  interest_rate?: number | null;
  interest_period?: number | null;
  last_price?: number | null;
  last_price_date?: string | null; // ISO date string
  issue_date?: string | null;
  expiration_date?: string | null;
  first_call_date?: string | null;
  first_call_percentage?: number | null;
  coupon_date_0?: string | null;
  coupon_date_1?: string | null;
  coupon_date_2?: string | null;
  coupon_date_3?: string | null;
  preferred_exchange?: string | null;
  restriced_exchange?: string | null;
  contract_size?: number | null;
  initial_margin?: number | null;
  telekurs_symbol?: string | null;
  reuters_symbol?: string | null;
  yahoo_symbol?: string | null;
  sector_allocation?: string | null;
  free_text_0?: string | null;
  free_text_1?: string | null;
  free_text_2?: string | null;
  free_text_3?: string | null;
  metadata_json?: string | null;
  created_at: string; // ISO datetime string
  updated_at: string; // ISO datetime string
}

/**
 * DTO for creating a new instrument (excludes auto-generated fields)
 */
export type InstrumentCreate = Omit<Instrument, 'instrument_id' | 'created_at' | 'updated_at'>;

/**
 * DTO for updating an instrument (all fields optional)
 */
export type InstrumentUpdate = Partial<InstrumentCreate>;

/**
 * Response for list endpoint with pagination
 */
export interface InstrumentListResponse {
  items: Instrument[];
  total: number;
}

/**
 * Query parameters for list endpoint
 */
export interface InstrumentListParams {
  query?: string;
  page?: number;
  size?: number;
  sort?: string; // format: "field,dir" e.g. "short_name,asc"
  instrument_type?: string;
  country?: string;
  sector?: string;
}

