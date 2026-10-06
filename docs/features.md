# CampusCart Detailed Features & System Specification

This document provides a comprehensive, in-depth technical specification of all features implemented across the CampusCart monorepo:
* **Frontend Web Client**: `apps/web` (React 19, Vite, Tailwind CSS, TanStack Query)
* **Moderation Admin Portal**: `apps/admin` (React 19, Vite, Tailwind CSS, Lucide Icons)
* **Mobile Client**: `apps/mobile` (React Native, Expo Router, NativeWind)
* **Backend API & Real-Time Server**: `backend` (Spring Boot 3.x, Spring Security, Spring Data JPA, STOMP WebSockets)
* **Shared Monorepo Packages**: `packages/*` (`types`, `validation`, `api-client`, `utils`)

---

## 🏗️ Architecture & Component Topology

```
                       +---------------------------------------+
                       |       Client Layer (Apps)             |
                       +---------------------------------------+
                       |  apps/web (Student Marketplace)      |
                       |  apps/admin (Moderation Dashboard)    |
                       |  apps/mobile (Expo React Native)      |
                       +-------------------+-------------------+
                                           |
                           (REST APIs / STOMP WebSockets)
                                           |
                                           v
+---------------------------------------------------------------------------------+
|                         Spring Boot 3.x Backend Server                          |
|                                                                                 |
|  +--------------------+  +----------------------+  +-------------------------+  |
|  | Security & Auth    |  | Business Services    |  | Real-Time Messaging     |  |
|  | - Google OAuth2    |  | - ListingService     |  | - WebSocketConfig       |  |
|  | - JWT Verification |  | - ChatService        |  | - STOMP Simple Broker   |  |
|  | - Domain Validator |  | - CloudinaryService  |  | - SimpMessagingTemplate |  |
|  +--------------------+  +----------------------+  +-------------------------+  |
+------------------------------------+--------------------------------------------+
                                     |
               +---------------------+---------------------+
               |                                           |
               v                                           v
+-----------------------------+             +-------------------------------+
|   PostgreSQL 15+ Database   |             |   Cloudinary Cloud Storage    |
| - Users, Listings, Images   |             | - High-res photo uploads      |
| - ChatSessions & Messages   |             | - CDN delivery & optimization |
| - Reports & Audit Trails    |             +-------------------------------+
| - Flyway Schema Migrations  |
+-----------------------------+
```

---

## 1. Authentication, Identity & Domain Gating

### 1.1 Strict Institutional Domain Isolation
* **Zero Open Registration**: The platform eliminates traditional email/password registration to prevent credential harvesting, bots, and anonymous bad actors.
* **Domain Whitelisting**: Access is strictly limited to students bearing `@anurag.edu.in` institutional email addresses.
* **Google OAuth2 Exchange**: Handled server-side through Spring Security's OAuth2 client (`spring-security-oauth2-client`). During the OAuth2 callback:
  1. The ID token and user claims are verified against Google's servers.
  2. The email address is asserted against the allowed university regex/domain.
  3. If invalid or external, authentication fails with a `403 Forbidden` response.

### 1.2 Stateless JWT Sessions
* **Token Issuance**: Following successful OAuth verification, the backend generates an HMAC-SHA256 signed JSON Web Token (JWT) containing the user's primary identity (email, role).
* **Token Storage**: Persisted in the browser client's `localStorage` (`campuscart_token`).
* **Stateless Validation**: A custom Spring Security filter intercepts all incoming REST requests, decodes the `Authorization: Bearer <token>` header, and populates the `SecurityContextHolder`.

### 1.3 Mandatory Student Onboarding Gate
* **Enforced Data Completion**: Newly authenticated students cannot browse or transact without completing their campus profile.
* **Profile Fields Captured**:
  * Preferred Full Name
  * Verified Phone Number (for offline coordination)
  * Academic Branch / Department (e.g., CSE, ECE, Mech)
  * Current Academic Year (1st, 2nd, 3rd, 4th Year)
* **Frontend Routing Interceptor**: The web app checks `user.onboardingCompleted`. If false, any navigation to marketplace routes is redirected to `/onboarding`.

---

## 2. Dynamic Marketplace Feed & Advanced Search

### 2.1 Spring Data JPA Dynamic Specifications
Search queries are processed using dynamic predicates generated via JPA `Specification<Listing>`, allowing arbitrary combinations of filters without combinatorial repository methods:
* **Text Search**: Case-insensitive substring matching against `title` and `description` (`cb.like(cb.lower(...))`).
* **Category Filtering**: Strict enumeration filter (`category = :cat`) for Textbooks, Electronics, Furniture, Tickets, Clothing, and Other.
* **Price Range**: Bounded queries via `cb.greaterThanOrEqualTo` (`minPrice`) and `cb.lessThanOrEqualTo` (`maxPrice`).
* **Condition Matching**: Filters for item state (`Like New`, `Good`, `Fair`).
* **Recency Filter**: Timestamp window calculations (`createdAt >= now() - X days`) for 24h, 7d, and 30d views.
* **Sorting**: Multi-mode ordering:
  * `newest`: `createdAt DESC` (default)
  * `oldest`: `createdAt ASC`
  * `price_asc`: `price ASC`
  * `price_desc`: `price DESC`

