# Project: DriveRent Autonomous Testing & Verification

## Architecture
- **Frontend**: React 19 + TypeScript + Tailwind CSS v4 running on Vite (port 8443). Key views in `src/views/` (`ListingView`, `CarDetailView`, `CheckoutView`, `ConfirmationModal`, `MyBookingsView`, `AdminView`).
- **Backend API**: Express 5 on Node.js (port 3001) in `server/index.ts` (compiled to `api/index.js`), reverse-proxied by Vite at `/api`.
- **Database**: Supabase PostgreSQL 17.11 (`aws-0-us-east-1.pooler.supabase.com:6543/postgres`) with 7 core tables (`vehicles`, `bookings`, `users`, `promo_codes`, `maintenance_logs`, `admin_sessions`, `customer_sessions`).
- **Testing Engine**: Playwright browser automation driving interactive flows on system Chrome/Edge, capturing high-resolution screenshots into `./screenshots/`, paired with backend lifecycle test suites (`scripts/qa_full_lifecycle_test.mjs`).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Test Harness & Server Boot | Install Playwright, configure `playwright.config.ts`, ensure backend & Vite servers run reliably | M1 | Survey |
| 2 | Fleet Catalog Screenshot | Navigate catalog, category filters, search input, price range slider, capture screenshot | M2 | R1 |
| 3 | Vehicle Details Modal Screenshot | View gallery, specs, garage hub/bay viewer, pricing tabs, capture screenshot | M2 | R1 |
| 4 | Reservation & Checkout Screenshot | Driver license upload, promo code `DRIVE15`, insurance toggle, confirmation modal, capture screenshot | M2 | R1 |
| 5 | Customer Dashboard & Profile Screenshot | Profile card, VIP status, Green Signal clearance with garage bay, digital voucher QR, capture screenshot | M2 | R1 |
| 6 | Admin Command Center Screenshot | KPI stats overview, fleet inventory table, vehicle edit modal, capture screenshot | M2 | R1 |
| 7 | Digital Key Handover Modal Screenshot | Pre-trip checklist (odometer out, fuel out, staff signature), capture screenshot | M2 | R1 |
| 8 | Extension Negotiation Modal Screenshot | Admin rate quote modal and customer approval card, capture screenshot | M2 | R1 |
| 9 | Vehicle Return & Inspection Modal Screenshot | Intake inspection (odometer in, fuel in, damage checks, release), capture screenshot | M2 | R1 |
| 10 | Customer Account & Cryptographic JWT | Register customer, verify bcrypt hash and 7-day JWT auth | M3 | R2 |
| 11 | Availability & Promo Calculation | Dynamic date availability check, promo discount validation | M3 | R2 |
| 12 | Concurrency & Double-Booking Conflict | Prevent overlapping active reservations with HTTP 409 Conflict | M3 | R2 |
| 13 | Admin Review & Key Handover Workflow | Admin approval, key handover transition (`Checked Out` -> vehicle `Rented`) | M3 | R2 |
| 14 | Mid-Trip Extension Workflow | Negotiation flow (`Requested` -> `Quoted` -> `Approved`), DB `return_date` update | M3 | R2 |
| 15 | Return Inspection & Vehicle Release | Post-trip intake, odometer update, status release back to `Available` in Supabase | M3 | R2 |
| 16 | Visual Screenshot Catalog | Detailed index of all screenshots with metadata, dimensions, and visual validation | M4 | R3 |
| 17 | Visual Inspection & Responsive Audit | Layout integrity, typography, contrast, zero clipping or broken assets | M4 | R3 |
| 18 | Functional API & DB Assertion Audit | Complete assertion log, database mutation proofs, zero console/backend errors | M4 | R3 |
| 19 | Comprehensive Audit Report Delivery | Publish `AUDIT_REPORT.md` and deliver victory report to Sentinel | M4 | R3 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Test Harness & Server Boot | Setup Playwright, configure headless browser runner, boot Express API & Vite dev servers | none | DONE (Playwright v1.64.1 & servers active) |
| 2 | Playwright Visual Capture (R1) | Execute Playwright automation capturing screenshots for all 8 views and modal states to `./screenshots/` | M1 | DONE (23/23 high-res screenshots captured) |
| 3 | E2E Operational Lifecycle (R2) | Execute complete user and admin lifecycle against live backend & Supabase PostgreSQL | M1 | DONE (36/36 checkpoints passed, 100%) |
| 4 | Visual & Functional Audit Report (R3) | Synthesize comprehensive visual/functional audit report with screenshots catalog, assertions, and health check | M2, M3 | IN_PROGRESS (worker_m4) |

## Interface Contracts
### Playwright Runner ↔ Vite Frontend (Port 8443)
- Navigation root: `http://localhost:8443`
- Direct view access via local storage: `localStorage.setItem('currentView', ...)` or UI navigation clicks
- View keys: `home`, `fleet`, `car-detail`, `checkout`, `my-bookings`, `admin`
- Viewports: Desktop 1280x800 and 1920x1080 high-res

### Frontend ↔ Backend API (Port 3001)
- Proxy path: `/api/*` -> `http://localhost:3001/api/*`
- Auth headers: `Authorization: Bearer <jwt_token>`
- Key endpoints:
  - `POST /api/auth/register`, `POST /api/auth/customer-login`
  - `POST /api/auth/login` (admin passcode `0709`)
  - `GET /api/cars`, `GET /api/cars/:id/availability`
  - `POST /api/bookings`
  - `POST /api/bookings/:id/approve`
  - `POST /api/bookings/:id/handover-keys`
  - `POST /api/bookings/:id/request-extension`, `POST /api/bookings/:id/quote-extension`, `POST /api/bookings/:id/approve-extension`
  - `POST /api/bookings/:id/return-inspection`

### Backend API ↔ Supabase PostgreSQL
- Host: `aws-0-us-east-1.pooler.supabase.com:6543/postgres`
- Status transitions:
  - Advance booking: `bookings.status = 'Assigned'`, `vehicles.status = 'Available'`
  - Key handover: `bookings.status = 'Checked Out'`, `vehicles.status = 'Rented'`
  - Return inspection: `bookings.status = 'Completed'`, `vehicles.status = 'Available'`

## Code Layout
- `src/` — React frontend source (App.tsx, views/, components/)
- `server/` — Express API source (index.ts, db.ts)
- `api/` — Bundled production backend artifact (index.js)
- `scripts/` — QA test scripts (qa_full_lifecycle_test.mjs, test-supabase.mjs)
- `screenshots/` — Destination directory for Playwright high-resolution captures
- `.agents/teamwork/` — Teamwork agent coordination metadata
