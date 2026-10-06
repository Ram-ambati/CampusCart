# CampusCart: Feature Status & Engineering Roadmap

This document provides a realistic tracking of implemented capabilities, active enhancements, and future milestones for the CampusCart platform.

---

## ✅ Completed & Production-Ready Features

The following features were formerly on the backlog and are now fully implemented and tested across the codebase:

| Capability | Module | Implementation Details |
|:---|:---|:---|
| **Real-Time In-App Messaging** | `apps/web`, `backend` | Powered by Spring Boot WebSockets and STOMP over SockJS. Features isolated chat sessions, instant bidirectional messaging, and message persistence in PostgreSQL. |
| **Chat Anti-Spam Controls** | `backend` | Enforces a 4 consecutive unreplied message limit per sender and a 100-message ceiling per negotiation thread in `ChatService.java`. |
| **Favorites / Wishlist** | `apps/web`, `backend` | Instant one-click bookmarking backed by `saved_listings` PostgreSQL join table and TanStack Query optimistic cache invalidation. |
| **Infinite Scroll & Pagination** | `apps/web`, `backend` | Cursor/offset pagination using Spring Data `Pageable` and React Query `useInfiniteQuery` fetching in 12-item chunks. |
| **Trust & Safety Reporting** | `apps/web`, `backend` | In-app reporting modal allowing students to flag listings for Spam, Fraud, Prohibited Goods, or Harassment. |
| **Moderation Admin Portal** | `apps/admin`, `backend` | Dedicated Vite portal (port 5174) with `requireAdmin` RBAC, listings approval/rejection queue, reports management, and user ban toggles. |
| **Safe Soft-Deletion Flow** | `backend`, `apps/admin` | Resolving a reported listing transitions its state to `DELETED`, instantly removing it from marketplace feeds while retaining audit records. |
| **Self-Approval Protection** | `backend`, `apps/web` | Backend strictly blocks sellers from bypassing admin approval by attempting to move listings from `PENDING` to `ACTIVE`. |
| **Monorepo Shared Packages** | `packages/*` | Clean separation of `@campuscart/types`, `@campuscart/validation`, `@campuscart/api-client`, and `@campuscart/utils`. |

---

## ⏳ Active & Near-Term Enhancements

### 1. Image Reordering in Create Listing
* **Goal**: Allow students to drag-and-drop preview thumbnails on the `CreateListing` page to dynamically rearrange images and explicitly choose the cover photo before publishing.
* **Status**: Drag-and-drop upload and 3–5 image constraints are active; visual re-ordering before submission is slated for next UI polish.

### 2. Peer Review & Rating System (Trust Score)
* **Goal**: Allow students to leave 1-to-5 star ratings and short reviews for sellers after an item is marked as `SOLD`.
* **Technical Plan**:
  * New database table `seller_reviews` with fields: `id`, `reviewer_id`, `seller_id`, `listing_id`, `rating`, `comment`, `created_at`.
  * Display composite rating score (e.g., ⭐ 4.8 / 5.0) on student profiles and listing detail cards.

---

## 🔮 Future Architectural Roadmap

### 1. Asynchronous Push Notifications
* **Use Case**: Inform buyers when a seller replies to a chat, an item on their wishlist drops in price, or a new listing matching saved keywords appears.
* **Architecture**:
  * **Message Broker**: Introduce RabbitMQ to decouple notification dispatch from REST request cycles.
  * **Push Service**: Firebase Cloud Messaging (FCM) integration for mobile push delivery on iOS and Android.

### 2. Redis Caching for Read Scaling
* **Use Case**: Shield PostgreSQL from high concurrent reads during campus peak hours (e.g., semester startup book sales).
* **Architecture**:
  * Cache active marketplace feed pages and category listings with TTL of 5–10 minutes.
  * Invalidate cache keys upon new listing creation or admin status mutation.

### 3. Integrated UPI / Campus Escrow Payments
* **Use Case**: While current transactions are conducted in-person via cash or direct UPI, an escrow payment system can facilitate safe reservations.
* **Architecture**:
  * Generate dynamic UPI Deep Links (`upi://pay?pa=...&am=...&tn=CampusCart`) or integrate a payment gateway (Razorpay / Cashfree) with funds held in escrow until buyer confirms receipt in-person.
