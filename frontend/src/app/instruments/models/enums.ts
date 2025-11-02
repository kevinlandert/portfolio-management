/**
 * Enums for instruments feature
 * These match the backend enums in app/models/enums.py
 */

/**
 * Valid instrument types
 */
export enum InstrumentType {
  EQUITY = 'Equity',
  BOND = 'Bond',
  ETF = 'ETF',
  FUTURE = 'Future'
}

/**
 * Get all instrument type values as array
 */
export function getInstrumentTypes(): string[] {
  return Object.values(InstrumentType);
}

/**
 * Valid currency codes (ISO 4217)
 */
export enum Currency {
  CHF = 'CHF',
  EUR = 'EUR',
  USD = 'USD'
}

/**
 * Get all currency values as array
 */
export function getCurrencies(): string[] {
  return Object.values(Currency);
}

