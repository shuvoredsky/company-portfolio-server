# Company Portfolio Backend — Architecture & Implementation Plan

## 1. Project Overview & Tech Stack

This repository (`company-server`) is the RESTful backend API for the **Company Portfolio** platform, serving both the public client site (`CLIENT_URL`) and the admin dashboard (`ADMIN_URL`).

- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript (`strict: true`)
- **Dev Runner:** `tsx` (`tsx watch`)
- **Database:** MongoDB with Mongoose ODM
- **Validation:** Zod (request body, query, params, cookies, and environment variables)
- **Authentication:** Admin-only JWT stored in HTTP-only cookies (no public registration)
- **Media Storage:** Cloudinary via `multer` (memory storage)
- **Security & Middleware:** `helmet`, `cors`, `cookie-parser`, `express-rate-limit`, `bcryptjs`, `morgan` (dev only)
- **Package Manager:** `npm`

---

## 2. Folder Structure & Module Pattern

```text
company-server/
├── src/
│   ├── app.ts                      # Express app setup, global middlewares, health route, router mount
│   ├── server.ts                   # DB connection & HTTP server bootstrap, signal & error handling
│   ├── config/
│   │   └── index.ts                # Loads & validates .env using Zod
│   └── app/
│       ├── modules/                # Feature-based domain modules
│       │   ├── auth/
│       │   ├── banner/
│       │   ├── blog/
│       │   ├── recruitment/
│       │   └── contact/
│       ├── middlewares/
│       │   ├── globalErrorHandler.ts
│       │   ├── notFound.ts
│       │   └── validateRequest.ts
│       ├── errors/
│       │   ├── AppError.ts
│       │   ├── handleZodError.ts
│       │   ├── handleMongooseError.ts
│       │   └── handleDuplicateError.ts
│       ├── utils/
│       │   ├── catchAsync.ts
│       │   └── sendResponse.ts
│       └── routes/
│           └── index.ts            # Central v1 API router
├── .env.example
├── .gitignore
├── .env                            # Local environment variables (git-ignored)
├── tsconfig.json
├── package.json
├── PLAN.md
└── README.md
```

### Feature Module Convention
Every module under `src/app/modules/<feature>/` must follow a strict 6-file separation of concerns:

| File | Responsibility |
| --- | --- |
| `<x>.interface.ts` | TypeScript interfaces, DTOs, and Mongoose document/model types |
| `<x>.model.ts` | Mongoose schema, indexes, hooks, and model export |
| `<x>.validation.ts` | Zod schemas for request validation (`body`, `params`, `query`) |
| `<x>.service.ts` | All business logic, database queries, and third-party service calls (e.g., Cloudinary) |
| `<x>.controller.ts` | Thin Express handlers wrapped in `catchAsync`, calling services and `sendResponse` |
| `<x>.route.ts` | Express router mapping endpoints to middlewares (`auth`, `rateLimiter`, `multer`, `validateRequest`) and controllers |

---

## 3. Coding Rules

1. **Strict TypeScript:** `strict: true` is enforced. **Never use `any`** — use explicit interfaces, generics, or `unknown` with runtime type guards.
2. **Async Error Handling:** Every async controller/handler must be wrapped in `catchAsync` so rejections flow automatically to `globalErrorHandler`.
3. **Validation Boundary:** All external inputs (`req.body`, `req.query`, `req.params`, `req.cookies`) must be validated at the route level using `validateRequest(zodSchema)`.
4. **Thin Controllers, Fat Services:** Controllers only extract validated request data, invoke service methods, set/clear cookies when needed, and return formatted responses via `sendResponse`. Business rules and Mongoose queries live strictly in `*.service.ts`.
5. **Consistent Success Response Shape:**
   ```json
   {
     "success": true,
     "message": "Human-readable status message",
     "meta": {
       "page": 1,
       "limit": 10,
       "total": 42,
       "totalPages": 5
     },
     "data": {}
   }
   ```
   (`meta` is included only for paginated list responses.)
