import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from app.api import instruments # ,  transactions  # Import routers

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Portfolio Management API",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers for better error messages
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    """Handle Pydantic validation errors with detailed messages"""
    errors = []
    for error in exc.errors():
        field = " -> ".join(str(loc) for loc in error["loc"])
        errors.append(f"{field}: {error['msg']}")
    
    logger.warning(f"Validation error for {request.url}: {', '.join(errors)}")
    return JSONResponse(
        status_code=422,
        content={
            "detail": "Validation error",
            "errors": errors,
            "message": "Request data is invalid. Please check the provided fields."
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Handle unexpected errors with logging"""
    logger.exception(f"Unhandled exception for {request.url}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "message": "An unexpected error occurred. Please check server logs for details.",
            "error": str(exc) if app.debug else "Internal server error"
        }
    )

# Register routers
app.include_router(instruments.router, prefix="/api/v1")
# app.include_router(transactions.router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "Portfolio Management API"}

# Run with: uvicorn app.main:app --reload