<div align="center">
  <img src="docs/images/logo.svg" alt="CampusCart Logo" width="600" height="120" />

  <p><strong>Your Campus. Your Marketplace.</strong></p>
  <p>An exclusive, secure, and modern peer-to-peer marketplace tailored for university students to buy, sell, and trade textbooks, electronics, and essentials with verified peers.</p>

  <p>
    <img src="https://img.shields.io/badge/Java-17-orange.svg?style=flat-square&logo=openjdk" alt="Java 17" />
    <img src="https://img.shields.io/badge/Spring_Boot-3.x-brightgreen.svg?style=flat-square&logo=springboot" alt="Spring Boot" />
    <img src="https://img.shields.io/badge/React-19-blue.svg?style=flat-square&logo=react" alt="React" />
    <img src="https://img.shields.io/badge/Vite-8.x-purple.svg?style=flat-square&logo=vite" alt="Vite" />
    <img src="https://img.shields.io/badge/Expo-Mobile-000000.svg?style=flat-square&logo=expo" alt="Expo" />
    <img src="https://img.shields.io/badge/PostgreSQL-15+-336791.svg?style=flat-square&logo=postgresql" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-4.x-38B2AC.svg?style=flat-square&logo=tailwind-css" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square" alt="License MIT" />
  </p>
</div>

---

## 📖 Table of Contents

