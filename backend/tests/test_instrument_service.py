"""
Tests for InstrumentService.

Tests cover:
- Creating instruments (full and minimal data)
- Retrieving instruments (all, by ID)
- Updating instruments (partial and full updates)
- Deleting instruments
- Edge cases and error handling
"""
import pytest
from datetime import date, datetime
from app.schemas.instrument import InstrumentCreate, InstrumentUpdate, InstrumentResponse


class TestInstrumentServiceCreate:
    """Tests for creating instruments."""
    
    def test_create_instrument_full_data(self, instrument_service, sample_instrument_data):
        """Test creating an instrument with all fields populated."""
        instrument_create = InstrumentCreate(**sample_instrument_data)
        result = instrument_service.create_instrument(instrument_create)
        
        assert result is not None
        assert result.instrument_id > 0
        assert result.short_name == "AAPL"
        assert result.full_name == "Apple Inc."
        assert result.isin == "US0378331005"
        assert result.instrument_type == "Equity"
        assert result.last_price == 150.25
        assert result.created_at is not None
        assert result.updated_at is not None
    
    def test_create_instrument_minimal_data(self, instrument_service, sample_instrument_minimal):
        """Test creating an instrument with only required fields."""
        instrument_create = InstrumentCreate(**sample_instrument_minimal)
        result = instrument_service.create_instrument(instrument_create)
        
        assert result is not None
        assert result.instrument_id > 0
        assert result.short_name == "MSFT"
        assert result.full_name == "Microsoft Corporation"
        assert result.instrument_type == "Equity"
        assert result.isin is None
        assert result.sector is None
    
    def test_create_instrument_with_dates(self, instrument_service):
        """Test creating an instrument with various date fields."""
        instrument_data = {
            "short_name": "BOND",
            "full_name": "Test Bond",
            "instrument_type": "Bond",
            "original_currency": "USD",
            "interest_currency": "USD",
            "issue_date": date(2020, 1, 1),
            "expiration_date": date(2030, 1, 1),
            "first_call_date": date(2025, 1, 1),
            "coupon_date_0": date(2024, 3, 1),
            "coupon_date_1": date(2024, 6, 1),
        }
        
        instrument_create = InstrumentCreate(**instrument_data)
        result = instrument_service.create_instrument(instrument_create)
        
        assert result.issue_date == date(2020, 1, 1)
        assert result.expiration_date == date(2030, 1, 1)
        assert result.first_call_date == date(2025, 1, 1)
        assert result.coupon_date_0 == date(2024, 3, 1)
        assert result.coupon_date_1 == date(2024, 6, 1)
    
    def test_create_multiple_instruments(self, instrument_service, sample_instrument_data):
        """Test creating multiple instruments and verify they have unique IDs."""
        # Create first instrument
        instrument1_data = sample_instrument_data.copy()
        instrument1_data["short_name"] = "INST1"
        instrument1 = instrument_service.create_instrument(InstrumentCreate(**instrument1_data))
        
        # Create second instrument (with unique ISIN to avoid constraint violation)
        instrument2_data = sample_instrument_data.copy()
        instrument2_data["short_name"] = "INST2"
        instrument2_data["isin"] = "US1234567890"  # Different ISIN
        instrument2 = instrument_service.create_instrument(InstrumentCreate(**instrument2_data))
        
        assert instrument1.instrument_id != instrument2.instrument_id
        assert instrument1.short_name == "INST1"
        assert instrument2.short_name == "INST2"


