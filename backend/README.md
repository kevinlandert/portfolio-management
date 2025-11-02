# Portfolio Management Backend

FastAPI backend for the Portfolio Management System, providing RESTful APIs for managing financial instruments, transactions, and portfolios.

## Prerequisites

- Python 3.11+ (or Docker)
- Virtual environment (recommended)
- Dependencies listed in `requirements.txt`

## Quick Start

### Option 1: Using Docker (Recommended)

```bash
# From project root
make dev
# or
docker compose up backend-dev
```

Backend will be available at: `http://localhost:8000`

**API Documentation:** [http://localhost:8000/docs](http://localhost:8000/docs) (Swagger UI)

### Option 2: Local Development

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Database Setup

### Initialize Database

Before using the API, you need to initialize the database schema:

**Using Docker:**
```bash
# From project root
make init-db
```

**Locally:**
```bash
cd backend
python database/scripts/init_db.py
```

This will:
- Create the SQLite database at `backend/database/data/portfolio.db`
- Execute all schema files from `backend/database/schema/`
- Set up all required tables and indexes

**Note:** You need to run this after:
- First time setup
- After schema changes
- If you delete the database file

## Testing the API

### FastAPI Swagger UI (Interactive Documentation)

FastAPI automatically generates interactive API documentation that you can use to test all endpoints directly from your browser.

#### 1. Start the Backend

Ensure the backend is running (see Quick Start above).

#### 2. Initialize Database

Make sure the database is initialized (see Database Setup above).

#### 3. Access Swagger UI

Open your browser and navigate to:

**http://localhost:8000/docs**

#### 4. Example: Creating an Instrument

1. Navigate to `POST /api/v1/instruments`
2. Click "Try it out"
3. Replace the example JSON with:

       ```json
       {
         "short_name": "AAPL",
         "full_name": "Apple Inc.",
         "instrument_type": "Equity",
         "original_currency": "USD",
         "interest_currency": "USD",
         "yahoo_symbol": "AAPL"
       }
       ```

4. Click "Execute"
5. You'll see:
   - **Response Code:** `201 Created`
   - **Response Body:** The created instrument with `instrument_id`, `created_at`, etc.

       **Note:** 
       - `original_currency` and `interest_currency` are required fields
       - `instrument_type` must be one of: `Equity`, `Bond`, `ETF`, or `Future`
       - `original_currency` and `interest_currency` must be one of: `CHF`, `EUR`, or `USD`

#### 5. Example: Getting All Instruments

1. Navigate to `GET /api/v1/instruments`
2. Click "Try it out"
3. Optionally add query parameters:
   - `instrument_type`: `Equity` (must be Equity, Bond, ETF, or Future)
   - `sector`: `Technology`
   - `country`: `USA`
   - `limit`: `10`
   - `offset`: `0`
4. Click "Execute"
5. Response will show a list of all instruments (filtered if parameters provided)

#### 6. Example: Getting a Single Instrument

1. Navigate to `GET /api/v1/instruments/{instrument_id}`
2. Click "Try it out"
3. Enter the `instrument_id` (e.g., `1`)
4. Click "Execute"
5. Response will show the instrument details

#### 7. Example: Updating an Instrument

1. Navigate to `PUT /api/v1/instruments/{instrument_id}`
2. Click "Try it out"
3. Enter the `instrument_id` (e.g., `1`)
4. Update the request body with only the fields you want to change:

```json
{
  "last_price": 175.50,
  "last_price_date": "2025-01-15"
}
```

5. Click "Execute"
6. Response will show the updated instrument

#### 8. Example: Deleting an Instrument

1. Navigate to `DELETE /api/v1/instruments/{instrument_id}`
2. Click "Try it out"
3. Enter the `instrument_id` (e.g., `1`)
4. Click "Execute"
5. Response Code: `204 No Content` (successful deletion)

### Alternative API Docs (ReDoc)

For a more documentation-focused view, access ReDoc at:

**http://localhost:8000/redoc**

### API Endpoints Summary

#### Instruments

- `GET /api/v1/instruments` - List all instruments (with filtering and pagination)
- `GET /api/v1/instruments/{instrument_id}` - Get a single instrument
- `POST /api/v1/instruments` - Create a new instrument
- `PUT /api/v1/instruments/{instrument_id}` - Update an instrument (partial update)
- `DELETE /api/v1/instruments/{instrument_id}` - Delete an instrument

**Query Parameters for GET /api/v1/instruments:**
- `instrument_type`: Filter by type (must be: Equity, Bond, ETF, or Future)
- `sector`: Filter by industry sector
- `country`: Filter by country
- `limit`: Maximum number of results (1-1000, default: 100)
- `offset`: Number of results to skip (for pagination)

## Database

The backend uses **SQLite** for data storage. The database file is located at:

- **Path:** `backend/database/data/portfolio.db`
- **Schema files:** `backend/database/schema/*.sql`

### Database Schema

The database schema is defined in SQL files:
- `01_instrument.sql` - Instruments table
- `02_transactions.sql` - Transactions table

## Testing

### Running Tests

**Using Docker:**
```bash
# From project root
make test
```

**Locally:**
```bash
cd backend
pytest
```

### Test Coverage

To see coverage reports:
```bash
# In Docker
docker compose exec backend-dev pytest --cov=app --cov-report=html

# View coverage report
open backend/htmlcov/index.html  # macOS
```

See `backend/tests/README.md` for detailed testing documentation.

## Project Structure

```
backend/
├── app/
│   ├── api/           # API route handlers
│   │   ├── instruments.py
│   │   └── transactions.py
│   ├── schemas/       # Pydantic models
│   │   ├── instrument.py
│   │   └── transaction.py
│   ├── services/      # Business logic
│   │   ├── instrument_service.py
│   │   └── portfolio_analytics.py
│   ├── config.py      # Configuration
│   └── main.py        # FastAPI app entry point
├── database/
│   ├── schema/        # SQL schema files
│   ├── data/          # Database file (SQLite)
│   └── scripts/       # Database utilities
│       ├── db_connection.py
│       └── init_db.py
├── tests/             # Test suite
│   ├── conftest.py    # Pytest fixtures
│   └── test_instrument_service.py
├── requirements.txt   # Python dependencies
└── README.md         # This file
```

## Development

### Hot Reload

When running in Docker or with `uvicorn --reload`, the server automatically restarts when you modify Python files.

### Adding New Endpoints

1. Create route handler in `app/api/`
2. Create Pydantic schema in `app/schemas/`
3. Create service logic in `app/services/`
4. Register router in `app/main.py`

### Database Changes

When modifying the schema:
1. Update SQL files in `database/schema/`
2. Delete `database/data/portfolio.db`
3. Run `make init-db` to recreate the database

## Troubleshooting

### Database not found errors

If you see "no such table" errors:
1. Run `make init-db` to initialize the database
2. Check that `database/data/portfolio.db` exists
3. Verify schema files are correct

### Import errors

If you see module import errors:
- Make sure dependencies are installed: `pip install -r requirements.txt`
- Check Python path in Docker container
- Verify file structure matches imports

### Port conflicts

If port 8000 is in use:
- Modify `docker-compose.yml` port mapping
- Or stop the conflicting service