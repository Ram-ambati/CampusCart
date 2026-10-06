# CampusCart REST & WebSocket API Reference

This document provides complete documentation for the backend API endpoints, validation constraints, and real-time WebSocket messaging protocol implemented in the Spring Boot backend (`http://localhost:8080`).

---

## 🔑 Authentication, Authorization & Headers

### Headers
All protected endpoints require an HTTP `Authorization` header containing a valid JSON Web Token (JWT) issued upon successful Google OAuth2 authentication:

```http
Authorization: Bearer <your_jwt_token>
```

### Security & Access Control
* **Unauthenticated Requests (`401 Unauthorized`)**: Returned when a missing, expired, or invalid JWT is supplied on a protected endpoint.
* **Forbidden Operations (`403 Forbidden`)**:
  * Any non-admin student account attempting to access `/api/admin/*`.
  * A seller attempting to modify or delete another user's listing.
  * A student attempting to view or send chat messages in a session they are not part of.

---

## ⚠️ Standard Error Response Format

All validation failures, malformed input parameters, and business rule violations return a consistent JSON response with HTTP `400 Bad Request`:

```json
{
  "timestamp": "2026-10-07T00:30:00.123456",
  "status": 400,
  "error": "Validation Failed",
  "errors": {
    "title": "Title must be between 3 and 100 characters",
    "price": "Price must be at least ₹1",
    "phoneNumber": "Please provide a valid 10-digit mobile number"
  }
}
```

For single-message bad requests (e.g., business limit or missing parameter):
```json
{
  "timestamp": "2026-10-07T00:30:00.123456",
  "status": 400,
  "error": "Bad Request",
  "message": "Listings require between 3 and 5 images."
}
```

---

## 1. Authentication & Onboarding (`/api/auth`)

### `GET /api/auth/me`
Fetches the currently authenticated student's profile.

* **Headers**: `Authorization: Bearer <token>`
* **Response `200 OK`**:
```json
{
  "id": 1,
  "email": "student@anurag.edu.in",
  "name": "Jane Doe",
  "preferredName": "Jane",
  "avatarUrl": "https://lh3.googleusercontent.com/...",
  "branch": "CSE",
  "academicYear": "3rd Year",
  "phoneNumber": "+919876543210",
  "about": "Computer Science undergrad passionate about open source.",
  "onboardingCompleted": true,
  "role": "STUDENT",
  "banned": false,
  "createdAt": "2026-09-15T10:30:00"
}
```
* **Response `401 Unauthorized`**: If JWT is missing or invalid.

---

### `POST /api/auth/onboard`
Submits onboarding profile details for first-time users.

* **Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`
* **Request Validation Schema**:
  | Field | Type | Rules & Constraints | Error Message |
  | :--- | :--- | :--- | :--- |
  | `preferredName` | String | Required, 2–50 characters | `Preferred name must be between 2 and 50 characters` |
  | `phoneNumber` | String | Required, Indian 10-digit mobile (`^(\+91)?[6-9]\d{9}$`) | `Please provide a valid 10-digit mobile number` |
  | `branch` | String | Required, 2–50 characters | `Branch must be between 2 and 50 characters` |
  | `academicYear` | String | Required, 1–20 characters | `Academic year must be between 1 and 20 characters` |

* **Request Body Example**:
```json
{
  "preferredName": "Jane",
  "phoneNumber": "+919876543210",
  "branch": "CSE",
  "academicYear": "3rd Year"
}
```
* **Response `200 OK`**: Returns updated `User` object with `onboardingCompleted: true`.
* **Response `400 Bad Request`**: If validation fails or the user has already completed onboarding.

---

### `GET /api/auth/mobile-login`
Initiates Google OAuth2 login flow for Expo React Native mobile apps.

* **Query Parameters**:
  * `redirect_uri` *(string, required)*: Mobile deep link (e.g., `exp://...` or `campuscart://oauth/callback`).
* **Behavior**: Saves deep link in cookie and redirects to `/oauth2/authorization/google`.

---

## 2. Listings (`/api/listings`)

### `GET /api/listings`
Retrieves a paginated list of active listings with dynamic filtering.

* **Query Parameters**:
  * `q` *(string, optional)*: Keyword search query (matches title and description).
  * `minPrice` *(decimal, optional)*: Minimum price threshold in INR.
  * `maxPrice` *(decimal, optional)*: Maximum price threshold in INR.
  * `condition` *(string, optional)*: Filter by condition: `NEW`, `LIKE_NEW`, `GOOD`, `FAIR`, `POOR`.
  * `days` *(integer, optional)*: Recency filter in days (e.g., `1`, `7`, `30`).
  * `sortBy` *(string, default: `newest`)*: Options: `newest`, `oldest`, `price_asc`, `price_desc`.
  * `page` *(int, default: 0)*: Zero-based page number.
  * `size` *(int, default: 12)*: Page chunk size.
