# CampusCart REST & WebSocket API Reference

This document provides complete documentation for the backend API endpoints and real-time WebSocket messaging protocol implemented in the Spring Boot backend (`http://localhost:8080`).

---

## 🔑 Authentication & Headers

All protected endpoints require an HTTP `Authorization` header containing a valid JSON Web Token (JWT) issued upon successful Google OAuth2 authentication:

```http
Authorization: Bearer <your_jwt_token>
```

Unauthenticated requests to protected endpoints return `401 Unauthorized`. Requests by non-administrators to `/api/admin/*` return `403 Forbidden`.

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
  "onboardingCompleted": true,
  "role": "STUDENT",
  "banned": false,
  "createdAt": "2026-09-15T10:30:00"
}
```

---

### `POST /api/auth/onboard`
Submits onboarding details for first-time users.

* **Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`
* **Request Body**:
```json
{
  "preferredName": "Jane",
  "phoneNumber": "+919876543210",
  "branch": "CSE",
  "academicYear": "3rd Year"
}
```
* **Response `200 OK`**: Returns updated `User` object with `onboardingCompleted: true`.
* **Response `400 Bad Request`**: If already onboarded or invalid inputs.

---

### `GET /api/auth/mobile-login`
Initiates Google OAuth2 login flow for Expo React Native mobile apps.

* **Query Parameters**:
  * `redirect_uri` *(string, required)*: Mobile deep link (e.g. `exp://...` or `campuscart://oauth/callback`).
* **Behavior**: Saves deep link in cookie and redirects to `/oauth2/authorization/google`.

---

## 2. Listings (`/api/listings`)

### `GET /api/listings`
Retrieves a paginated list of active listings with dynamic filtering.

* **Query Parameters**:
  * `q` *(string, optional)*: Keyword query for title and description.
  * `minPrice` *(decimal, optional)*: Minimum price threshold in INR.
  * `maxPrice` *(decimal, optional)*: Maximum price threshold in INR.
  * `condition` *(string, optional)*: `Like New`, `Good`, or `Fair`.
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
      "itemCondition": "Like New",
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
Filters active listings by category. Valid categories: `TEXTBOOKS`, `ELECTRONICS`, `FURNITURE`, `TICKETS`, `CLOTHING`, `OTHER`.

---

### `POST /api/listings`
Creates a new listing with multi-image Cloudinary upload.

* **Headers**: `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`
* **Form-Data Parts**:
  * `listing`: JSON string matching `ListingRequest`:
    ```json
    {
      "title": "TI-84 Plus Graphing Calculator",
      "description": "Working perfectly with fresh batteries.",
      "price": 1200.00,
      "itemCondition": "Good",
      "category": "ELECTRONICS"
    }
    ```
  * `images`: 3 to 5 `MultipartFile` binary attachments.
* **Response `200 OK`**: Created `Listing` with assigned image URLs and status `PENDING`.

---

### `GET /api/listings/{id}`
Returns full detail of a specific listing by ID.

---

### `GET /api/listings/seller/{sellerId}`
Returns all listings created by a specific seller (used in profile views).

---

### `PATCH /api/listings/{id}/status`
Updates listing status (`ACTIVE`, `PENDING`, `SOLD`).

* **Query Parameters**: `status` *(string, required)*.
* **Security Rules**: Only the listing owner can update status. Sellers **cannot** bypass admin approval from `PENDING` to `ACTIVE`.

---

### `DELETE /api/listings/{id}`
Soft-deletes a listing (sets status to `DELETED`). Restricted to the listing owner.

---

## 3. Real-Time Chat & Messaging (`/api/chat` & WebSockets)

### `POST /api/chat/session`
Initializes or returns an existing chat thread between the buyer and seller for a listing.

* **Request Body**:
```json
{
  "listingId": 42
}
```
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

* **Response `200 OK`**:
```json
[
  {
    "id": 201,
    "sessionId": 18,
    "senderId": 5,
    "content": "Hi, is this still available?",
    "timestamp": "2026-10-05T09:05:00"
  }
]
```

---

### 🌐 STOMP WebSocket Protocol

* **Connection Handshake Endpoint**: `/ws` (supports SockJS fallback).
* **Outgoing Destination**: `/app/chat`
  * **Payload Schema**:
    ```json
    {
      "sessionId": 18,
      "content": "Can you meet at the library cafeteria at 4 PM?"
    }
    ```
* **Subscription Channel**: `/topic/session/{sessionId}`
* **Enforced Business Rules**:
  * Max 4 consecutive unreplied messages from one participant.
  * Max 100 messages total per session.

---

## 4. Wishlist / Favorites (`/api/wishlist`)

| Method | Endpoint | Description |
|:---|:---|:---|
| `POST` | `/api/wishlist/{listingId}` | Adds listing to student's saved items |
| `DELETE` | `/api/wishlist/{listingId}` | Removes listing from student's saved items |
| `GET` | `/api/wishlist` | Returns full list of saved `Listing` objects |
| `GET` | `/api/wishlist/ids` | Returns an array of saved listing IDs `[42, 58, 91]` for fast badge checks |

---

## 5. Trust & Safety Reporting (`/api/reports`)

### `POST /api/reports`
Flags an item or user for moderation.

* **Headers**: `Authorization: Bearer <token>`
* **Request Body**:
```json
{
  "targetType": "LISTING",
  "targetId": 42,
  "reason": "FRAUD"
}
```
* **Supported Reasons**: `SPAM`, `FRAUD`, `PROHIBITED`, `OFFENSIVE`, `OTHER`.
* **Response `200 OK`**: Created `Report` record with status `PENDING`.

---

## 6. Moderation & Admin Portal (`/api/admin`)

*All administrative endpoints require an account with `role: ADMIN`.*

### `GET /api/admin/reports`
Returns all submitted reports.

---

### `PUT /api/admin/reports/{id}`
Updates report status.
* **Query Parameters**: `status` (`RESOLVED` or `DISMISSED`).
* **Automated Logic**: When status is set to `RESOLVED` and `targetType == "LISTING"`, the target listing's status is automatically set to `DELETED`.

---

### `GET /api/admin/users`
Returns all registered users.

---

### `PUT /api/admin/users/{id}/ban`
Toggles user's banned state (`banned: true / false`).

---

### `GET /api/admin/listings/pending`
Returns all listings waiting for moderator approval.

---

### `PUT /api/admin/listings/{id}/approve`
Approves listing, setting its status to `ACTIVE`.

---

### `PUT /api/admin/listings/{id}/reject`
Rejects listing, setting its status to `DELETED`.