6. **Consistent Error Response Shape:**
   ```json
   {
     "success": false,
     "message": "Error summary",
     "errorSources": [
       { "path": "fieldName", "message": "Specific error detail" }
     ],
     "stack": "Only included when NODE_ENV === 'development'"
   }
   ```
7. **No Direct `process.env` Access:** Always import typed, validated environment variables from `src/config/index.ts`.

---

## 4. API Conventions

- **Base URL:** `/api/v1`
- **Health Endpoint:** `GET /api/v1/health`
- **REST Naming:** Plural lowercase nouns for collections (`/banners`, `/blogs`, `/recruitments`, `/contacts`), action/session sub-paths for auth (`/auth/login`, `/auth/logout`, `/auth/me`).
- **Pagination:** List endpoints accept `?page=1&limit=10` (validated with sensible defaults, e.g., `page = 1`, `limit = 10`, max `limit = 50`) and return `meta: { page, limit, total, totalPages }`.
- **HTTP Status Codes:** Use `http-status` constants consistently (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `429 Too Many Requests`, `500 Internal Server Error`).

---

## 5. Planned Modules & Endpoints

### 5.1 Auth (`/api/v1/auth`)
- **Access Model:** Admin-only authentication. **No public registration endpoint.**
- **Admin Seeding:** Initial admin user is seeded/synced idempotently at startup (or via dedicated seed script) from `ADMIN_EMAIL` and `ADMIN_PASSWORD` with `bcryptjs` hashing.
- **Endpoints:**
  - `POST /api/v1/auth/login` — Public (rate-limited). Validates credentials, issues signed JWT in HTTP-only cookie.
  - `POST /api/v1/auth/logout` — Authenticated/public cookie clear. Clears the JWT cookie.
  - `GET /api/v1/auth/me` — Protected (admin only). Returns current authenticated admin profile.

### 5.2 Banner (`/api/v1/banners`)
- **Fields:** Image-only banner (`image: { url, publicId }`, `order`, `isActive`, timestamps). The client frontend displays banner images only (no text or CTA button overlay).
- **Endpoints:**
  - `GET /api/v1/banners` — Public. Lists active banners (`_id`, `image.url`, `order`), sorted by `order` ascending.
  - `GET /api/v1/banners/admin/all` — Admin only (`no-store`). Lists all banners.
  - `POST /api/v1/banners` — Admin only. Upload banner image to Cloudinary and create banner.
  - `PATCH /api/v1/banners/:id` — Admin only. Update banner `order`/`isActive` or replace image (deletes previous image from Cloudinary).
  - `DELETE /api/v1/banners/:id` — Admin only. Delete banner and remove its image from Cloudinary.

### 5.3 Blog (`/api/v1/blogs`)
- **Fields:** `title`, `description`, `image: { url, publicId }`, timestamps.
- **Endpoints:**
  - `GET /api/v1/blogs` — Public (`public` cache). Paginated list of blog posts (`page`, `limit`, `search`).
  - `GET /api/v1/blogs/admin/all` — Admin only (`no-store`). Paginated list with `search` for admin dashboard.
  - `GET /api/v1/blogs/admin/:id` — Admin only (`no-store`). Get single blog post by ID for admin editing.
  - `GET /api/v1/blogs/:id` — Public (`public` cache). Get single blog post by ID.
  - `POST /api/v1/blogs` — Admin only. Upload blog image to Cloudinary and create post.
  - `PATCH /api/v1/blogs/:id` — Admin only. Update blog post; delete old Cloudinary image if replaced.
  - `DELETE /api/v1/blogs/:id` — Admin only. Delete blog post and remove its image from Cloudinary.