* **Response `200 OK`**: Spring Data `Page<Listing>`:
```json
{
  "content": [
    {
      "id": 42,
      "title": "Engineering Physics 1st Year Textbook",
      "description": "Mint condition with handwritten notes.",
      "price": 350.00,
      "itemCondition": "LIKE_NEW",
      "category": "TEXTBOOKS",
      "status": "ACTIVE",
      "seller": {
        "id": 1,
        "name": "Jane Doe",
        "email": "student@anurag.edu.in",
        "avatarUrl": "https://..."
      },
      "images": [
        {
          "id": 101,
          "imageUrl": "https://res.cloudinary.com/.../img1.jpg",
          "cloudinaryPublicId": "img1"
        }
      ],
      "createdAt": "2026-10-01T14:22:10"
    }
  ],
  "totalPages": 3,
  "totalElements": 34,
  "last": false
}
```

---

### `GET /api/listings/category/{category}`
Filters active listings by category.
* **Path Variables**:
  * `category` *(required)*: Enum value: `TEXTBOOKS`, `ELECTRONICS`, `FURNITURE`, `TICKETS`, `CLOTHING`, `OTHER`.
* **Query Parameters**: Same search, range, and sort parameters as `GET /api/listings`.

---

### `POST /api/listings`
Creates a new listing with multi-image Cloudinary upload.

* **Headers**: `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`
* **Form-Data Parts**:
  * `listing`: JSON string matching `ListingRequest` validation schema:
    | Field | Type | Rules & Constraints | Error Message |
    | :--- | :--- | :--- | :--- |
    | `title` | String | Required, 3–100 characters | `Title must be between 3 and 100 characters` |
    | `description` | String | Required, 10–2000 characters | `Description must be between 10 and 2000 characters` |
    | `price` | BigDecimal | Required, min ₹1.00, max ₹10,00,000.00 | `Price must be at least ₹1` / `Price cannot exceed ₹10,00,000` |
    | `itemCondition` | String | Required, enum: `NEW`, `LIKE_NEW`, `GOOD`, `FAIR`, `POOR` | `Condition must be NEW, LIKE_NEW, GOOD, FAIR, or POOR` |
    | `category` | Enum | Required: `TEXTBOOKS`, `ELECTRONICS`, `FURNITURE`, `TICKETS`, `CLOTHING`, `OTHER` | `Category is required` |
  * `images`: **3 to 5** `MultipartFile` binary attachments.
    * Files must not be empty.
    * MIME type must match `image/*`.
* **Listing JSON Payload Example**:
```json
{
  "title": "TI-84 Plus Graphing Calculator",
  "description": "Working perfectly with fresh batteries.",
  "price": 1200.00,
  "itemCondition": "GOOD",
  "category": "ELECTRONICS"
}
```
* **Response `200 OK`**: Created `Listing` with uploaded images and status `PENDING`.
* **Response `400 Bad Request`**: If payload constraints fail or if fewer than 3 or more than 5 images are provided.

---

### `GET /api/listings/{id}`
Returns details of a specific listing.

* **Response `200 OK`**: Complete `Listing` object.
* **Response `404 Not Found`**: If no listing exists with the given ID.

---

### `GET /api/listings/seller/{sellerId}`
Returns all listings created by a specific seller (used in public profile views).

---

### `PATCH /api/listings/{id}/status`
Updates listing status (`ACTIVE`, `PENDING`, `SOLD`).

* **Query Parameters**: `status` *(string, required)*.
* **Security & Business Rules**:
  * Only the listing owner can update status (`403 Forbidden` otherwise).
  * Sellers **cannot** bypass admin approval from `PENDING` to `ACTIVE` (`400 Bad Request`).

---

### `DELETE /api/listings/{id}`
Soft-deletes a listing (sets status to `DELETED`). Restricted to the listing owner (`403 Forbidden` if attempted by non-owner).

---

## 3. Real-Time Chat & Messaging (`/api/chat` & WebSockets)

### `POST /api/chat/session`
Initializes or retrieves an existing chat thread between the buyer and seller for a listing.

