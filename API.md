# Company Portfolio API Documentation

Base URL: `http://localhost:5000/api/v1` (replace host in production).

---

## Authentication & Cookie Behavior

- Admin authentication uses a signed JWT stored in an **HTTP-only cookie** named `accessToken`.
- Tokens are **never** read from `Authorization` headers or `localStorage`.
- **Frontend requirement:** All authenticated requests (including login, logout, and admin CRUD endpoints) **must** include `credentials: 'include'` (Fetch API) or `withCredentials: true` (Axios) so the browser stores and sends the `accessToken` cookie cross-origin.
- Cookie attributes:
  - `HttpOnly: true`
  - `Secure: true` in `production` (`false` in `development`)
  - `SameSite: 'none'` in `production` (supports separate client/admin domains), `'lax'` in `development`
  - `Path: '/'`
  - `Max-Age`: matches `JWT_EXPIRES_IN` (default `7d`)

## Standard Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Human-readable message",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  },
  "data": {}
}
```
*(Note: `meta` is only present on paginated list endpoints.)*

### Error Response
```json
{
  "success": false,
  "message": "Validation Error",
  "errorSources": [
    {
      "path": "title",
      "message": "Title is required"
    }
  ]
}
```
*(In `development`, a `stack` field is also included.)*

## Caching Headers
- **Public `GET` endpoints:** `Cache-Control: public, max-age=60, stale-while-revalidate=300`
- **Admin endpoints:** `Cache-Control: no-store`

---

## 1. Health

### `GET /api/v1/health`
- **Auth:** Public
- **Success (`200 OK`):**
```json
{
  "success": true,
  "message": "Server is running smoothly",
  "data": {
    "status": "ok",
    "environment": "development",
    "uptime": 12.34,
    "timestamp": "2026-11-25T10:00:00.000Z",
    "database": "connected"
  }
}
```

---

## 2. Auth (`/api/v1/auth`)

### `POST /api/v1/auth/login`
- **Auth:** Public (Rate limited: max 5 attempts per 15 minutes per IP)
- **Content-Type:** `application/json`
- **Body:**
```json
{
  "email": "admin@example.com",
  "password": "your-password"
}
```
- **Success (`200 OK`):** Sets `accessToken` HTTP-only cookie.
```json
{
  "success": true,
  "message": "Logged in successfully",
  "data": {
    "_id": "66f1a2b3c4d5e6f7a8b9c0d1",
    "email": "admin@example.com",
    "name": "Admin",
    "role": "admin",
    "createdAt": "2026-11-25T10:00:00.000Z",
    "updatedAt": "2026-11-25T10:00:00.000Z"
  }
}
```
- **Errors:**
  - `400 Bad Request`: Zod validation failure
  - `401 Unauthorized`: `{ "success": false, "message": "Invalid email or password", "errorSources": [{ "path": "", "message": "Invalid email or password" }] }`
  - `429 Too Many Requests`: Rate limit exceeded

### `POST /api/v1/auth/logout`
- **Auth:** Public / Authenticated
- **Success (`200 OK`):** Clears `accessToken` cookie.
```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": null
}
```

### `GET /api/v1/auth/me`
- **Auth:** Admin (`accessToken` cookie required)
- **Success (`200 OK`):**
```json
{
  "success": true,
  "message": "Admin profile retrieved successfully",
  "data": {
    "_id": "66f1a2b3c4d5e6f7a8b9c0d1",
    "email": "admin@example.com",
    "name": "Admin",
    "role": "admin",
    "createdAt": "2026-11-25T10:00:00.000Z",
    "updatedAt": "2026-11-25T10:00:00.000Z"
  }
}
```
- **Error (`401 Unauthorized`):** Missing, invalid, or expired cookie.

---

## 3. Banners (`/api/v1/banners`)

Banners are **image-only** (no title, subtitle, or CTA text overlay on the client frontend). Images accept **JPEG, PNG, or WebP** up to **5 MB** under field name `image`. Unknown fields sent in requests are stripped by Zod.

### `GET /api/v1/banners`
- **Auth:** Public (`Cache-Control: public, max-age=60, stale-while-revalidate=300`)
- **Behavior:** Returns only active banners (`isActive: true`), sorted by `order` ascending, selecting only `_id`, `image.url`, and `order`.
- **Success (`200 OK`):**
```json
{
  "success": true,
  "message": "Active banners retrieved successfully",
  "data": [
    {
      "_id": "66f1a2b3c4d5e6f7a8b9c0d2",
      "image": {
        "url": "https://res.cloudinary.com/.../banner.webp"
      },
      "order": 1
    }
  ]
}
```

### `GET /api/v1/banners/admin/all`
- **Auth:** Admin (`Cache-Control: no-store`)
- **Behavior:** Returns all banners (active and inactive), sorted by `order` ascending, including `image.publicId`, `isActive`, and timestamps.
- **Success (`200 OK`):**
```json
{
  "success": true,
  "message": "All banners retrieved successfully",
  "data": [
    {
      "_id": "66f1a2b3c4d5e6f7a8b9c0d2",
      "image": {
        "url": "https://res.cloudinary.com/.../banner.webp",
        "publicId": "company-portfolio/banners/abc123"
      },
      "order": 1,
      "isActive": true,
      "createdAt": "2026-11-25T10:00:00.000Z",
      "updatedAt": "2026-11-25T10:00:00.000Z"
    }
  ]
}
```

### `POST /api/v1/banners`
- **Auth:** Admin (`Cache-Control: no-store`)
- **Content-Type:** `multipart/form-data`
- **Fields:**
  - `image` (file, **required**): JPEG/PNG/WebP, max 5MB
  - `order` (integer string, optional, default `0`)
  - `isActive` (`"true"` | `"false"`, optional, default `true`)
- **Success (`201 Created`):** Returns created banner object.
- **Errors:** `400` (missing/invalid image or fields), `401` (unauthenticated), `503` (Cloudinary not configured).

### `PATCH /api/v1/banners/:id`
- **Auth:** Admin (`Cache-Control: no-store`)
- **Content-Type:** `multipart/form-data`
- **Params:** `id` (24-char hex Mongo ObjectId)
- **Fields:** `image` (optional; if provided, replaces old Cloudinary image), `order` (optional), `isActive` (optional).
- **Success (`200 OK`):** Returns updated banner object.
- **Errors:** `400` (invalid ID/fields/file), `401`, `404` (banner not found).

### `DELETE /api/v1/banners/:id`
- **Auth:** Admin (`Cache-Control: no-store`)
- **Params:** `id` (24-char hex Mongo ObjectId)
- **Behavior:** Deletes banner from MongoDB and removes its image from Cloudinary.
- **Success (`200 OK`):** Returns deleted banner object.
- **Errors:** `400` (invalid ID), `401`, `404` (banner not found).

---

## 4. Blogs (`/api/v1/blogs`)

Images accept **JPEG, PNG, or WebP** up to **5 MB** under field name `image`.

### `GET /api/v1/blogs`
- **Auth:** Public (`Cache-Control: public, max-age=60, stale-while-revalidate=300`)
- **Query Params:**
  - `page` (optional, default `1`, min `1`)
  - `limit` (optional, default `10`, min `1`, max `50`)
  - `search` (optional, case-insensitive title search)
- **Success (`200 OK`):**
```json
{
  "success": true,
  "message": "Blogs retrieved successfully",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  },
  "data": [
    {
      "_id": "66f1a2b3c4d5e6f7a8b9c0d3",
      "title": "Engineering at Scale",
      "description": "Full blog content...",
      "image": {
        "url": "https://res.cloudinary.com/.../blog.webp",
        "publicId": "company-portfolio/blogs/xyz789"
      },
      "createdAt": "2026-11-25T10:00:00.000Z",
      "updatedAt": "2026-11-25T10:00:00.000Z"
    }
  ]
}
```

### `GET /api/v1/blogs/admin/all`
- **Auth:** Admin (`Cache-Control: no-store`)
- **Query Params:** Same `page`, `limit`, and `search` as `GET /api/v1/blogs`. Used by the admin dashboard so newly created/edited/deleted blogs appear immediately without browser caching.
- **Success (`200 OK`):** Same paginated response shape as `GET /api/v1/blogs`.

### `GET /api/v1/blogs/admin/:id`
- **Auth:** Admin (`Cache-Control: no-store`)
- **Params:** `id` (Mongo ObjectId)
- **Success (`200 OK`):** Returns single blog object without caching.

### `GET /api/v1/blogs/:id`
- **Auth:** Public
- **Params:** `id` (Mongo ObjectId)
- **Success (`200 OK`):** Returns single blog object.
- **Errors:** `400` (invalid ID), `404` (blog post not found).

### `POST /api/v1/blogs`
- **Auth:** Admin
- **Content-Type:** `multipart/form-data`
- **Fields:** `image` (file, **required**), `title` (string, **required**, max 300), `description` (string, **required**).
- **Success (`201 Created`):** Returns created blog object.

### `PATCH /api/v1/blogs/:id`
- **Auth:** Admin
- **Content-Type:** `multipart/form-data`
- **Fields:** `title`, `description`, `image` (all optional; replacing `image` deletes old Cloudinary asset).
- **Success (`200 OK`):** Returns updated blog object.

### `DELETE /api/v1/blogs/:id`
- **Auth:** Admin
- **Behavior:** Deletes blog from MongoDB and removes its image from Cloudinary.
- **Success (`200 OK`):** Returns deleted blog object.

---

## 5. Recruitments (`/api/v1/recruitments`)

### `GET /api/v1/recruitments`
- **Auth:** Public (`Cache-Control: public, max-age=60, stale-while-revalidate=300`)
- **Query Params:** `page` (default `1`), `limit` (default `10`, max `50`)
- **Behavior:** Returns only active recruitment posts (`isActive: true`), newest first.
- **Success (`200 OK`):**
```json
{
  "success": true,
  "message": "Active recruitment posts retrieved successfully",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  },
  "data": [
    {
      "_id": "66f1a2b3c4d5e6f7a8b9c0d4",
      "title": "Senior Backend Engineer",
      "description": "Role details and requirements...",
      "isActive": true,
      "createdAt": "2026-11-25T10:00:00.000Z",
      "updatedAt": "2026-11-25T10:00:00.000Z"
    }
  ]
}
```

### `GET /api/v1/recruitments/admin/all`
- **Auth:** Admin (`Cache-Control: no-store`)
- **Query Params:** `page` (default `1`), `limit` (default `10`, max `50`)
- **Behavior:** Returns all recruitment posts (active and inactive), newest first.

### `GET /api/v1/recruitments/:id`
- **Auth:** Public
- **Params:** `id` (Mongo ObjectId)
- **Success (`200 OK`):** Returns single recruitment post.
- **Errors:** `400` (invalid ID), `404` (recruitment post not found).

### `POST /api/v1/recruitments`
- **Auth:** Admin
- **Content-Type:** `application/json`
- **Body:**
```json
{
  "title": "Senior Backend Engineer",
  "description": "Role details and requirements...",
  "isActive": true
}
```
- **Success (`201 Created`):** Returns created recruitment post.

### `PATCH /api/v1/recruitments/:id`
- **Auth:** Admin
- **Content-Type:** `application/json`
- **Body:** `{ "title"?: string, "description"?: string, "isActive"?: boolean }`
- **Success (`200 OK`):** Returns updated recruitment post.

### `DELETE /api/v1/recruitments/:id`
- **Auth:** Admin
- **Success (`200 OK`):** Returns deleted recruitment post.



---

## 6. Contacts (`/api/v1/contacts`)

### `POST /api/v1/contacts`
- **Auth:** Public (`Cache-Control: no-store`)
- **Rate Limit:** Max **5 submissions per hour per IP** (returns `429 Too Many Requests` in standard error format).
- **Content-Type:** `application/json`
- **Honeypot:** Includes an optional hidden field `website`. If populated, the API returns `201 Created` (`data: null`) without saving anything to MongoDB. Unknown fields (e.g., `isRead`, `_id`, `role`) are stripped by Zod.
- **Body:**
```json
{
  "name": "Jane Doe",
  "country": "United States",
  "phone": "+1 (555) 123-4567",
  "email": "jane@example.com",
  "message": "Hello, we would like to discuss a potential project.",
  "website": ""
}
```
- **Success (`201 Created`):**
```json
{
  "success": true,
  "message": "Thank you for contacting us. We will get back to you soon.",
  "data": {
    "_id": "66f1a2b3c4d5e6f7a8b9c0d5",
    "name": "Jane Doe",
    "country": "United States",
    "createdAt": "2026-11-25T10:00:00.000Z"
  }
}
```
- **Errors:** `400 Bad Request` (validation failure or NoSQL operator keys), `429 Too Many Requests` (rate limit exceeded).

### `GET /api/v1/contacts`
- **Auth:** Admin (`Cache-Control: no-store`)
- **Query Params:**
  - `page` (default `1`, min `1`)
  - `limit` (default `10`, min `1`, max `50`)
  - `isRead` (optional: `true` | `false`)
  - `search` (optional: case-insensitive search on `name` or `email`)
- **Success (`200 OK`):**
```json
{
  "success": true,
  "message": "Contact submissions retrieved successfully",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  },
  "data": [
    {
      "_id": "66f1a2b3c4d5e6f7a8b9c0d5",
      "name": "Jane Doe",
      "country": "United States",
      "phone": "+1 (555) 123-4567",
      "email": "jane@example.com",
      "message": "Hello, we would like to discuss a potential project.",
      "isRead": false,
      "createdAt": "2026-11-25T10:00:00.000Z",
      "updatedAt": "2026-11-25T10:00:00.000Z"
    }
  ]
}
```

### `GET /api/v1/contacts/:id`
- **Auth:** Admin (`Cache-Control: no-store`)
- **Params:** `id` (Mongo ObjectId)
- **Success (`200 OK`):** Returns single contact submission.
- **Errors:** `400` (invalid ID), `401`, `404` (not found).

### `PATCH /api/v1/contacts/:id/read`
- **Auth:** Admin (`Cache-Control: no-store`)
- **Params:** `id` (Mongo ObjectId)
- **Content-Type:** `application/json`
- **Body:** `{ "isRead": true }` (optional; defaults to `true`)
- **Success (`200 OK`):** Returns updated contact submission.

### `DELETE /api/v1/contacts/:id`
- **Auth:** Admin (`Cache-Control: no-store`)
- **Params:** `id` (Mongo ObjectId)
- **Success (`200 OK`):** Returns deleted contact submission.

---

## 7. Admin Dashboard Stats (`/api/v1/admin/stats`)

### `GET /api/v1/admin/stats`
- **Auth:** Admin (`Cache-Control: no-store`)
- **Success (`200 OK`):**
```json
{
  "success": true,
  "message": "Admin dashboard stats retrieved successfully",
  "data": {
    "counts": {
      "banners": 3,
      "blogs": 12,
      "networks": 4,
      "recruitments": 4,
      "contacts": 18,
      "unreadContacts": 5
    },
    "recentContacts": [
      {
        "id": "66f1a2b3c4d5e6f7a8b9c0d5",
        "name": "Jane Doe",
        "email": "jane@example.com",
        "country": "United States",
        "createdAt": "2026-11-25T10:00:00.000Z",
        "isRead": false
      }
    ]
  }
}
```
- **Error (`401 Unauthorized`):** Missing, invalid, or expired `accessToken` cookie.


---

## 8. Networks (`/api/v1/networks`)

Partner organizations / networks the company works with. Images accept **JPEG, PNG, or WebP** up to **5 MB** under field name `image` (stored in Cloudinary folder `company-portfolio/networks`).
- `externalUrl` is optional (max 500 chars) and **must** use `http://` or `https://` protocol only (`javascript:`, `data:`, `ftp:`, and malformed URLs return `400`). Sending an empty string `""` on `POST` omits the field; sending `""` on `PATCH` clears any existing `externalUrl`.