### 5.4 Network (`/api/v1/networks`)
- **Fields:** `title` (max 200), `description` (10–5000 chars), `image: { url, publicId }` (Cloudinary folder `company-portfolio/networks`), `externalUrl` (optional `http`/`https` URL, max 500), timestamps.
- **Endpoints:**
  - `GET /api/v1/networks` — Public (`public` cache). Paginated list (`page`, `limit`, `search`).
  - `GET /api/v1/networks/admin/all` — Admin only (`no-store`). Paginated list with `search`.
  - `GET /api/v1/networks/admin/:id` — Admin only (`no-store`). Single item for admin.
  - `GET /api/v1/networks/:id` — Public (`public` cache). Single item by ID.
  - `POST /api/v1/networks`, `PATCH /api/v1/networks/:id`, `DELETE /api/v1/networks/:id` — Admin only with Cloudinary lifecycle cleanup.

### 5.5 Recruitment (`/api/v1/recruitments`)
- **Fields:** `title`, `description`, timestamps (and optional status/active flag if needed).
- **Endpoints:**
  - `GET /api/v1/recruitments` — Public. Paginated list of recruitment openings.
  - `GET /api/v1/recruitments/:id` — Public. Get single recruitment post by ID.
  - `POST /api/v1/recruitments` — Admin only. Create recruitment post.
  - `PATCH /api/v1/recruitments/:id` — Admin only. Update recruitment post.
  - `DELETE /api/v1/recruitments/:id` — Admin only. Delete recruitment post.

### 5.6 Application (`/api/v1/applications`)
- **Fields:** `serialNumber` (unique uppercase 5–30 chars), `name`, `email`, `phone`, `status` (`pending` | `approved` | `rejected`), optional `note`, `passportNumber`, `visaStatus`, timestamps.
- **Endpoints:**
  - `POST /api/v1/applications/check` — Public (`no-store`, dedicated rate limiter: 15/15m per IP). Strict projection returning only `{ serialNumber, status, maskedName, updatedAt }`.
  - `GET /api/v1/applications/admin/all`, `GET /api/v1/applications/admin/:id`, `POST /api/v1/applications`, `PATCH /api/v1/applications/:id`, `DELETE /api/v1/applications/:id` — Admin only (`no-store`).

### 5.7 Contact (`/api/v1/contacts`)
- **Fields:** `name`, `country`, `phone`, `email`, `message`, `isRead` (default `false`), timestamps.
- **Endpoints:**
  - `POST /api/v1/contacts` — Public (rate-limited). Submit a contact inquiry.
  - `GET /api/v1/contacts` — Admin only. Paginated list of submissions (filterable by `isRead`).
  - `GET /api/v1/contacts/:id` — Admin only. View single contact submission.
  - `PATCH /api/v1/contacts/:id/read` — Admin only. Mark submission as read/unread.
  - `DELETE /api/v1/contacts/:id` — Admin only. Delete submission.

---

## 6. Security Plan

1. **HTTP-Only JWT Cookies:**
   - JWT signed with `JWT_SECRET` and expiry `JWT_EXPIRES_IN`.
   - Stored in cookie with `httpOnly: true`, `secure: config.nodeEnv === 'production'`, `sameSite: config.nodeEnv === 'production' ? 'none' : 'lax'` (or `'strict'` if same-site).
2. **Auth Middleware (`authGuard`):**
   - Extracts token from `req.cookies` (with optional `Authorization: Bearer` fallback only if explicitly desired, defaulting to cookie).
   - Verifies JWT signature & expiration, checks admin existence in DB, attaches `req.user`, or throws `401 AppError`.
3. **Rate Limiting (`express-rate-limit`):**
   - Strict limiter on `POST /api/v1/auth/login` (brute-force protection).
   - Limiter on `POST /api/v1/contacts` (spam protection).
4. **HTTP Headers & CORS:**
   - `helmet()` enabled globally for security headers.
   - `cors` configured with strict origin whitelist (`CLIENT_URL`, `ADMIN_URL`) and `credentials: true`.
5. **Input Sanitization & Payload Limits:**
   - `express.json({ limit: '1mb' })` prevents oversized JSON payloads.
   - Strict Zod schemas strip/reject unexpected fields and enforce string lengths, email format, and ObjectId format.