* **Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`
* **Request Validation Schema**:
  * `listingId`: Positive Long, required.
* **Request Body**:
```json
{
  "listingId": 42
}
```
* **Security & Business Rules**:
  * Users cannot start a chat thread with themselves for their own listings (`400 Bad Request: Cannot chat with yourself`).
* **Response `200 OK`**:
```json
{
  "id": 18,
  "listing": { "id": 42, "title": "Engineering Physics..." },
  "buyer": { "id": 5, "name": "Alex" },
  "seller": { "id": 1, "name": "Jane Doe" },
  "createdAt": "2026-10-05T09:00:00"
}
```

---

### `GET /api/chat/sessions`
Returns all active conversations involving the authenticated user (for the Inbox sidebar).

---

### `GET /api/chat/session/{sessionId}/messages`
Retrieves complete historical message transcript for a session.

* **Security**: Only participants (buyer or seller) in the session can view messages (`403 Forbidden` otherwise).
* **Response `200 OK`**: List of message objects.

---

### 🌐 STOMP WebSocket Protocol

* **Connection Handshake Endpoint**: `/ws` (supports SockJS fallback).
* **Outgoing Destination**: `/app/chat`
* **Incoming Payload Schema (`ChatMessageRequest`)**:
  | Field | Type | Rules & Constraints | Error Message |
  | :--- | :--- | :--- | :--- |
  | `sessionId` | Long | Required, positive ID | `Session ID must be positive` |
  | `content` | String | Required, 1–1000 characters (auto-trimmed) | `Message must be between 1 and 1000 characters` |

```json
{
  "sessionId": 18,
  "content": "Can you meet at the library cafeteria at 4 PM?"
}
```

* **Subscription Channel**: `/topic/session/{sessionId}`
* **Enforced Business Rules**:
  * **Spam Prevention**: Max 4 consecutive unreplied messages from one participant (`400 Bad Request: Spam prevention: You can only send 4 consecutive messages`).
  * **Negotiation Cap**: Max 100 messages total per session (`400 Bad Request: Negotiation limit reached: A maximum of 100 messages are allowed per product`).

---

## 4. Wishlist / Favorites (`/api/wishlist`)

| Method | Endpoint | Description | Status Codes |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/wishlist/{listingId}` | Adds listing to student's saved items | `200 OK`, `400 Bad Request` (invalid ID), `404 Not Found` |
| `DELETE` | `/api/wishlist/{listingId}` | Removes listing from student's saved items | `200 OK`, `400 Bad Request` (invalid ID), `404 Not Found` |
| `GET` | `/api/wishlist` | Returns full list of saved `Listing` objects | `200 OK`, `401 Unauthorized` |
| `GET` | `/api/wishlist/ids` | Returns array of saved listing IDs `[42, 58, 91]` | `200 OK`, `401 Unauthorized` |

---

## 5. Trust & Safety Reporting (`/api/reports`)

### `POST /api/reports`
Flags an item or user for administrator moderation.

* **Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`
* **Request Validation Schema**:
  | Field | Type | Rules & Constraints | Error Message |
  | :--- | :--- | :--- | :--- |
  | `targetType` | String | Required, must match `^(LISTING\|USER)$` | `Target type must be either LISTING or USER` |
  | `targetId` | Long | Required, positive ID | `Target ID must be positive` |
  | `reason` | String | Required, 3–500 characters | `Reason must be between 3 and 500 characters` |

* **Request Body Example**:
```json
{
  "targetType": "LISTING",
  "targetId": 42,
  "reason": "FRAUD: Item shown is not genuine textbook."
}
```
* **Supported Reason Tags**: `SPAM`, `FRAUD`, `PROHIBITED`, `OFFENSIVE`, `OTHER`.
* **Response `200 OK`**: Created `Report` record with status `PENDING`.
* **Response `400 Bad Request`**: If validation fails.

---

## 6. User Profile Management (`/api/users`)

### `GET /api/users/{id}`
Returns public user details (name, preferred name, avatar, branch, academic year, about).

* **Response `200 OK`**: `User` object.
* **Response `404 Not Found`**: If user does not exist.

---

### `PUT /api/users/me/about`
Updates authenticated student's "About" / biography description.

* **Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`
* **Request Body**:
```json
{
  "about": "ECE Senior interested in embedded systems and robotics."
}
```
* **Validation Rules**:
  * `about`: Max 500 characters (whitespace trimmed).
* **Response `200 OK`**: Updated `User` object.
* **Response `400 Bad Request`**: If bio exceeds 500 characters (`About section cannot exceed 500 characters`).

---

## 7. Moderation & Admin Portal (`/api/admin`)

*All administrative endpoints require an authenticated user with `role: ADMIN`. Non-admins receive `403 Forbidden`.*

### `GET /api/admin/reports`
Returns all submitted reports across the platform.

---

### `PUT /api/admin/reports/{id}`
Updates report resolution status.

* **Query Parameters**:
  * `status` *(string, required)*: Must strictly be `RESOLVED` or `DISMISSED` (`400 Bad Request` otherwise).
* **Automated Moderation**:
  * If `status == "RESOLVED"` and `targetType == "LISTING"`, the offending listing is automatically soft-deleted (`status = DELETED`).

---

### `GET /api/admin/users`
Returns all registered user profiles.

---

### `PUT /api/admin/users/{id}/ban`
Toggles user's banned state (`banned: true / false`).

---

### `GET /api/admin/listings/pending`
Returns all listings waiting for moderator approval (`status: PENDING`).

---

### `PUT /api/admin/listings/{id}/approve`
Approves listing, updating its status to `ACTIVE`.

---

### `PUT /api/admin/listings/{id}/reject`
Rejects listing, updating its status to `DELETED`.

---

## 8. Health & Heartbeat (`/api/health`)

Used by Railway health checks, load balancers, and external uptime monitors to keep the backend warm and prevent the database (e.g., Supabase free tier) from pausing.

### `GET /api/health`
Performs an active database ping and updates the `heartbeat` table.

* **Authentication**: None required (public).
* **Automated Scheduler**: An internal Spring task automatically pings every 10 minutes to maintain DB pool connectivity.
* **Response `200 OK`**:
```json
{
  "status": "UP",
  "database": "CONNECTED",
  "lastPingAt": "2026-10-07T01:15:00",
  "pingCount": 42,
  "serverTime": "2026-10-07T01:15:00.123456"
}
```
