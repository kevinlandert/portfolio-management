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
- Build the frontend development container
- Start the Angular development server
- Mount your local files for hot reload
- Make the app available at `http://localhost:4200`

#### 3. Access the Application

Once the containers are running:
- **Frontend**: Open [http://localhost:4200](http://localhost:4200) in your browser
- The Angular dev server will automatically reload when you make changes to your code

#### 4. Stop the Application

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
| `make backend-logs` | Show only backend logs (when enabled) |
| `make restart` | Restart all services |
| `make rebuild` | Rebuild containers from scratch (no cache) |
| `make clean` | Stop containers, remove volumes, and prune system |

### Container Access

| Command | Description |
|---------|-------------|
| `make frontend-shell` | Open shell in frontend container |
| `make backend-shell` | Open shell in backend container (when enabled) |

### Testing

| Command | Description |
|---------|-------------|
| `make test` | Run tests for frontend and backend |

### Future Commands (when backend/database are enabled)

| Command | Description |
|---------|-------------|
| `make db-shell` | Connect to database (when PostgreSQL service is added) |
| `make makemigration` | Create new Alembic migration |
| `make migrate` | Run database migrations |

## Development Workflow

### Making Code Changes

1. Edit your code in the `frontend/` directory on your local machine
2. Changes are automatically synced to the container via volumes
3. The Angular dev server detects changes and reloads automatically
4. Refresh your browser to see updates

### Adding/Updating Dependencies

If you add new npm packages:

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

- **backend**: FastAPI backend (when enabled)
  - Port: `8000`
  - API docs: `http://localhost:8000/docs`

### Volumes

- `./frontend:/app` - Syncs frontend code for hot reload
- `/app/node_modules` - Keeps node_modules isolated in container
- `./backend/database/data:/app/database/data` - Database persistence (when backend enabled)

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