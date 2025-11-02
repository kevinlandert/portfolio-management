from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import instruments # ,  transactions  # Import routers

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

# Register routers
app.include_router(instruments.router, prefix="/api/v1")
# app.include_router(transactions.router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"message": "Portfolio Management API"}

# Run with: uvicorn app.main:app --reload