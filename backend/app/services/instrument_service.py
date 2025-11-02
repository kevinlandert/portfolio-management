"""
Instrument Service
Business logic for managing financial instruments.
Handles database operations and data transformation.
"""

import sys
import os
from pathlib import Path
from datetime import datetime, date
from typing import Optional, List
from app.schemas.instrument import InstrumentCreate, InstrumentUpdate, InstrumentResponse

# Add backend directory to path for database imports
backend_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_dir))

from database.scripts.db_connection import get_db


class InstrumentService:
    """Service for managing instruments"""
    
    def __init__(self):
        self.db = get_db()
    
    def get_instruments(self) -> List[InstrumentResponse]:
        """
        Retrieve all instruments from the database.
        
        Returns:
            List of InstrumentResponse objects
        """
        query = """
            SELECT 
                instrument_id, short_name, full_name, isin,
                instrument_type, sector, industry, country,
                original_currency, interest_currency, statistical_currency,
                interest_rate, interest_period,
                last_price, last_price_date,
                issue_date, expiration_date, first_call_date, first_call_percentage,
                coupon_date_0, coupon_date_1, coupon_date_2, coupon_date_3,
                preferred_exchange, restriced_exchange, contract_size, initial_margin,
                telekurs_symbol, reuters_symbol, yahoo_symbol,
                sector_allocation,
                free_text_0, free_text_1, free_text_2, free_text_3,
                metadata_json,
                created_at, updated_at
            FROM instrument
            ORDER BY instrument_id
        """
        
        rows = self.db.execute_query(query)
        return [self._row_to_instrument(row) for row in rows]
    
    def get_instrument(self, instrument_id: int) -> Optional[InstrumentResponse]:
        """
        Retrieve a single instrument by ID.
        
        Args:
            instrument_id: Unique instrument identifier
            
        Returns:
            InstrumentResponse object or None if not found
        """
        query = """
            SELECT 
                instrument_id, short_name, full_name, isin,
                instrument_type, sector, industry, country,
                original_currency, interest_currency, statistical_currency,
                interest_rate, interest_period,
                last_price, last_price_date,
                issue_date, expiration_date, first_call_date, first_call_percentage,
                coupon_date_0, coupon_date_1, coupon_date_2, coupon_date_3,
                preferred_exchange, restriced_exchange, contract_size, initial_margin,
                telekurs_symbol, reuters_symbol, yahoo_symbol,
                sector_allocation,
                free_text_0, free_text_1, free_text_2, free_text_3,
                metadata_json,
                created_at, updated_at
            FROM instrument
            WHERE instrument_id = ?
        """
        
        rows = self.db.execute_query(query, (instrument_id,))
        if not rows:
            return None
        
        return self._row_to_instrument(rows[0])
    
    def create_instrument(self, instrument: InstrumentCreate) -> InstrumentResponse:
        """
        Create a new instrument in the database.
        
        Args:
            instrument: InstrumentCreate object with instrument data
            
        Returns:
            InstrumentResponse object with created instrument (including ID and timestamps)
        """
        query = """
            INSERT INTO instrument (
                short_name, full_name, isin,
                instrument_type, sector, industry, country,
                original_currency, interest_currency, statistical_currency,
                interest_rate, interest_period,
                last_price, last_price_date,
                issue_date, expiration_date, first_call_date, first_call_percentage,
                coupon_date_0, coupon_date_1, coupon_date_2, coupon_date_3,
                preferred_exchange, restriced_exchange, contract_size, initial_margin,
                telekurs_symbol, reuters_symbol, yahoo_symbol,
                sector_allocation,
                free_text_0, free_text_1, free_text_2, free_text_3,
                metadata_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 
                     ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        
        params = (
            instrument.short_name,
            instrument.full_name,
            instrument.isin,
            instrument.instrument_type,
            instrument.sector,
            instrument.industry,
            instrument.country,
            instrument.original_currency,
            instrument.interest_currency,
            instrument.statistical_currency,
            instrument.interest_rate,
            instrument.interest_period,
            instrument.last_price,
            instrument.last_price_date.isoformat() if instrument.last_price_date else None,
            instrument.issue_date.isoformat() if instrument.issue_date else None,
            instrument.expiration_date.isoformat() if instrument.expiration_date else None,
            instrument.first_call_date.isoformat() if instrument.first_call_date else None,
            instrument.first_call_percentage,
            instrument.coupon_date_0.isoformat() if instrument.coupon_date_0 else None,
            instrument.coupon_date_1.isoformat() if instrument.coupon_date_1 else None,
            instrument.coupon_date_2.isoformat() if instrument.coupon_date_2 else None,
            instrument.coupon_date_3.isoformat() if instrument.coupon_date_3 else None,
            instrument.preferred_exchange,
            instrument.restriced_exchange,
            instrument.contract_size,
            instrument.initial_margin,
            instrument.telekurs_symbol,
            instrument.reuters_symbol,
            instrument.yahoo_symbol,
            instrument.sector_allocation,
            instrument.free_text_0,
            instrument.free_text_1,
            instrument.free_text_2,
            instrument.free_text_3,
            instrument.metadata_json,
        )
        
        instrument_id = self.db.execute_update(query, params)
        
        # Retrieve the created instrument to return with timestamps
        return self.get_instrument(instrument_id)
    
    def update_instrument(self, instrument_id: int, instrument: InstrumentUpdate) -> Optional[InstrumentResponse]:
        """
        Update an existing instrument.
        
        Args:
            instrument_id: ID of instrument to update
            instrument: InstrumentUpdate object with fields to update
            
        Returns:
            Updated InstrumentResponse object or None if not found
        """
        # Build dynamic UPDATE query based on provided fields
        updates = []
        params = []
        
        # Map all updatable fields
        field_mapping = {
            'short_name': instrument.short_name,
            'full_name': instrument.full_name,
            'isin': instrument.isin,
            'instrument_type': instrument.instrument_type,
            'sector': instrument.sector,
            'industry': instrument.industry,
            'country': instrument.country,
            'original_currency': instrument.original_currency,
            'interest_currency': instrument.interest_currency,
            'statistical_currency': instrument.statistical_currency,
            'interest_rate': instrument.interest_rate,
            'interest_period': instrument.interest_period,
            'last_price': instrument.last_price,
            'last_price_date': instrument.last_price_date.isoformat() if instrument.last_price_date else None,
            'issue_date': instrument.issue_date.isoformat() if instrument.issue_date else None,
            'expiration_date': instrument.expiration_date.isoformat() if instrument.expiration_date else None,
            'first_call_date': instrument.first_call_date.isoformat() if instrument.first_call_date else None,
            'first_call_percentage': instrument.first_call_percentage,
            'coupon_date_0': instrument.coupon_date_0.isoformat() if instrument.coupon_date_0 else None,
            'coupon_date_1': instrument.coupon_date_1.isoformat() if instrument.coupon_date_1 else None,
            'coupon_date_2': instrument.coupon_date_2.isoformat() if instrument.coupon_date_2 else None,
            'coupon_date_3': instrument.coupon_date_3.isoformat() if instrument.coupon_date_3 else None,
            'preferred_exchange': instrument.preferred_exchange,
            'restriced_exchange': instrument.restriced_exchange,
            'contract_size': instrument.contract_size,
            'initial_margin': instrument.initial_margin,
            'telekurs_symbol': instrument.telekurs_symbol,
            'reuters_symbol': instrument.reuters_symbol,
            'yahoo_symbol': instrument.yahoo_symbol,
            'sector_allocation': instrument.sector_allocation,
            'free_text_0': instrument.free_text_0,
            'free_text_1': instrument.free_text_1,
            'free_text_2': instrument.free_text_2,
            'free_text_3': instrument.free_text_3,
            'metadata_json': instrument.metadata_json,
        }
        
        # Only include fields that are not None
        for field, value in field_mapping.items():
            if value is not None:
                updates.append(f"{field} = ?")
                params.append(value)
        
        if not updates:
            # No fields to update, return existing instrument
            return self.get_instrument(instrument_id)
        
        # Add updated_at timestamp
        updates.append("updated_at = CURRENT_TIMESTAMP")
        params.append(instrument_id)
        
        query = f"""
            UPDATE instrument
            SET {', '.join(updates)}
            WHERE instrument_id = ?
        """
        
        self.db.execute_update(query, tuple(params))
        
        return self.get_instrument(instrument_id)
    
    def delete_instrument(self, instrument_id: int) -> bool:
        """
        Delete an instrument from the database.
        
        Args:
            instrument_id: ID of instrument to delete
            
        Returns:
            True if deleted, False if not found
        """
        # Check if instrument exists
        if not self.get_instrument(instrument_id):
            return False
        
        query = "DELETE FROM instrument WHERE instrument_id = ?"
        self.db.execute_update(query, (instrument_id,))
        return True
    
    def _row_to_instrument(self, row) -> InstrumentResponse:
        """
        Convert a database row to InstrumentResponse object.
        
        Args:
            row: Tuple from database query result
            
        Returns:
            InstrumentResponse object
        """
        # Parse datetime strings from SQLite
        def parse_datetime(dt_str):
            if not dt_str:
                return None
            try:
                return datetime.fromisoformat(dt_str.replace('Z', '+00:00'))
            except:
                return datetime.strptime(dt_str, '%Y-%m-%d %H:%M:%S')
        
        def parse_date(d_str):
            if not d_str:
                return None
            if isinstance(d_str, str):
                return date.fromisoformat(d_str)
            return d_str
        
        return InstrumentResponse(
            instrument_id=row[0],
            short_name=row[1],
            full_name=row[2],
            isin=row[3],
            instrument_type=row[4],
            sector=row[5],
            industry=row[6],
            country=row[7],
            original_currency=row[8],
            interest_currency=row[9],
            statistical_currency=row[10],
            interest_rate=row[11],
            interest_period=row[12],
            last_price=row[13],
            last_price_date=parse_date(row[14]),
            issue_date=parse_date(row[15]),
            expiration_date=parse_date(row[16]),
            first_call_date=parse_date(row[17]),
            first_call_percentage=row[18],
            coupon_date_0=parse_date(row[19]),
            coupon_date_1=parse_date(row[20]),
            coupon_date_2=parse_date(row[21]),
            coupon_date_3=parse_date(row[22]),
            preferred_exchange=row[23],
            restriced_exchange=row[24],
            contract_size=row[25],
            initial_margin=row[26],
            telekurs_symbol=row[27],
            reuters_symbol=row[28],
            yahoo_symbol=row[29],
            sector_allocation=row[30],
            free_text_0=row[31],
            free_text_1=row[32],
            free_text_2=row[33],
            free_text_3=row[34],
            metadata_json=row[35],
            created_at=parse_datetime(row[36]),
            updated_at=parse_datetime(row[37]),
        )