6. **Password Security:**
   - Admin passwords hashed with `bcryptjs` (salt rounds >= 12); password field excluded (`select: false`) from default Mongoose queries.

---

## 7. Image Management Plan (Cloudinary + Multer)

1. **Upload Pipeline:**
   - Use `multer` with `memoryStorage()` so files never touch local disk.
   - Enforce file size limit (e.g., max 5 MB) and MIME type whitelist (`image/jpeg`, `image/png`, `image/webp`).
2. **Storage Format:**
   - Persist `{ url: string, publicId: string }` subdocuments in MongoDB for Banner and Blog items.
3. **Auto-Optimization:**
   - Apply Cloudinary delivery transformations (`fetch_format: 'auto'`, `quality: 'auto'` -> `f_auto,q_auto`) when generating URLs or uploading presets.
4. **Lifecycle Cleanup:**
   - On item **update** with a new image: upload new image first, update document, and delete the previous `publicId` from Cloudinary (if DB save fails after upload, roll back by deleting the newly uploaded `publicId`).
   - On item **delete**: remove document from MongoDB and call `cloudinary.uploader.destroy(publicId)` to prevent orphaned cloud assets.

---

## 8. Performance Plan

1. **Lean Queries:** Use `.lean()` on all read-only Mongoose queries (`GET` endpoints) to skip Mongoose document hydration overhead.
2. **Database Indexes:** Add indexes on frequently queried/sorted fields (e.g., `createdAt: -1`, `isActive`, `isRead`, `email` unique index on Admin).
3. **Pagination:** Enforce server-side pagination (`page`, `limit` capped at max 50) and field projection where appropriate.
4. **HTTP Caching Headers:** Set `Cache-Control` headers (e.g., `public, max-age=60, stale-while-revalidate=300`) on public `GET` endpoints (`/banners`, `/blogs`, `/recruitments`), while keeping admin/auth/contact endpoints `no-store`.

---

## 9. Overall Project Roadmap

### Backend Server (`company-server`) — 4 Prompts (All Done)
| Prompt | Scope | Status | Key Deliverables |
| --- | --- | --- | --- |
| **Prompt 1** | **Foundation** | Done | `package.json`, TypeScript strict config, env Zod validation, `AppError` + error handlers, `globalErrorHandler`, `notFound`, `validateRequest`, `catchAsync`, `sendResponse`, `app.ts`, `server.ts`, health check `/api/v1/health`, empty module scaffolding, `PLAN.md`, `README.md`, Git remote setup. |
| **Prompt 2** | **Auth + Admin Seed + GitHub Push** | Done | Admin model & interface, `bcryptjs` password hashing, admin seeding from env, `auth` module (`login`, `logout`, `me`), HTTP-only JWT cookie helper, `auth` verification middleware, login rate limiter, `tsx` dev runner, initial GitHub push. |
| **Prompt 3** | **Cloudinary + Banner + Blog + Recruitment** | Done | Cloudinary config + upload/destroy helpers, `multer` memory-storage upload middleware (size/MIME limits), `banner` CRUD module, `blog` CRUD module (with Cloudinary lifecycle cleanup), `recruitment` CRUD module, `API.md`. |
| **Prompt 4** | **Contact + Security Hardening + Final Report** | Done | `contact` submission (with honeypot & rate limit) & admin management module, `GET /api/v1/admin/stats` dashboard module, NoSQL injection sanitizer, global API rate limiter, multi-origin CORS, production error sanitization, deployment docs. |

### Admin Frontend (`company-admin`, Next.js) — 4 Prompts
- **4 Prompts** covering admin dashboard foundation & auth integration, Banner & Blog management (with image uploads), Recruitment management, and Contact submissions inbox + final polish.

### Client Frontend (`company-client`, Next.js) — 6 Prompts
- **6 Prompts** covering public site foundation & layout, dynamic Banner/Hero, company portfolio sections, Blog listing & detail pages, Recruitment/Careers pages, and Contact Us form + SEO/performance polish.