### `GET /api/v1/networks`
- **Auth:** Public (`Cache-Control: public, max-age=60, stale-while-revalidate=300`)
- **Query Params:** `page` (default `1`, min `1`), `limit` (default `10`, min `1`, max `50`), `search` (optional case-insensitive title search)
- **Success (`200 OK`):**
```json
{
  "success": true,
  "message": "Networks retrieved successfully",
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  },
  "data": [
    {
      "_id": "66f1a2b3c4d5e6f7a8b9c0d6",
      "title": "The Confagricoltura Network",
      "description": "Agricultural association partner...",
      "image": {
        "url": "https://res.cloudinary.com/.../network.webp",
        "publicId": "company-portfolio/networks/net123"
      },
      "externalUrl": "https://www.confagricoltura.it",
      "createdAt": "2026-11-26T10:00:00.000Z",
      "updatedAt": "2026-11-26T10:00:00.000Z"
    }
  ]
}
```

### `GET /api/v1/networks/admin/all`
- **Auth:** Admin (`Cache-Control: no-store`)
- **Query Params:** Same `page`, `limit`, and `search` as `GET /api/v1/networks`.

### `GET /api/v1/networks/admin/:id`
- **Auth:** Admin (`Cache-Control: no-store`)
- **Params:** `id` (Mongo ObjectId)

