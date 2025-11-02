"""
Instruments API Router
Handles HTTP requests for instrument management.
"""

from fastapi import APIRouter, HTTPException, status, Query
from typing import Optional, List
from app.schemas.instrument import (
    InstrumentCreate,
    InstrumentResponse,
    InstrumentUpdate,
)
from app.services.instrument_service import InstrumentService

router = APIRouter(prefix="/instruments", tags=["instruments"])


@router.get(
    "/",
    response_model=List[InstrumentResponse],
    summary="List all instruments",
    description="Retrieve all instruments with optional filtering"
)
async def list_instruments(
    instrument_type: Optional[str] = Query(None, description="Filter by instrument type"),
    sector: Optional[str] = Query(None, description="Filter by sector"),
    country: Optional[str] = Query(None, description="Filter by country"),
    limit: Optional[int] = Query(100, ge=1, le=1000, description="Maximum number of results"),
    offset: Optional[int] = Query(0, ge=0, description="Number of results to skip")
):
    """
    Get all instruments with optional filtering and pagination.
    
    - **instrument_type**: Filter by type (stock, bond, etf, etc.)
    - **sector**: Filter by industry sector
    - **country**: Filter by country
    - **limit**: Maximum number of results (1-1000, default: 100)
    - **offset**: Skip this many results (for pagination)
    """
    try:
        service = InstrumentService()
        instruments = service.get_instruments()
        
        # Apply filters
        if instrument_type:
            instruments = [i for i in instruments if i.instrument_type == instrument_type]
        if sector:
            instruments = [i for i in instruments if i.sector == sector]
        if country:
            instruments = [i for i in instruments if i.country == country]
        
        # Apply pagination
        total = len(instruments)
        instruments = instruments[offset:offset + limit]
        
        return instruments
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving instruments: {str(e)}"
        )


@router.get(
    "/{instrument_id}",
    response_model=InstrumentResponse,
    summary="Get instrument by ID",
    description="Retrieve a specific instrument by its ID"
)
async def get_instrument(instrument_id: int):
    """
    Get a single instrument by ID.
    
    - **instrument_id**: Unique identifier of the instrument
    """
    try:
        service = InstrumentService()
        instrument = service.get_instrument(instrument_id)
        
        if not instrument:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Instrument with ID {instrument_id} not found"
            )
        
        return instrument
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving instrument: {str(e)}"
        )


@router.post(
    "/",
    response_model=InstrumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create new instrument",
    description="Create a new financial instrument"
)
async def create_instrument(instrument: InstrumentCreate):
    """
    Create a new instrument.
    
    - **short_name**: Short trading name (e.g., "AAPL")
    - **full_name**: Full legal name (e.g., "Apple Inc.")
    - **instrument_type**: Type of instrument (required)
    - **original_currency**: Currency of home market (required)
    - **interest_currency**: Currency for payments (required)
    - All other fields are optional
    """
    try:
        service = InstrumentService()
        created_instrument = service.create_instrument(instrument)
        return created_instrument
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error creating instrument: {str(e)}"
        )


@router.put(
    "/{instrument_id}",
    response_model=InstrumentResponse,
    summary="Update instrument",
    description="Update an existing instrument (partial update - only provided fields are updated)"
)
async def update_instrument(
    instrument_id: int,
    instrument: InstrumentUpdate
):
    """
    Update an existing instrument.
    
    Only the fields provided in the request body will be updated.
    All fields are optional.
    
    - **instrument_id**: ID of instrument to update
    """
    try:
        service = InstrumentService()
        updated_instrument = service.update_instrument(instrument_id, instrument)
        
        if not updated_instrument:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Instrument with ID {instrument_id} not found"
            )
        
        return updated_instrument
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating instrument: {str(e)}"
        )


@router.delete(
    "/{instrument_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete instrument",
    description="Delete an instrument by ID"
)
async def delete_instrument(instrument_id: int):
    """
    Delete an instrument.
    
    - **instrument_id**: ID of instrument to delete
    
    Returns 204 No Content on success.
    """
    try:
        service = InstrumentService()
        deleted = service.delete_instrument(instrument_id)
        
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Instrument with ID {instrument_id} not found"
            )
        
        # FastAPI automatically returns 204 when endpoint returns None
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting instrument: {str(e)}"
        )