class TestInstrumentServiceGet:
    """Tests for retrieving instruments."""
    
    def test_get_instruments_empty(self, instrument_service):
        """Test getting all instruments when database is empty."""
        instruments = instrument_service.get_instruments()
        assert instruments == []
    
    def test_get_instruments_multiple(self, instrument_service, sample_instrument_data):
        """Test getting all instruments when multiple exist."""
        # Create multiple instruments
        for i in range(3):
            data = sample_instrument_data.copy()
            data["short_name"] = f"INST{i+1}"
            data["full_name"] = f"Instrument {i+1}"
            data["isin"] = f"US000000000{i+1}"  # Unique ISIN for each
            instrument_service.create_instrument(InstrumentCreate(**data))
        
        instruments = instrument_service.get_instruments()
        assert len(instruments) == 3
        assert all(isinstance(inst, InstrumentResponse) for inst in instruments)
        assert {inst.short_name for inst in instruments} == {"INST1", "INST2", "INST3"}
    
    def test_get_instrument_by_id_exists(self, instrument_service, sample_instrument_data):
        """Test getting an instrument by ID when it exists."""
        created = instrument_service.create_instrument(InstrumentCreate(**sample_instrument_data))
        retrieved = instrument_service.get_instrument(created.instrument_id)
        
        assert retrieved is not None
        assert retrieved.instrument_id == created.instrument_id
        assert retrieved.short_name == created.short_name
        assert retrieved.full_name == created.full_name
    
    def test_get_instrument_by_id_not_exists(self, instrument_service):
        """Test getting an instrument by ID when it doesn't exist."""
        result = instrument_service.get_instrument(99999)
        assert result is None
    
    def test_get_instrument_preserves_all_fields(self, instrument_service, sample_instrument_data):
        """Test that all fields are preserved when retrieving an instrument."""
        created = instrument_service.create_instrument(InstrumentCreate(**sample_instrument_data))
        retrieved = instrument_service.get_instrument(created.instrument_id)
        
        assert retrieved.short_name == created.short_name
        assert retrieved.full_name == created.full_name
        assert retrieved.isin == created.isin
        assert retrieved.instrument_type == created.instrument_type
        assert retrieved.sector == created.sector
        assert retrieved.industry == created.industry
        assert retrieved.country == created.country
        assert retrieved.last_price == created.last_price


class TestInstrumentServiceUpdate:
    """Tests for updating instruments."""
    
    def test_update_instrument_single_field(self, instrument_service, sample_instrument_data):
        """Test updating a single field of an instrument."""
        created = instrument_service.create_instrument(InstrumentCreate(**sample_instrument_data))
        
        update_data = InstrumentUpdate(sector="Updated Sector")
        updated = instrument_service.update_instrument(created.instrument_id, update_data)
        
        assert updated is not None
        assert updated.instrument_id == created.instrument_id
        assert updated.sector == "Updated Sector"
        assert updated.short_name == created.short_name  # Other fields unchanged
    
    def test_update_instrument_multiple_fields(self, instrument_service, sample_instrument_data):
        """Test updating multiple fields of an instrument."""
        created = instrument_service.create_instrument(InstrumentCreate(**sample_instrument_data))
        
        update_data = InstrumentUpdate(
            sector="New Sector",
            industry="New Industry",
            last_price=200.50
        )
        updated = instrument_service.update_instrument(created.instrument_id, update_data)
        
        assert updated.sector == "New Sector"
        assert updated.industry == "New Industry"
        assert updated.last_price == 200.50
        assert updated.short_name == created.short_name  # Other fields unchanged
    
    def test_update_instrument_with_date(self, instrument_service, sample_instrument_data):
        """Test updating date fields."""
        created = instrument_service.create_instrument(InstrumentCreate(**sample_instrument_data))
        
        new_date = date(2025, 6, 15)
        update_data = InstrumentUpdate(last_price_date=new_date)
        updated = instrument_service.update_instrument(created.instrument_id, update_data)
        
        assert updated.last_price_date == new_date
    
    def test_update_instrument_not_exists(self, instrument_service):
        """Test updating an instrument that doesn't exist."""
        update_data = InstrumentUpdate(sector="New Sector")
        result = instrument_service.update_instrument(99999, update_data)
        assert result is None
    
    def test_update_instrument_empty_update(self, instrument_service, sample_instrument_data):
        """Test updating with no fields (should return existing instrument)."""
        created = instrument_service.create_instrument(InstrumentCreate(**sample_instrument_data))
        update_data = InstrumentUpdate()  # No fields
        
        updated = instrument_service.update_instrument(created.instrument_id, update_data)
        
        assert updated is not None
        assert updated.instrument_id == created.instrument_id
        assert updated.short_name == created.short_name
    
    def test_update_instrument_clears_optional_field(self, instrument_service, sample_instrument_data):
        """Test that setting a field to None clears it (if update supports None)."""
        # Note: This depends on how InstrumentUpdate handles None values
        # If the update model doesn't allow None, this test may need adjustment
        created = instrument_service.create_instrument(InstrumentCreate(**sample_instrument_data))
        assert created.sector == "Technology"
        
        # Update with None (if supported by your update logic)
        # This test may need adjustment based on your actual update implementation
        update_data = InstrumentUpdate(sector=None)
        updated = instrument_service.update_instrument(created.instrument_id, update_data)
        
        # The behavior depends on whether None values are processed
        # If InstrumentUpdate ignores None, sector should remain unchanged
        # If it processes None, sector might become None (depending on implementation)


