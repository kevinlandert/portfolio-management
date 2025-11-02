from fastapi import APIRouter
from app.schemas.transaction import TransactionCreate, TransactionResponse

router = APIRouter(prefix="/transactions", tags=["transactions"])

@router.get("/")
async def list_transactions():
    # Similar structure to instruments
    pass

@router.post("/")
async def create_transaction(transaction: TransactionCreate):
    pass