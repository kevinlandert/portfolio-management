# Portfolio Management System

A full-stack portfolio management application with Angular frontend and FastAPI backend.

## Prerequisites

Before running the application, ensure you have the following installed:

- [Docker](https://www.docker.com/get-started) (version 20.10 or higher)
- [Docker Compose](https://docs.docker.com/compose/install/) (version 2.0 or higher)
- [Make](https://www.gnu.org/software/make/) (usually pre-installed on Linux/macOS, available via [Chocolatey](https://chocolatey.org/) on Windows)

Verify installation:
```bash
docker --version
docker compose version
make --version
```

## Quick Start

### Using Makefile (Recommended)

The project includes a `Makefile` with convenient commands for common tasks.

#### 1. View Available Commands

See all available commands:
```bash
make help
```

#### 2. Start the Development Environment

From the project root directory, run:

```bash
make dev
```

This will:
- Build the frontend and backend development containers
- Start the Angular development server (frontend)
- Start the FastAPI development server (backend)
- Mount your local files for hot reload
- Make the frontend available at `http://localhost:4200`
- Make the backend API available at `http://localhost:8000`

#### 3. Initialize the Database

Before using the backend, initialize the database schema:

```bash
make init-db
```

This creates the SQLite database and sets up all required tables.

#### 4. Access the Application

Once the containers are running:
- **Frontend**: Open [http://localhost:4200](http://localhost:4200) in your browser
- **Backend API**: Open [http://localhost:8000/docs](http://localhost:8000/docs) for interactive API documentation (Swagger UI)
- The Angular dev server will automatically reload when you make changes to your code

#### 5. Stop the Application

Press `Ctrl+C` in the terminal, or in a new terminal run:

```bash
make down
```

### Alternative: Direct Docker Compose

You can also use Docker Compose directly if preferred:

```bash
docker compose up --build
docker compose down -v
```

## Available Make Commands

Run `make help` to see all available commands with descriptions.

### Common Commands

| Command | Description |
|---------|-------------|
| `make help` | Show all available commands |
| `make dev` | Start development stack (builds and starts containers) |
| `make up` | Start containers in detached mode (background) |
| `make down` | Stop and remove containers, volumes, and networks |
| `make logs` | Show logs from all services (follow mode, last 200 lines) |
| `make frontend-logs` | Show only frontend logs |
| `make backend-logs` | Show only backend logs |
| `make restart` | Restart all services |
| `make rebuild` | Rebuild containers from scratch (no cache) |
| `make clean` | Stop containers, remove volumes, and prune system |
| `make init-db` | Initialize database schema (SQLite) |

### Container Access

| Command | Description |
|---------|-------------|
| `make frontend-shell` | Open shell in frontend container |
| `make backend-shell` | Open shell in backend container |

### Testing

| Command | Description |
|---------|-------------|
| `make test` | Run backend tests (pytest) |

### Database

| Command | Description |
|---------|-------------|
| `make init-db` | Initialize SQLite database schema |

## Development Workflow

### Making Code Changes

**Frontend:**
1. Edit your code in the `frontend/` directory on your local machine
2. Changes are automatically synced to the container via volumes
3. The Angular dev server detects changes and reloads automatically
4. Refresh your browser to see updates

**Backend:**
1. Edit your code in the `backend/` directory on your local machine
2. Changes are automatically synced to the container via volumes
3. The FastAPI server automatically reloads when Python files change
4. Test API changes using Swagger UI at `http://localhost:8000/docs`

### Adding/Updating Dependencies

**Frontend (npm packages):**

1. Update `frontend/package.json` locally
2. Rebuild the container to install new dependencies:
   ```bash
   make rebuild
   ```

Or access the container shell and install directly:
```bash
make frontend-shell
# Inside container:
npm install <package-name>
```

**Backend (Python packages):**

1. Update `backend/requirements.txt` locally
2. Rebuild the container:
   ```bash
   make rebuild
   ```

Or access the container shell and install directly:
```bash
make backend-shell
# Inside container:
pip install <package-name>
# Update requirements.txt: pip freeze > requirements.txt
```

### Viewing Logs

View logs from all services:
```bash
make logs
```

View logs from a specific service:
```bash
make frontend-logs
make backend-logs
```

### Database Management

**Initialize the database:**
```bash
make init-db
```

This creates the SQLite database schema. Run this after:
- First time setup
- After schema changes
- If you delete `backend/database/data/portfolio.db`

### Restarting Services

Restart all services:
```bash
make restart
```

### Rebuilding After Changes

After modifying Dockerfiles or dependencies, rebuild:
```bash
make rebuild
```

## Troubleshooting

### Port already in use

If port 4200 is already in use, you can modify the port mapping in `docker-compose.yml`:

```yaml
ports:
  - "4201:4200"  # Use 4201 instead of 4200
```

Then access the app at `http://localhost:4201`

### Container won't start

1. Check if containers are running:
   ```bash
   docker compose ps
   ```

2. View container logs:
   ```bash
   make logs
   # Or for specific service
   make frontend-logs
   ```

3. Rebuild from scratch:
   ```bash
   make clean
   make dev
   ```

### Node modules issues

If you encounter `node_modules` related errors:

```bash
# Clean everything and rebuild
make clean
make dev
```

### Changes not reflecting

- Ensure volumes are properly mounted (check `docker-compose.yml`)
- Try restarting the container: `make restart`
- Check Angular polling is enabled (see `frontend/Dockerfile.dev`)
- For backend: Check uvicorn reload is working (see `backend/Dockerfile.dev`)

### Database errors

If you see "no such table" errors:
1. Make sure you've initialized the database: `make init-db`
2. Check that `backend/database/data/portfolio.db` exists
3. Verify the database schema files are in `backend/database/schema/`

### Need to clean everything

Deep clean (removes containers, volumes, and prunes Docker system):
```bash
make clean
```

## Architecture

### Services

- **frontend-dev**: Angular development server with hot reload
  - Port: `4200`
  - Hot reload: Enabled
  - File sync: Yes (via volumes)

- **backend-dev**: FastAPI backend with hot reload
  - Port: `8000`
  - API docs: `http://localhost:8000/docs` (Swagger UI)
  - API root: `http://localhost:8000`
  - Hot reload: Enabled (uvicorn --reload)
  - Database: SQLite (`backend/database/data/portfolio.db`)

### Volumes

- `./frontend:/app` - Syncs frontend code for hot reload
- `/app/node_modules` - Keeps node_modules isolated in container
- `./backend:/app` - Syncs backend code for hot reload
- `./backend/database/data:/app/database/data` - Database persistence (SQLite)

### Networks

- `portfolio-network` - Bridge network connecting all services

## Production Deployment

For production builds, use the production-specific commands (when configured):

```bash
make prod-build
make prod-up
```

See individual Dockerfiles:
- `frontend/Dockerfile` - Production-optimized Angular build with nginx
- `backend/Dockerfile` - Production FastAPI setup

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Make Documentation](https://www.gnu.org/software/make/manual/)
- [Angular Documentation](https://angular.dev)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)