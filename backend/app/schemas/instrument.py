"""
Instrument Pydantic Schemas

These schemas define the data models for financial instruments,
matching the database schema in database/schema/01_instrument.sql.
"""

from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime, date
from typing import Optional, Dict, Any
from decimal import Decimal


class InstrumentBase(BaseModel):
    """Base instrument model with all shared fields"""
    
    # Basic identification
    short_name: str = Field(..., description="Short trading name (e.g., 'AAPL')")
    full_name: str = Field(..., description="Full legal name (e.g., 'Apple Inc.')")
    isin: Optional[str] = Field(None, description="International Securities Identification Number (ISO 6166)")
    
    # Instrument classification
    instrument_type: str = Field(..., description="Type: equity, bond, etf, option, future, etc.")
    sector: Optional[str] = Field(None, description="Industry sector (e.g., 'Technology', 'Healthcare')")
    industry: Optional[str] = Field(None, description="Industry classification (e.g., 'Software', 'Biotech')")
    country: Optional[str] = Field(None, description="Country of origin/listing")
    
    # Currency information
    original_currency: str = Field(..., description="Currency of the instrument's home market")
    interest_currency: str = Field(..., description="Currency for interest/dividend payments")
    statistical_currency: Optional[str] = Field(None, description="Currency for reporting/statistics")
    
    # Interest/Rate information (for bonds, fixed income)
    interest_rate: Optional[float] = Field(None, description="Interest rate (e.g., 2.5 for 2.5%)")
    interest_period: Optional[int] = Field(None, description="Interest payment period in days (e.g., 365 for annual)")
    
    # Pricing information
    last_price: Optional[float] = Field(None, description="Last known market price")
    last_price_date: Optional[date] = Field(None, description="Date of last price update")
    
    # Dates and timing
    issue_date: Optional[date] = Field(None, description="Original issue date of the instrument")
    expiration_date: Optional[date] = Field(None, description="Expiration/maturity date (for derivatives, bonds)")
    first_call_date: Optional[date] = Field(None, description="First callable date (for callable bonds)")
    first_call_percentage: Optional[float] = Field(None, description="Strike/exercise percentage or price")
    
    # Coupon dates (for bonds, typically 4 per year)
    coupon_date_0: Optional[date] = Field(None, description="First coupon payment date")
    coupon_date_1: Optional[date] = Field(None, description="Second coupon payment date")
    coupon_date_2: Optional[date] = Field(None, description="Third coupon payment date")
    coupon_date_3: Optional[date] = Field(None, description="Fourth coupon payment date")
    
    # Exchange and trading information
    preferred_exchange: Optional[str] = Field(None, description="Preferred exchange for trading")
    restriced_exchange: Optional[str] = Field(None, description="Restricted/excluded exchanges")
    contract_size: Optional[int] = Field(None, description="Contract size (e.g., 100 shares per contract)")
    initial_margin: Optional[float] = Field(None, description="Initial margin requirement for derivatives")
    
    # Exchange symbols and identifiers
    telekurs_symbol: Optional[str] = Field(None, description="Telekurs/SIX symbol")
    reuters_symbol: Optional[str] = Field(None, description="Reuters RIC (Reuters Instrument Code)")
    yahoo_symbol: Optional[str] = Field(None, description="Yahoo Finance ticker symbol")
    
    # Sector allocation
    sector_allocation: Optional[str] = Field(None, description="Sector allocation breakdown (JSON format)")
    
    # Free text fields
    free_text_0: Optional[str] = Field(None, description="Free text field 0")
    free_text_1: Optional[str] = Field(None, description="Free text field 1")
    free_text_2: Optional[str] = Field(None, description="Free text field 2")
    free_text_3: Optional[str] = Field(None, description="Free text field 3")
    
    # Metadata JSON
    metadata_json: Optional[str] = Field(None, description="JSON field for additional instrument-specific data")


class InstrumentCreate(InstrumentBase):
    """
    Model for creating a new instrument.
    Excludes auto-generated fields (instrument_id, timestamps).
    """
    pass  # All fields from base are used for creation


class InstrumentUpdate(BaseModel):
    """
    Model for updating an instrument.
    All fields are optional - only provided fields will be updated.
    """
    short_name: Optional[str] = None
    full_name: Optional[str] = None
    isin: Optional[str] = None
    instrument_type: Optional[str] = None
    sector: Optional[str] = None
    industry: Optional[str] = None
    country: Optional[str] = None
    original_currency: Optional[str] = None
    interest_currency: Optional[str] = None
    statistical_currency: Optional[str] = None
    interest_rate: Optional[float] = None
    interest_period: Optional[int] = None
    last_price: Optional[float] = None
    last_price_date: Optional[date] = None
    issue_date: Optional[date] = None
    expiration_date: Optional[date] = None
    first_call_date: Optional[date] = None
    first_call_percentage: Optional[float] = None
    coupon_date_0: Optional[date] = None
    coupon_date_1: Optional[date] = None
    coupon_date_2: Optional[date] = None
    coupon_date_3: Optional[date] = None
    preferred_exchange: Optional[str] = None
    restriced_exchange: Optional[str] = None
    contract_size: Optional[int] = None
    initial_margin: Optional[float] = None
    telekurs_symbol: Optional[str] = None
    reuters_symbol: Optional[str] = None
    yahoo_symbol: Optional[str] = None
    sector_allocation: Optional[str] = None
    free_text_0: Optional[str] = None
    free_text_1: Optional[str] = None
    free_text_2: Optional[str] = None
    free_text_3: Optional[str] = None
    metadata_json: Optional[str] = None


class InstrumentResponse(InstrumentBase):
    """
    Model for API responses when retrieving instruments.
    Includes auto-generated fields (instrument_id, timestamps).
    """
    instrument_id: int = Field(..., description="Unique instrument identifier")
    created_at: datetime = Field(..., description="Record creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    
    model_config = ConfigDict(
        from_attributes=True  # Allows conversion from SQLAlchemy ORM objects or dicts
    )
