# product-service

REST API for the product catalog. Built with Node.js + Express, backed by PostgreSQL.

## Prerequisites

- Node.js 18+
- PostgreSQL running with the `ecommerce` database initialized (see `database/`)

## Local Development

```bash
npm install
npm start        # runs on http://localhost:3001
```

## Testing

```bash
npm test         # interactive watch mode
npm run test:ci  # single-run with coverage (used in CI)
```

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/products` | List all products |
| `GET` | `/products/:id` | Get product by ID |
| `POST` | `/products` | Create a product |

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | Port to listen on |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_NAME` | `ecommerce` | Database name |
| `DB_USER` | `postgres` | Database user |
| `DB_PASSWORD` | `password` | Database password |

## Tech Stack

- Node.js 18, Express 4
- pg (node-postgres)
- Jest for testing
test
