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

Images accept **JPEG, PNG, or WebP** up to **5 MB** under field name `image`.

### `GET /api/v1/banners`
- **Auth:** Public (`Cache-Control: public, max-age=60, stale-while-revalidate=300`)
- **Behavior:** Returns only active banners (`isActive: true`), sorted by `order` ascending.
- **Success (`200 OK`):**
```json
{
  "success": true,
  "message": "Active banners retrieved successfully",
  "data": [
    {
      "_id": "66f1a2b3c4d5e6f7a8b9c0d2",
      "title": "Building the Future",
      "subtitle": "Enterprise software solutions",
      "image": {
        "url": "https://res.cloudinary.com/.../banner.webp",
        "publicId": "company-portfolio/banners/abc123"
      },
      "ctaText": "Contact Us",
      "ctaLink": "/contact",
      "order": 1,
      "isActive": true,
      "createdAt": "2026-11-25T10:00:00.000Z",
      "updatedAt": "2026-11-25T10:00:00.000Z"
    }
  ]
}
```

### `GET /api/v1/banners/admin/all`
- **Auth:** Admin (`Cache-Control: no-store`)
- **Behavior:** Returns all banners (active and inactive), sorted by `order` ascending.
- **Success (`200 OK`):** Same item shape as `GET /api/v1/banners`.

### `POST /api/v1/banners`
- **Auth:** Admin
- **Content-Type:** `multipart/form-data`
- **Fields:**
  - `image` (file, **required**): JPEG/PNG/WebP, max 5MB
  - `title` (string, **required**, max 200)
  - `subtitle` (string, optional, max 500)
  - `ctaText` (string, optional, max 100)
  - `ctaLink` (string, optional, max 500)
  - `order` (integer string, optional, default `0`)
  - `isActive` (`"true"` | `"false"`, optional, default `true`)
- **Success (`201 Created`):** Returns created banner object.
- **Errors:** `400` (missing/invalid image or fields), `401` (unauthenticated), `503` (Cloudinary not configured).

### `PATCH /api/v1/banners/:id`
- **Auth:** Admin
- **Content-Type:** `multipart/form-data`
- **Params:** `id` (24-char hex Mongo ObjectId)
- **Fields:** All fields optional (`image` optional; if provided, replaces old Cloudinary image).
- **Success (`200 OK`):** Returns updated banner object.
- **Errors:** `400` (invalid ID/fields/file), `401`, `404` (banner not found).

### `DELETE /api/v1/banners/:id`
- **Auth:** Admin
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