- [About CampusCart](#-about-campuscart)
- [Key Features](#-key-features)
- [Screenshots & Visuals](#-screenshots--visuals)
- [Monorepo Architecture](#-monorepo-architecture)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [1. Clone Repository](#1-clone-the-repository)
  - [2. Shared Packages Build](#2-build-shared-packages)
  - [3. Backend Setup](#3-backend-setup)
  - [4. Frontend (Web App) Setup](#4-web-marketplace-setup)
  - [5. Admin Portal Setup](#5-admin-portal-setup)
  - [6. Mobile Client Setup](#6-mobile-app-setup-optional)
- [Environment Configuration](#-environment-configuration)
- [Trust, Safety & Security](#-trust-safety--security)
- [Documentation & Deep Dives](#-documentation--deep-dives)
- [License](#-license)

---

## 🎓 About CampusCart

Traditional second-hand marketplaces (OLX, Craigslist, Facebook Marketplace) expose students to anonymous strangers, fraudulent transactions, safety hazards, and delivery complications. 

**CampusCart** solves this by establishing a trusted, closed-circuit campus ecosystem:
- **Zero Middlemen & Zero Listing Fees**: Direct peer-to-peer exchange within the student community.
- **Institutional Domain Locking**: Sign-ins are restricted exclusively to official university email addresses (e.g., `@anurag.edu.in`).
- **Campus-Centric Exchange**: Transactions are fulfilled in-person at trusted campus hubs (libraries, cafeterias, hostels), eliminating packaging, shipping, and payment escrow risks.

---

## ✨ Key Features

### 🔐 1. Authentication & Onboarding
- **Strict Domain Locking**: Google OAuth2 authentication restricted to verified institutional accounts (`@anurag.edu.in`).
- **Stateless JWT Sessions**: Secure token issuance following Google OAuth handshake, with client validation on both REST endpoints and WebSocket protocols.
- **Student Onboarding**: First-time login prompts students for essential campus details (Branch, Academic Year, Phone Number, Preferred Name) before granting marketplace access.

### 🛍️ 2. Dynamic Marketplace & Search
- **Category Browsing**: Filter by Textbooks, Electronics, Hostels/Furniture, Clothing, Tickets, and Other.
- **Advanced Dynamic Querying**: Real-time multi-attribute filtering (Price Range, Condition, Recency) built using Spring Data JPA Specifications.
- **Debounced Search**: Responsive full-text search across titles and descriptions with a 500ms debounce to optimize network overhead.
- **Cursor/Offset Pagination**: Seamless feed loading with infinite scroll driven by TanStack Query and Spring Pageable.

### 📸 3. Listing Creation & Media Handling
- **Interactive Multi-Image Upload**: Drag-and-drop file upload supporting 3 to 5 images per item.
- **Cloudinary CDN Integration**: High-speed, optimized cloud media storage and thumbnail transformations.
- **Cover Badge & Previews**: Live visual previews with an explicit "COVER" badge indicating primary photo selection and one-click removal.

### 🔄 4. Listing Lifecycle & Dashboard
- **Seller Control Center**: Dedicated dashboard (`/marketplace/you/selling`) to manage listings.
- **State Machine Transitions**: Controlled transitions between states (`ACTIVE` ➔ `PENDING` (Reserved) ➔ `SOLD`).
- **Protection Against Self-Approval**: Strict business rules prevent unauthorized state transitions.

### 💬 5. Real-Time Chat & Negotiation
- **STOMP over WebSockets**: Integrated real-time messaging powered by Spring WebSockets and SockJS.
- **Contextual Sessions**: Chat sessions are linked directly to specific listings and buyer-seller pairs.
- **Spam Prevention System**:
  - Maximum 4 consecutive unreplied messages from one party.
  - 100-message hard ceiling per item discussion to keep chats focused and conserve database storage.
- **Offline Persistence**: Messages are saved directly to PostgreSQL, allowing offline users to review missed threads upon reconnection.

### ❤️ 6. Wishlist & User Profiles
- **Saved Items**: Instant one-click "Hearting" with optimistic UI updates via React Query.
- **Profile Hub**: View active listings, personal wishlist, campus verification badges, and customizable bio.

### 🛡️ 7. Trust, Moderation & Admin Portal
- **Reporting System**: In-app modal enabling users to flag suspicious, scam, or abusive listings.
- **Dedicated Admin Portal (`apps/admin`)**: Operations portal for moderators to review reported items, ban bad actors, and resolve issues.
- **Safe Soft Deletion**: Resolving reports automatically soft-deletes listings, preserving audit trails for disciplinary verification while immediately removing items from public view.

---

## 📸 Screenshots & Visuals

| Landing Page | Marketplace Feed |
|:---:|:---:|
| ![Landing Page](docs/images/landing.png) | ![Marketplace Feed](docs/images/marketplace.png) |

| Item Details & Live Chat | Student Profile & Wishlist |
|:---:|:---:|
| ![Item Detail](docs/images/item.png) | ![User Profile](docs/images/profile.png) |

---

## 🏛️ Monorepo Architecture

CampusCart is organized as a high-performance monorepo using npm workspaces:

```
CampusCart/
├── apps/
│   ├── web/               # Student Web Marketplace (React 19 + Vite, Port 5173)
│   ├── admin/             # Moderator Portal (React 19 + Vite + Lucide, Port 5174)
│   └── mobile/            # Cross-Platform Mobile App (React Native + Expo)
│
├── backend/               # Spring Boot 3.x REST & STOMP WebSocket Server (Port 8080)
│   ├── src/main/java/com/campuscart/backend/
│   │   ├── config/        # Security, OAuth2, WebSockets, Cloudinary Config
│   │   ├── controller/    # Auth, Listings, Chat, Admin, Reports Controllers
│   │   ├── entity/        # User, Listing, ChatSession, ChatMessage, Report Entities
│   │   ├── repository/    # JPA Repositories & Dynamic Specifications
│   │   └── service/       # Listing, Chat, Storage, and Moderation Services
│   └── src/main/resources/
│       ├── application.properties
│       └── db/migration/  # Flyway SQL Migrations
│
├── packages/              # Shared Internal TypeScript Packages
│   ├── types/             # Shared TypeScript Data Interfaces & DTOs
│   ├── validation/        # Shared Zod / Data Validation Schemas
│   ├── api-client/        # Shared API Fetchers & Network Abstractions
│   └── utils/             # Shared Date, Currency & String Helpers
│
└── docs/                  # Architectural Docs, Guides & Asset Library
    ├── features.md        # Comprehensive Features Breakdown
    ├── chat_walkthrough.md# Real-Time WebSocket Architecture Guide
    └── images/            # UI Mockups & Screenshots
```

---

## 🛠️ Tech Stack

| Domain | Technologies & Libraries |
|:---|:---|
| **Web Client** | React 19, Vite, TypeScript, Tailwind CSS, TanStack React Query, React Router v7 |
| **Admin Portal** | React 19, Vite, Tailwind CSS, Lucide Icons, TanStack Query |
| **Mobile Client** | React Native, Expo Router, NativeWind (Tailwind CSS) |
| **Backend Framework** | Java 17, Spring Boot 3.x, Spring Security (OAuth2 Client), Spring Web, Spring WebSocket |
| **Real-Time Protocol** | STOMP protocol over SockJS |
| **Database & ORM** | PostgreSQL 15+, Spring Data JPA, Hibernate, Flyway Database Migrations |
| **Media Hosting** | Cloudinary Java SDK & Image CDN |
| **Monorepo Tooling** | npm workspaces, Oxlint, TypeScript Project References |

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your local machine:
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **JDK**: Java 17 or higher
- **PostgreSQL**: Local instance or managed service (e.g., Supabase, Neon)
- **Google Cloud Console**: OAuth 2.0 Client Credentials configured with redirect URI:
  - `http://localhost:8080/login/oauth2/code/google`
- **Cloudinary Account**: Cloud name, API Key, and API Secret for media uploads

---

### 1. Clone the Repository

```bash
git clone https://github.com/Ram-ambati/CampusCart.git
cd CampusCart
```

### 2. Build Shared Packages

Install workspace dependencies and build the shared TypeScript packages:

```bash
npm install
npm run build:packages
```

---

### 3. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a `.env` file in `backend/` or supply environment variables (see below):
   ```properties
   DB_HOST=localhost
   DB_NAME=campuscart
   DB_USERNAME=postgres
   DB_PASSWORD=your_password
   GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_key
   CLOUDINARY_API_SECRET=your_cloudinary_secret
   ```

3. Run Flyway migrations & launch the Spring Boot server:
   ```bash
   # Windows (PowerShell / CMD)
   .\mvnw.cmd spring-boot:run

   # macOS / Linux
   ./mvnw spring-boot:run
   ```
   *The backend will be running at `http://localhost:8080`.*

---

### 4. Web Marketplace Setup

From the repository root, launch the main web marketplace:

```bash
# Using root shortcut:
npm run dev:web

# Or directly in apps/web:
cd apps/web
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

---

### 5. Admin Portal Setup

To start the moderator dashboard for inspecting listings, reports, and users:

```bash
# Using root shortcut:
npm run dev:admin

# Or directly in apps/admin:
cd apps/admin
npm run dev
```

Visit **`http://localhost:5174`** in your browser.

---

### 6. Mobile App Setup (Optional)

To start the Expo development server:

```bash
npm run dev:mobile
```

Scan the QR code with **Expo Go** on your iOS or Android device.

---

## ⚙️ Environment Configuration

### Backend (`backend/.env` or OS Environment)

| Variable | Description | Example / Default |
|:---|:---|:---|
| `DB_HOST` | PostgreSQL Host Address | `localhost` or Supabase host |
| `DB_NAME` | Database Name | `campuscart` |
| `DB_USERNAME` | PostgreSQL User | `postgres` |
| `DB_PASSWORD` | PostgreSQL Password | `password` |
| `GOOGLE_CLIENT_ID` | Google OAuth2 Client ID | `*.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth2 Client Secret | `GOCSPX-...` |
| `CLOUDINARY_CLOUD_NAME`| Cloudinary Cloud Identifier | `demo` |
| `CLOUDINARY_API_KEY` | Cloudinary API Key | `1234567890` |
| `CLOUDINARY_API_SECRET`| Cloudinary API Secret | `abcdef123456` |
| `app.jwt.secret` | HMAC secret for signing JWTs | (Configured in `application.properties`) |

### Frontend (`apps/web/.env` and `apps/admin/.env`)

| Variable | Description | Default |
|:---|:---|:---|
| `VITE_API_URL` | Backend REST & WebSocket Host | `http://localhost:8080` |

---

## 🔒 Trust, Safety & Security

- **Strict University Domain Gating**: Ensures bad actors outside the university cannot register or contact students.
- **WebSocket Handshake Authentication**: Intercepts STOMP `CONNECT` frames to authenticate users via JWT before establishing bidirectional communication channels.
- **Moderation Workflows**: Listings flagged by students can be examined in `apps/admin`. Approving/resolving a report executes a soft-delete, hiding the item immediately from the search feed while retaining data for compliance and safety investigations.
- **Anti-Spam Safeguards**: Prevents chat spamming and automated abuse by strictly bounding consecutive unreplied messages.

---

## 📚 Documentation & Deep Dives

For further architectural designs, API details, and protocols:
- [Detailed Features Specification](docs/features.md)
- [REST & WebSocket API Reference](docs/api_reference.md)
- [Real-Time WebSocket & Chat Walkthrough](docs/chat_walkthrough.md)
- [Feature Status & Roadmap](docs/missing_features.md)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
