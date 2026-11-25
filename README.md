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

- `npm run dev` — Start the development server with hot-reload (`tsx watch`)
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



## Deployment

### Required Environment Variables (Names Only)
- `NODE_ENV` (`production`)
- `PORT` (e.g., `5000` or platform-assigned)
- `MONGODB_URI`
- `JWT_SECRET` (minimum 32 characters in production)
- `JWT_EXPIRES_IN` (e.g., `7d`)
- `CLIENT_URL` (supports comma-separated origins for preview/staging domains)
- `ADMIN_URL` (supports comma-separated origins for preview/staging domains)
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD` (minimum 8 characters in production)

### Build & Start Commands
- **Build command:** `npm run build`
- **Start command:** `npm start`

### Production Security Notes
- **Cross-Origin Cookies & HTTPS:** In `production`, `accessToken` is issued with `httpOnly: true`, `secure: true`, and `sameSite: 'none'` so separate client/admin domains work. **HTTPS is strictly required** for browsers to accept `Secure; SameSite=None` cookies, and frontends must send `credentials: 'include'`.
- **CORS Setup:** Set `CLIENT_URL` and `ADMIN_URL` to exact `https://...` origins (no trailing slash). Multiple origins can be comma-separated (e.g., `https://admin.example.com,https://admin-preview.vercel.app`).
- **Trust Proxy:** `app.set('trust proxy', 1)` is automatically enabled in `production` so `express-rate-limit` reads the real client IP behind reverse proxies (Render, Railway, Cloudflare, Nginx).

### Render / Railway Deployment Checklist
1. Connect the `company-portfolio-server` GitHub repository (`main` branch).
2. Set Build Command to `npm install && npm run build` and Start Command to `npm start`.
3. Add all environment variables listed above (ensure `NODE_ENV=production`, `JWT_SECRET` >= 32 chars, `ADMIN_PASSWORD` >= 8 chars).
4. Whitelist your hosting platform's outbound IPs (or `0.0.0.0/0` with strong DB credentials) in MongoDB Atlas Network Access.
5. Verify `GET https://<your-api-domain>/api/v1/health` returns `"database": "connected"`.
