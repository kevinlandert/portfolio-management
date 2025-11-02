# Tests

## Setup

### Option 1: Install locally (using pip3)

```bash
cd backend
pip3 install -r requirements.txt
```

If you get permission errors, use `--user` flag:
```bash
pip3 install --user -r requirements.txt
```

### Option 2: Install in Docker container

First, make sure your containers are running:
```bash
make dev
# or
docker compose up -d
```

Then install in the backend container:
```bash
docker compose exec backend-dev pip install -r requirements.txt
```

Or run tests directly in Docker:
```bash
docker compose exec backend-dev pytest
```

## Running Tests

### Locally (after installing with pip3)

Run all tests:
```bash
cd backend
pytest
```

Run with coverage:
```bash
pytest --cov=app --cov-report=html
```

Run specific test file:
```bash
pytest tests/test_instrument_service.py
```

Run specific test class:
```bash
pytest tests/test_instrument_service.py::TestInstrumentServiceCreate
```

Run specific test:
```bash
pytest tests/test_instrument_service.py::TestInstrumentServiceCreate::test_create_instrument_full_data
```

Verbose output:
```bash
pytest -v
```

### In Docker

Run all tests:
```bash
make test
# or
docker compose exec backend-dev pytest
```

Run specific test:
```bash
docker compose exec backend-dev pytest tests/test_instrument_service.py -v
```

Run with coverage:
```bash
docker compose exec backend-dev pytest --cov=app --cov-report=term-missing
```

## Coverage Reports

### HTML Coverage Reports (htmlcov)

When you run tests with coverage reporting, pytest automatically generates an HTML coverage report in the `htmlcov/` directory. This provides a visual, interactive view of your test coverage.

#### Generating the Report

The HTML report is automatically generated when you run:
```bash
pytest
```

Or explicitly:
```bash
pytest --cov=app --cov-report=html
```

#### Viewing the Report

1. **Open the coverage report:**
   ```bash
   # On macOS
   open backend/htmlcov/index.html
   
   # On Linux
   xdg-open backend/htmlcov/index.html
   
   # On Windows
   start backend/htmlcov/index.html
   ```

2. **Or navigate manually:**
   - Open `backend/htmlcov/index.html` in your web browser

#### Understanding the Report

The HTML report shows:

- **Overall coverage percentage** - Coverage summary for all modules
- **Per-file coverage** - Individual coverage percentage for each Python file
- **Line-by-line details** - Click any file to see:
  - 🟢 **Green lines** - Covered by tests
  - 🔴 **Red lines** - Not covered by tests
  - 🟡 **Yellow lines** - Partially covered (e.g., branch coverage)
  - ⚪ **Gray lines** - Excluded from coverage (blank lines, comments)

#### Example Usage

To check which parts of your `instrument_service.py` need more tests:

1. Run: `pytest`
2. Open: `backend/htmlcov/index.html`
3. Click on: `app/services/instrument_service.py`
4. Review red lines to identify untested code paths

#### Notes

- The `htmlcov/` directory is automatically ignored by git (already in `.gitignore`)
- Reports are regenerated each time you run tests
- The report shows coverage for all files in the `app/` directory (as configured in `pytest.ini`)

## Test Structure

- `conftest.py`: Pytest fixtures and configuration
  - `temp_db_path`: Creates temporary database file
  - `test_db`: Creates test database with schema initialized
  - `instrument_service`: Creates InstrumentService with test database
  - `sample_instrument_data`: Sample data for testing
  - `sample_instrument_minimal`: Minimal required data

- `test_instrument_service.py`: Comprehensive tests for InstrumentService
  - `TestInstrumentServiceCreate`: Tests for creating instruments
  - `TestInstrumentServiceGet`: Tests for retrieving instruments
  - `TestInstrumentServiceUpdate`: Tests for updating instruments
  - `TestInstrumentServiceDelete`: Tests for deleting instruments
  - `TestInstrumentServiceEdgeCases`: Edge cases and error handling

## Test Database

Tests use a temporary SQLite database that is created and destroyed for each test run. The database schema is automatically initialized from the schema files in `database/schema/`.