### `GET /api/v1/networks/:id`
- **Auth:** Public (`Cache-Control: public, max-age=60, stale-while-revalidate=300`)
- **Params:** `id` (Mongo ObjectId)
- **Errors:** `400` (invalid ID), `404` (network item not found).

### `POST /api/v1/networks`
- **Auth:** Admin (`Cache-Control: no-store`)
- **Content-Type:** `multipart/form-data`
- **Fields:** `image` (file, **required**), `title` (string, **required**, max 200), `description` (string, **required**, 10–5000 chars), `externalUrl` (optional `http`/`https` URL, max 500).
- **Success (`201 Created`):** Returns created network item.

### `PATCH /api/v1/networks/:id`
- **Auth:** Admin (`Cache-Control: no-store`)
- **Content-Type:** `multipart/form-data`
- **Fields:** `title`, `description`, `externalUrl` (send `""` to clear), `image` (optional; replacing `image` deletes old Cloudinary asset).
- **Success (`200 OK`):** Returns updated network item.

### `DELETE /api/v1/networks/:id`
- **Auth:** Admin (`Cache-Control: no-store`)
- **Behavior:** Deletes network item from MongoDB and removes its image from Cloudinary.
- **Success (`200 OK`):** Returns deleted network item.

---

## 9. Applications (`/api/v1/applications`)