### 2.2 Debounced Frontend Querying
* **Input Debounce**: Search input in `apps/web` triggers an internal 500ms debounce buffer before updating the query state.
* **Network Optimization**: Eliminates rapid redundant API requests while users type, minimizing database query spikes.

### 2.3 Cursor/Offset Infinite Scroll Pagination
* **Pageable Endpoint**: Backend serves listing chunks via Spring Data `Pageable` with a default page size of 12.
* **TanStack React Query**: Frontend uses `useInfiniteQuery` to seamlessly append subsequent pages as the user scrolls, retaining cached pages to make back-navigation instantaneous.

---

## 3. Listing Creation & Media Pipeline

### 3.1 Dropzone Multi-Image Upload
* **Interactive Drag-and-Drop**: Built using an accessible dropzone supporting click-to-browse and native file dragging.
* **Image Bounds Enforcement**: Strict client-side and server-side validation requiring a minimum of 3 and a maximum of 5 images.
* **Cover Photo Badge**: The primary listing image is explicitly pinned as the cover photo with a distinct "COVER" banner.
* **Interactive Thumbnails**: Live object URLs preview selected assets before publishing. Users can delete individual photos prior to upload.

### 3.2 Cloudinary Media Integration
* **Asynchronous Multi-Part Pipeline**: Images are streamed to the backend as `multipart/form-data` and uploaded directly to Cloudinary via the Java Cloudinary SDK.
* **Cloud Storage**: Secure HTTPS URLs (`secure_url`) and public IDs (`public_id`) are mapped directly to `ListingImage` entities associated with the parent `Listing`.
* **Broken Image Fallback**: An `onError` synthetic handler in the frontend intercepts 404 or corrupted remote image loads, substituting a styled placeholder graphic without breaking the card grid.

---

## 4. Listing Lifecycle & Dashboard Management

### 4.1 State Machine Lifecycle
Each listing moves through strict lifecycle phases:
```
           +---------------------------------------------+
           |               Listing Created               |
           +----------------------+----------------------+
                                  |
                                  v
                        [ STATUS: PENDING ]
                                  |
               +------------------+------------------+
               | (Admin Approves)                    | (Admin Rejects)
               v                                     v
       [ STATUS: ACTIVE ]                    [ STATUS: DELETED ]
               |
       +-------+-------+
       |               |
       | (Seller Mark) | (Seller Delete or
       v               |  Report Resolved)
[ STATUS: PENDING /    |       |
      RESERVED ]       +------>v
       |               [ STATUS: DELETED ]
       v
[ STATUS: SOLD ]
```

### 4.2 Security Guards Against Self-Approval
* **Backend Authorization**: In `ListingService.java`, transitions from `PENDING` to `ACTIVE` are rejected if initiated by sellers:
  ```java
  if (listing.getStatus() == ListingStatus.PENDING && status == ListingStatus.ACTIVE) {
      throw new RuntimeException("Cannot bypass admin approval");
  }
  ```
* **Ownership Verification**: All state mutations and deletions verify that `SecurityContextHolder`'s authenticated email matches `listing.seller.email`.

### 4.3 Seller Dashboard (`/marketplace/you/selling`)
* Single pane to view all personal listings categorized by state (`ACTIVE`, `PENDING`, `SOLD`).
* Quick-action buttons to toggle reservation status or delete unwanted items.

---

## 5. Real-Time Chat & Negotiation Subsystem

### 5.1 STOMP over WebSockets Architecture
* **Protocol**: STOMP over SockJS fallback endpoint `/ws`.
* **Handshake Security**: WebSocket connect frame validates the user's JWT before session binding.
* **Channel Subscriptions**:
  * Outgoing messages published to `/app/chat`.
  * Clients subscribe to `/topic/session/{sessionId}` to receive real-time transmissions.
* **Entity Separation**:
  * `ChatSession`: Represents an isolated negotiation thread between a `Buyer`, `Seller`, and `Listing`.
  * `ChatMessage`: Encapsulates message body, sender ID, timestamp, and read flag.

### 5.2 Anti-Spam & Abuse Protection
* **Consecutive Message Ceiling**: A sender is restricted to a maximum of 4 consecutive unreplied messages. Sending a 5th message throws an error until the recipient responds.
* **Total Session Ceiling**: A hard limit of 100 messages per `ChatSession` prevents negotiations from spiraling into chat rooms or exhausting storage.

