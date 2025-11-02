/*
 * Instrument Schema
 * 
 * Purpose: Stores comprehensive information about financial instruments
 *          including stocks, bonds, derivatives, and other securities.
 * 
 * Key Identifiers:
 * - instrument_id: Primary key
 * - isin: International Securities Identification Number (ISO 6166)
 * - Various exchange symbols (Yahoo, Reuters, Telekurs)
 */

-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- database/schema/01_instrument.sql
CREATE TABLE IF NOT EXISTS instrument (
    -- Primary identification
    instrument_id INTEGER PRIMARY KEY AUTOINCREMENT,

    -- Basic identification
    isin TEXT,                              -- International Securities Identification Number (ISO 6166)
    short_name TEXT NOT NULL,               -- Short trading name (e.g., "GDX")
    full_name TEXT NOT NULL,                -- Full legal name (e.v., "VanEck Vectors Gold Miners ETF")

    -- Instrument classification
    instrument_type TEXT NOT NULL,          -- Type: "stock", "bond", "etf", "option", "future", etc.
    sector TEXT,                            -- Industry sector (e.g., "Technology", "Healthcare")
    industry TEXT,                          -- Industry classification (e.g., "Software", "Biotech")
    country TEXT,                           -- Country of origin/listing

    -- Currency information
    original_currency TEXT NOT NULL,       -- Currency of the instrument's home market
    interest_currency TEXT NOT NULL,       -- Currency for interest/dividend payments 
    statistical_currency TEXT,             -- Currency for reporting/statistics
    
    -- Interest/Rate information (for bonds, fixed income)
    interest_rate REAL,                     -- Interest rate (e.g., 2.5 for 2.5%)
    interest_period INTEGER,                -- Interest payment period in days (e.g., 365 for annual)
    
    -- Pricing information
    last_price REAL,                        -- Last known market price
    last_price_date DATE,                   -- Date of last price update
    
    -- Dates and timing
    issue_date DATE,                        -- Original issue date of the instrument
    expiration_date DATE,                   -- Expiration/maturity date (for derivatives, bonds)
    first_call_date DATE,                   -- First callable date (for callable bonds)
    first_call_percentage REAL,             -- Strike/exercise percentage or price
    
    -- Coupon dates (for bonds, typically 4 per year)
    coupon_date_0 DATE,                     -- First coupon payment date
    coupon_date_1 DATE,                     -- Second coupon payment date
    coupon_date_2 DATE,                     -- Third coupon payment date
    coupon_date_3 DATE,                     -- Fourth coupon payment date
    
    -- Exchange and trading information
    preferred_exchange TEXT,                -- Preferred exchange for trading
    restriced_exchange TEXT,                -- Restricted/excluded exchanges
    contract_size INTEGER,                  -- Contract size (e.g., for futures)
    initial_margin REAL,                    -- Initial margin requirement for derivatives/futures
    
    -- Exchange symbols and identifiers
    telekurs_symbol TEXT,                   -- Telekurs/SIX symbol
    reuters_symbol TEXT,                    -- Reuters RIC (Reuters Instrument Code)
    yahoo_symbol TEXT,                      -- Yahoo Finance ticker symbol
    
    -- Sector allocation (JSON or comma-separated)
    sector_allocation TEXT,                 -- Sector allocation breakdown (JSON format)
    
    -- Metadata and timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Record creation timestamp
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Last update timestamp

    -- Metadata JSON for additional flexible fields
    metadata_json TEXT,                     -- JSON field for additional instrument-specific data

    -- Free text fields
    free_text_0 TEXT,
    free_text_1 TEXT,
    free_text_2 TEXT,
    free_text_3 TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_instrument_isin ON instrument(isin);
CREATE INDEX IF NOT EXISTS idx_instrument_type ON instrument(instrument_type);
CREATE INDEX IF NOT EXISTS idx_instrument_yahoo_symbol ON instrument(yahoo_symbol);
CREATE INDEX IF NOT EXISTS idx_instrument_country ON instrument(country);
CREATE INDEX IF NOT EXISTS idx_instrument_sector ON instrument(sector);

-- Unique constraint: ISIN should be unique if provided
CREATE UNIQUE INDEX IF NOT EXISTS uq_instrument_isin ON instrument(isin) WHERE isin IS NOT NULL;