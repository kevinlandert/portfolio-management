"""
Portfolio Management System - FastAPI Backend
Main application entry point with API endpoints for instruments and transactions.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from contextlib import asynccontextmanager

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from api.instruments import router as instruments_router
from api.transactions import router as transactions_router
from api.portfolio_snapshots import router as portfolio_snapshots_router
from database.scripts.db_connection import get_db

# Global database connection
db = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan and database connections."""
    global db
    # Startup
    db = get_db()
    print("🚀 Portfolio Management API started")
    print("📊 Database connection established")
    
    yield
    
    # Shutdown
    print("🛑 Shutting down Portfolio Management API")

# Create FastAPI app
app = FastAPI(
    title="Portfolio Management API",
    description="API for managing financial instruments, transactions, and portfolios",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(instruments_router, prefix="/api/v1", tags=["instruments"])
app.include_router(transactions_router, prefix="/api/v1", tags=["transactions"])
app.include_router(portfolio_snapshots_router, prefix="/api/v1", tags=["portfolio-snapshots"])

@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "Portfolio Management API",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "instruments": "/api/v1/instruments",
            "transactions": "/api/v1/transactions",
            "portfolio-snapshots": "/api/v1/portfolio-snapshots"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    try:
        # Test database connection
        db.get_connection()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database connection failed: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