Tracks job applications submitted via email outside the system. Admins create records with a unique `serialNumber` and share it with applicants; applicants can check their status publicly without authentication.

- **Fields:**
  - `serialNumber`: required, unique, trimmed, stored UPPERCASE, 5–30 chars matching `/^[A-Z0-9][A-Z0-9-]{4,29}$/`.
  - `name`: required, trimmed, 2–100 chars.
  - `email`: required, lowercase, valid email, max 254 chars.
  - `phone`: required, trimmed, 6–20 chars, digits/spaces/`+`/`-`/`()`.
  - `status`: `"pending"` | `"approved"` | `"rejected"` (default `"pending"`).
  - `note` (optional, max 1000), `passportNumber` (optional, max 30, letters/digits/spaces/hyphens), `visaStatus` (optional, max 100). Sending `""` on `POST` omits the field; sending `""` on `PATCH` clears it via `$unset`.

### `POST /api/v1/applications/check`
- **Auth:** Public (`Cache-Control: no-store`)
- **Rate Limit:** Max **15 checks per 15 minutes per IP** (returns `429 Too Many Requests` in standard error shape), in addition to the global limiter. Uses `POST` so serial numbers never appear in URLs or access logs.
- **Body:** `{ "serialNumber": "APP-7K9M2P4X" }` (trimmed and uppercased before validation).
- **Privacy Rule:** Uses a strict projection and returns **only** `{ serialNumber, status, maskedName, note, updatedAt }` (`note` is `null` when not set). `maskedName` keeps the first 2 characters of each word followed by `***` (for 1–2 char words, keeps the first character + `***`; e.g., `"Shuvo Kumar"` → `"Sh*** Ku***"`). Because `note` is publicly visible to anyone who knows the serial number, admins must not put personal or sensitive details in `note`. Never returns `email`, `phone`, `passportNumber`, `visaStatus`, `_id`, or `createdAt`.
- **Success (`200 OK`):**
```json
{
  "success": true,
  "message": "Application status retrieved successfully",
  "data": {
    "serialNumber": "APP-7K9M2P4X",
    "status": "pending",
    "maskedName": "Sh*** Ku***",
    "note": "Please wait for our HR team to contact you for the next step.",
    "updatedAt": "2026-11-28T10:00:00.000Z"
  }
}
```
- **Errors:** `400` (malformed serial number or NoSQL operator keys), `404` (`"No application found for this serial number"`), `429` (rate limit exceeded).

