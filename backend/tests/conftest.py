"""
Pytest configuration and fixtures for testing.
"""
import pytest
import sqlite3
import tempfile
from pathlib import Path
import sys
from unittest.mock import patch

# Add backend to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from database.scripts.db_connection import DatabaseConnection


@pytest.fixture
def temp_db_path():
    """Create a temporary database file path."""
    with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as tmp:
        db_path = Path(tmp.name)
    yield db_path
    # Cleanup
    if db_path.exists():
        db_path.unlink()


@pytest.fixture
def test_db(temp_db_path):
    """
    Create a test database with schema initialized.
    Returns a DatabaseConnection instance.
    """
    # Create database connection to temp file
    db = DatabaseConnection()
    db.conn.close()
    
    # Override connection to use temp path
    db.conn = sqlite3.connect(str(temp_db_path))
    
    # Initialize schema
    schema_dir = backend_dir / "database" / "schema"
    
    for schema_file in sorted(schema_dir.glob("*.sql")):
        with open(schema_file, 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        # Execute schema file
        db.conn.executescript(sql_content)
        db.conn.commit()
    
    yield db
    
    # Cleanup
    db.conn.close()


@pytest.fixture
def instrument_service(test_db):
    """Create an InstrumentService instance with test database."""
    from app.services.instrument_service import InstrumentService
    
    # Patch get_db to return our test_db
    with patch('app.services.instrument_service.get_db', return_value=test_db):
        service = InstrumentService()
        yield service


@pytest.fixture
def sample_instrument_data():
    """Sample instrument data for testing."""
    from datetime import date
    
    return {
        "short_name": "AAPL",
        "full_name": "Apple Inc.",
        "isin": "US0378331005",
        "instrument_type": "stock",
        "sector": "Technology",
        "industry": "Consumer Electronics",
        "country": "USA",
        "original_currency": "USD",
        "interest_currency": "USD",
        "statistical_currency": "USD",
        "interest_rate": None,
        "interest_period": None,
        "last_price": 150.25,
        "last_price_date": date(2024, 1, 15),
        "issue_date": date(1980, 12, 12),
        "expiration_date": None,
        "first_call_date": None,
        "first_call_percentage": None,
        "coupon_date_0": None,
        "coupon_date_1": None,
        "coupon_date_2": None,
        "coupon_date_3": None,
        "preferred_exchange": "NASDAQ",
        "restriced_exchange": None,
        "contract_size": None,
        "initial_margin": None,
        "telekurs_symbol": None,
        "reuters_symbol": "AAPL.O",
        "yahoo_symbol": "AAPL",
        "sector_allocation": None,
        "free_text_0": None,
        "free_text_1": None,
        "free_text_2": None,
        "free_text_3": None,
        "metadata_json": None,
    }


@pytest.fixture
def sample_instrument_minimal():
    """Minimal instrument data (only required fields)."""
    return {
        "short_name": "MSFT",
        "full_name": "Microsoft Corporation",
        "instrument_type": "stock",
        "original_currency": "USD",
        "interest_currency": "USD",
    }