### 5.3 Offline Persistence & Resilience
* Every transmitted message is saved to PostgreSQL synchronously before dispatching over the message broker.
* When an offline student returns to `/marketplace/inbox`, the full message trajectory is rehydrated via REST endpoint `/api/chat/session/{id}/messages`.

---

## 6. Wishlist / Favorites System

### 6.1 Database Architecture
* Implemented as an indexed join table `saved_listings` mapping `user_id` to `listing_id`.
* Enables efficient `O(1)` relationship lookup and bulk querying of saved items.

### 6.2 Instant UI Synchronicity
* **Optimistic Toggling**: Clicking the heart icon on any card immediately flips the UI state while dispatching `POST /api/wishlist/{id}` or `DELETE /api/wishlist/{id}` in the background.
* **Global Cache Invalidation**: React Query automatically invalidates query key `['wishlist-ids']`, synchronizing all open cards across the application.

---

## 7. Trust, Safety & Reporting System

### 7.1 Student Reporting Modal
* **Accessibility**: Every item detail page includes a prominent "Report Listing" action.
* **Categorized Reasons**:
  * `SPAM`: Duplicate posts, keyword stuffing.
  * `FRAUD`: Counterfeit goods, advance payment scams, misrepresented specs.
  * `PROHIBITED`: Banned campus items (contraband, exam materials, alcohol).
  * `OFFENSIVE`: Harassment, explicit content.
  * `OTHER`: Miscellaneous issues with required descriptive text.
* **Target Mapping**: The report links the complaining student (`reporter_id`), `targetType = LISTING`, `targetId`, and timestamp into the `reports` table.

---

## 8. Dedicated Moderation Admin Portal (`apps/admin`)

The standalone moderation client runs on port `5174` with direct privileged API access to `/api/admin/*`:

### 8.1 Role-Based Access Control (`requireAdmin`)
Every administrative endpoint verifies the calling user's role against `Role.ADMIN` in PostgreSQL. Unprivileged users receive `403 FORBIDDEN`.

### 8.2 Reported Listings Queue
* Displays all pending student reports alongside reason, reporter identity, and listing preview.
* **Resolve Action**:
  * Marks report status as `RESOLVED`.
  * Automatically sets the offending listing's status to `DELETED`.
  * Immediately removes the listing from search, categories, and marketplace feeds while preserving database audit logs.
* **Dismiss Action**:
  * Marks report status as `DISMISSED`.
  * Leaves the listing active and visible.
* **Interactive Confirmations**: Built-in modal alerts prevent accidental dismissal or deletion.

### 8.3 Student Account Moderation
* View complete user registry including email, student name, department, year, join date, and ban status.
* One-click **Toggle Ban** (`PUT /api/admin/users/{id}/ban`) to immediately revoke user privileges.

### 8.4 New Listing Approval Queue
* Inspect newly submitted listings in `PENDING` state before public dissemination.
* One-click **Approve** (transitions to `ACTIVE`) or **Reject** (transitions to `DELETED`).

---

## 9. Monorepo Shared Packages (`packages/*`)

To maintain absolute type safety and zero code duplication between `apps/web`, `apps/admin`, and `apps/mobile`:
* **`@campuscart/types`**: Shared TypeScript definitions (`User`, `Listing`, `ListingStatus`, `Category`, `ChatSession`, `ChatMessage`, `Report`).
* **`@campuscart/validation`**: Shared validation logic (price constraints, image count rules, title lengths).
* **`@campuscart/api-client`**: Centralized HTTP client configurations, error abstractions, and token retrieval helpers.
* **`@campuscart/utils`**: Formatter utilities for INR currency (₹), human-readable date relative times (e.g., "2 hours ago"), and string sanitizers.

---

## 10. Summary Matrix of User Roles & Capabilities

| Capability | Guest / Unauthenticated | Verified Student (`@anurag.edu.in`) | Moderator / Admin |
|:---|:---:|:---:|:---:|
| View Landing Page & Public Feed | ✅ | ✅ | ✅ |
| Initiate Google OAuth2 Login | ✅ | ✅ | ✅ |
| Create & Manage Listings | ❌ | ✅ | ✅ |
| Upload Photos to Cloudinary | ❌ | ✅ | ✅ |
| Live Chat over WebSockets | ❌ | ✅ | ✅ |
| Save Items to Wishlist | ❌ | ✅ | ✅ |
| Report Suspicious Items | ❌ | ✅ | ✅ |
| Approve / Reject Listings | ❌ | ❌ | ✅ |
| Resolve / Dismiss Reports | ❌ | ❌ | ✅ |
| Ban Malicious Users | ❌ | ❌ | ✅ |