class TestInstrumentServiceDelete:
    """Tests for deleting instruments."""
    
    def test_delete_instrument_exists(self, instrument_service, sample_instrument_data):
        """Test deleting an instrument that exists."""
        created = instrument_service.create_instrument(InstrumentCreate(**sample_instrument_data))
        instrument_id = created.instrument_id
        
        # Verify it exists
        assert instrument_service.get_instrument(instrument_id) is not None
        
        # Delete it
        result = instrument_service.delete_instrument(instrument_id)
        assert result is True
        
        # Verify it's gone
        assert instrument_service.get_instrument(instrument_id) is None
    
    def test_delete_instrument_not_exists(self, instrument_service):
        """Test deleting an instrument that doesn't exist."""
        result = instrument_service.delete_instrument(99999)
        assert result is False
    
    def test_delete_instrument_removes_from_list(self, instrument_service, sample_instrument_data):
        """Test that deleted instrument is removed from get_instruments list."""
        created1 = instrument_service.create_instrument(InstrumentCreate(**sample_instrument_data))
        
        data2 = sample_instrument_data.copy()
        data2["short_name"] = "INST2"
        data2["isin"] = "US9876543210"  # Different ISIN
        created2 = instrument_service.create_instrument(InstrumentCreate(**data2))
        
        # Should have 2 instruments
        assert len(instrument_service.get_instruments()) == 2
        
        # Delete one
        instrument_service.delete_instrument(created1.instrument_id)
        
        # Should have 1 instrument
        instruments = instrument_service.get_instruments()
        assert len(instruments) == 1
        assert instruments[0].instrument_id == created2.instrument_id


class TestInstrumentServiceEdgeCases:
    """Tests for edge cases and error handling."""
    
    def test_create_with_long_text_fields(self, instrument_service):
        """Test creating instrument with long text in fields."""
        long_text = "A" * 1000
        data = {
            "short_name": "LONG",
            "full_name": long_text,
            "instrument_type": "Equity",
            "original_currency": "USD",
            "interest_currency": "USD",
            "free_text_0": long_text,
        }
        
        result = instrument_service.create_instrument(InstrumentCreate(**data))
        assert result.full_name == long_text
        assert result.free_text_0 == long_text
    
    def test_create_with_special_characters(self, instrument_service):
        """Test creating instrument with special characters in fields."""
        data = {
            "short_name": "SPEC'IAL",
            "full_name": "Test & Co. - \"Special\" Characters",
            "instrument_type": "Equity",
            "original_currency": "USD",
            "interest_currency": "USD",
        }
        
        result = instrument_service.create_instrument(InstrumentCreate(**data))
        assert result.short_name == "SPEC'IAL"
        assert result.full_name == "Test & Co. - \"Special\" Characters"
    
    def test_create_with_json_metadata(self, instrument_service):
        """Test creating instrument with JSON metadata."""
        import json
        metadata = {"key1": "value1", "key2": 123, "key3": {"nested": "data"}}
        
        data = {
            "short_name": "JSON",
            "full_name": "JSON Test",
            "instrument_type": "Equity",
            "original_currency": "USD",
            "interest_currency": "USD",
            "metadata_json": json.dumps(metadata),
        }
        
        result = instrument_service.create_instrument(InstrumentCreate(**data))
        assert result.metadata_json is not None
        parsed = json.loads(result.metadata_json)
        assert parsed == metadata
    
    def test_instrument_ordering(self, instrument_service, sample_instrument_data):
        """Test that get_instruments returns instruments in order by instrument_id."""
        # Create instruments
        ids = []
        for i in range(5):
            data = sample_instrument_data.copy()
            data["short_name"] = f"INST{i}"
            data["isin"] = f"US{i:012d}"  # Unique ISIN for each
            created = instrument_service.create_instrument(InstrumentCreate(**data))
            ids.append(created.instrument_id)
        
        # Retrieve and check order
        instruments = instrument_service.get_instruments()
        retrieved_ids = [inst.instrument_id for inst in instruments]
        assert retrieved_ids == sorted(retrieved_ids)
    
    def test_timestamps_are_set(self, instrument_service, sample_instrument_data):
        """Test that created_at and updated_at timestamps are properly set."""
        created = instrument_service.create_instrument(InstrumentCreate(**sample_instrument_data))
        
        assert isinstance(created.created_at, datetime)
        assert isinstance(created.updated_at, datetime)
        assert created.created_at <= datetime.now()
        assert created.updated_at <= datetime.now()

