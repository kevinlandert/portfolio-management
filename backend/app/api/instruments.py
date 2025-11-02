"""
Instruments API Router
Handles HTTP requests for instrument management.
"""

import logging
from fastapi import APIRouter, HTTPException, status, Query
from typing import Optional, List
from app.schemas.instrument import (
    InstrumentCreate,
    InstrumentResponse,
    InstrumentUpdate,
)
from app.services.instrument_service import InstrumentService
from app.models.enums import InstrumentType

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/instruments", tags=["instruments"])


@router.get(
    "/",
    response_model=List[InstrumentResponse],
    summary="List all instruments",
    description="Retrieve all instruments with optional filtering"
)
async def list_instruments(
    instrument_type: Optional[InstrumentType] = Query(None, description="Filter by instrument type (Equity, Bond, ETF, or Future)"),
    sector: Optional[str] = Query(None, description="Filter by sector"),
    country: Optional[str] = Query(None, description="Filter by country"),
    limit: Optional[int] = Query(100, ge=1, le=1000, description="Maximum number of results"),
    offset: Optional[int] = Query(0, ge=0, description="Number of results to skip")
):
    """
    Get all instruments with optional filtering and pagination.
    
    - **instrument_type**: Filter by type (Equity, Bond, ETF, or Future)
    - **sector**: Filter by industry sector
    - **country**: Filter by country
    - **limit**: Maximum number of results (1-1000, default: 100)
    - **offset**: Skip this many results (for pagination)
    """
    try:
        logger.info(f"Fetching instruments with filters: type={instrument_type}, sector={sector}, country={country}, limit={limit}, offset={offset}")
        service = InstrumentService()
        instruments = service.get_instruments()
        logger.info(f"Retrieved {len(instruments)} instruments from database")
        
        # Apply filters
        if instrument_type:
            original_count = len(instruments)
            instruments = [i for i in instruments if i.instrument_type == instrument_type.value]
            logger.info(f"Filtered by instrument_type={instrument_type.value}: {original_count} -> {len(instruments)}")
        
        if sector:
            original_count = len(instruments)
            instruments = [i for i in instruments if i.sector == sector]
            logger.info(f"Filtered by sector={sector}: {original_count} -> {len(instruments)}")
        
        if country:
            original_count = len(instruments)
            instruments = [i for i in instruments if i.country == country]
            logger.info(f"Filtered by country={country}: {original_count} -> {len(instruments)}")
        
        # Apply pagination
        total = len(instruments)
        instruments = instruments[offset:offset + limit]
        logger.info(f"Applied pagination: returning {len(instruments)} of {total} total instruments")
        
        return instruments
        
    except Exception as e:
        logger.exception(f"Error retrieving instruments: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve instruments. Please check server logs for details. Error: {str(e)}"
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
        logger.info(f"Fetching instrument with ID: {instrument_id}")
        service = InstrumentService()
        instrument = service.get_instrument(instrument_id)
        
        if not instrument:
            logger.warning(f"Instrument with ID {instrument_id} not found")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Instrument with ID {instrument_id} not found"
            )
        
        return instrument
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error retrieving instrument {instrument_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve instrument {instrument_id}. Please check server logs for details. Error: {str(e)}"
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
    - **instrument_type**: Type of instrument - must be Equity, Bond, ETF, or Future (required)
    - **original_currency**: Currency of home market - must be CHF, EUR, or USD (required)
    - **interest_currency**: Currency for payments - must be CHF, EUR, or USD (required)
    - All other fields are optional
    """
    try:
        logger.info(f"Creating new instrument: {instrument.short_name} ({instrument.instrument_type})")
        service = InstrumentService()
        created_instrument = service.create_instrument(instrument)
        logger.info(f"Successfully created instrument with ID: {created_instrument.instrument_id}")
        return created_instrument
        
    except Exception as e:
        logger.exception(f"Error creating instrument: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create instrument. Please check the request data and try again. Error: {str(e)}"
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
        logger.info(f"Updating instrument with ID: {instrument_id}")
        service = InstrumentService()
        updated_instrument = service.update_instrument(instrument_id, instrument)
        
        if not updated_instrument:
            logger.warning(f"Instrument with ID {instrument_id} not found for update")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Instrument with ID {instrument_id} not found"
            )
        
        logger.info(f"Successfully updated instrument with ID: {instrument_id}")
        return updated_instrument
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error updating instrument {instrument_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update instrument {instrument_id}. Please check server logs for details. Error: {str(e)}"
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
        logger.info(f"Deleting instrument with ID: {instrument_id}")
        service = InstrumentService()
        deleted = service.delete_instrument(instrument_id)
        
        if not deleted:
            logger.warning(f"Instrument with ID {instrument_id} not found for deletion")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Instrument with ID {instrument_id} not found"
            )
        
        logger.info(f"Successfully deleted instrument with ID: {instrument_id}")
        # FastAPI automatically returns 204 when endpoint returns None
        
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Error deleting instrument {instrument_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete instrument {instrument_id}. Please check server logs for details. Error: {str(e)}"
        )