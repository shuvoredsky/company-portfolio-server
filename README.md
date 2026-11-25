# Company Portfolio Server (`company-server`)

Backend REST API for the **Company Portfolio** website, built with Node.js, Express, TypeScript (strict mode), MongoDB/Mongoose, and Zod.

For the complete architecture, coding conventions, security design, and implementation roadmap, see [PLAN.md](./PLAN.md).

## Prerequisites

- **Node.js** (v20+ recommended)
- **npm**
- **MongoDB** URI (optional in `development` during initial setup; the server logs a warning and skips DB connection when `MONGODB_URI` is empty or a placeholder)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Update `.env` with your local values (`JWT_SECRET`, `CLIENT_URL`, `ADMIN_URL`, and optionally `MONGODB_URI`, Cloudinary, and admin seed credentials).

## Available Scripts

- `npm run dev` — Start the development server with hot-reload (`ts-node-dev`)
- `npm run build` — Compile TypeScript (`src/` -> `dist/`)
- `npm start` — Run the compiled production build (`node dist/server.js`)

## Health Check

- **Endpoint:** `GET /api/v1/health`
- **Sample Response (`200 OK`):**
  ```json
  {
    "success": true,
    "message": "Server is running smoothly",
    "data": {
      "status": "ok",
      "environment": "development",
      "uptime": 1.23,
      "timestamp": "2026-11-25T09:00:00.000Z",
      "database": "disconnected"
    }
  }
  ```

## Project Structure

- `src/config/index.ts` — Zod-validated environment configuration
- `src/app.ts` — Express application, global middlewares, health route, router, 404 & error handlers
- `src/server.ts` — Database connection & HTTP server bootstrap with graceful shutdown
- `src/app/modules/` — Feature modules (`auth`, `banner`, `blog`, `recruitment`, `contact`)
- `src/app/middlewares/` — `validateRequest`, `notFound`, `globalErrorHandler`
- `src/app/errors/` — `AppError` and Zod/Mongoose/Duplicate key error formatters
- `src/app/utils/` — `catchAsync`, `sendResponse`
- `src/app/routes/` — Central `/api/v1` router

