"""
Enums for shared constants across the application.
"""

from enum import Enum


class InstrumentType(str, Enum):
    """Valid instrument types."""
    EQUITY = "Equity"
    BOND = "Bond"
    ETF = "ETF"
    FUTURE = "Future"

    @classmethod
    def values(cls):
        """Return list of valid values."""
        return [e.value for e in cls]


class Currency(str, Enum):
    """Valid currency codes (ISO 4217)."""
    CHF = "CHF"
    EUR = "EUR"
    USD = "USD"

    @classmethod
    def values(cls):
        """Return list of valid values."""
        return [e.value for e in cls]