### `GET /api/v1/applications/admin/all`
- **Auth:** Admin (`Cache-Control: no-store`)
- **Query Params:** `page` (default `1`), `limit` (default `10`, max `50`), `status` (optional: `pending` | `approved` | `rejected`), `search` (optional case-insensitive escaped regex across `serialNumber`, `name`, `email`, `phone`). Sorted newest first (`createdAt: -1`).
- **Success (`200 OK`):** Standard paginated response with `meta` and full admin application fields.

### `GET /api/v1/applications/admin/:id`
- **Auth:** Admin (`Cache-Control: no-store`)
- **Params:** `id` (24-char hex Mongo ObjectId)
- **Errors:** `400` (invalid ID), `401`, `404` (not found).

### `POST /api/v1/applications`
- **Auth:** Admin (`Cache-Control: no-store`)
- **Content-Type:** `application/json`
- **Success (`201 Created`):** Returns created application.
- **Errors:** `400` (validation failure), `401`, `409` (`"This serial number already exists"`).

### `PATCH /api/v1/applications/:id`
- **Auth:** Admin (`Cache-Control: no-store`)
- **Content-Type:** `application/json`
- **Body:** Any subset of application fields (`""` clears optional `note`, `passportNumber`, or `visaStatus`).
- **Success (`200 OK`):** Returns updated application.
- **Errors:** `400`, `401`, `404`, `409` (duplicate `serialNumber`).

### `DELETE /api/v1/applications/:id`
- **Auth:** Admin (`Cache-Control: no-store`)
- **Success (`200 OK`):** Returns deleted application.
- **Errors:** `400`, `401`, `404`.
