# Implementation Plan: ChopSave

## Overview

This document is the developer roadmap for **ChopSave** — a Nigerian food waste rescue marketplace. Tasks are grouped into 15 phases covering infrastructure through testing. Each task references the requirements and design documents it satisfies.

---

## Tasks

### Phase 1 — Project Setup & Infrastructure

- [x] 1.1 Scaffold monorepo with pnpm workspaces and Turborepo
  - Initialise `pnpm-workspace.yaml` defining `apps/*` and `packages/*` workspaces
  - Create `turbo.json` with `build`, `lint`, `test`, and `dev` pipeline definitions
  - Add root `package.json` with `packageManager: pnpm@9`
  - Create workspace folders: `apps/api`, `apps/mobile`, `apps/web`, `packages/shared`, `packages/ui`, `packages/config`
  - Requirements: Design — Monorepo Structure
  - Dependencies: none

- [x] 1.2 Create shared packages: types, config, ESLint
  - `packages/shared`: export shared TypeScript types, enums (NotificationType, ReservationStatus, etc.), and utility helpers
  - `packages/config`: export `tsconfig.base.json`, `eslint.base.json`, and `prettier.config.js`
  - `packages/ui`: scaffold shared React Native / React component library package (stub)
  - Add `tsconfig.json` extending base in every workspace package
  - Requirements: Design — Monorepo Structure
  - Dependencies: Task 1.1

- [x] 1.3 Set up PostgreSQL 15 + PostGIS and connection pool
  - Add `pg` and `@types/pg` to `apps/api`
  - Create `apps/api/src/db/pool.ts` — `pg.Pool` singleton configured from env vars
  - Create `apps/api/src/db/BaseRepository.ts` with typed query helper
  - Enable `postgis` extension via migration (see Phase 2)
  - Requirements: Design — Data Models, Geospatial Design
  - Dependencies: Task 1.1, Task 1.2

- [x] 1.4 Set up Redis client (ioredis)
  - Install `ioredis` in `apps/api`
  - Create `apps/api/src/plugins/redis.ts` — export singleton `Redis` instance
  - Configure connection via `REDIS_URL` env var with reconnect strategy
  - Requirements: Design — Security Design (OTP rate limiting), Real-Time Updates
  - Dependencies: Task 1.1

- [x] 1.5 Configure BullMQ queues
  - Install `bullmq` in `apps/api`
  - Create `apps/api/src/plugins/queue.ts` — export named `Queue` instances: `listingExpiryQueue`, `noShowQueue`, `payoutQueue`, `pickupReminderQueue`, `notificationQueue`, `pendingPaymentExpiryQueue`, `noShowSuspensionQueue`
  - Requirements: Design — Background Jobs
  - Dependencies: Task 1.4

- [x] 1.6 Environment variable schema validation with Zod
  - Install `zod` in `apps/api`
  - Create `apps/api/src/config/env.ts` — define and parse all required env vars: `DATABASE_URL`, `REDIS_URL`, `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`, `PAYSTACK_SECRET_KEY`, `PAYSTACK_WEBHOOK_SECRET`, `FLUTTERWAVE_SECRET_KEY`, `FLUTTERWAVE_WEBHOOK_SECRET`, `TERMII_API_KEY`, `FCM_SERVICE_ACCOUNT`, `AWS_S3_BUCKET`, `GOOGLE_CLIENT_ID`, `APPLE_CLIENT_ID`
  - Throw on startup if any required var is missing
  - Create `.env.example` documenting every key
  - Requirements: Req 29 (session security / data protection)
  - Dependencies: Task 1.1

- [x] 1.7 Set up GitHub Actions CI pipeline
  - Create `.github/workflows/ci.yml` with jobs: `lint`, `type-check`, `test`, `build`
  - Use `pnpm` caching and Turborepo remote caching
  - Run on `push` to `main` and all `pull_request` events
  - Requirements: Design — general engineering quality
  - Dependencies: Task 1.1, Task 1.2

---

### Phase 2 — Database Schema & Migrations

- [x] 2.1 Enable PostGIS extension and create enum types migration
  - Migration `001_extensions_and_enums`: `CREATE EXTENSION IF NOT EXISTS postgis;`
  - Define PostgreSQL enum types matching all `CHECK` constraints in the design (or keep as `VARCHAR` with app-level validation — document the choice)
  - Requirements: Design — Geospatial Design
  - Dependencies: Task 1.3

- [x] 2.2 Create `users` table migration
  - Fields: `id`, `phone`, `email`, `full_name`, `display_name`, `avatar_url`, `role`, `status`, `dietary_prefs`, `fcm_token`, `notif_prefs`, `no_show_count`, `no_show_window_start`, `suspended_until`, `created_at`, `updated_at`, `deleted_at`
  - Indexes: `idx_users_phone`, `idx_users_role`, `idx_users_status`
  - Requirements: Req 1 (phone auth), Req 2 (profile), Req 9 (no-show)
  - Dependencies: Task 2.1

- [x] 2.3 Create `businesses` table migration
  - Fields per design including `geom GEOMETRY(Point, 4326)`
  - Indexes: `idx_businesses_user_id`, `idx_businesses_geom` (GIST), `idx_businesses_city`, `idx_businesses_verification`
  - Include PostGIS geom trigger (`trg_update_business_geom`) from design
  - Requirements: Req 13 (business registration), Req 27 (geofencing)
  - Dependencies: Task 2.2

- [x] 2.4 Create `listings` and `listing_items` table migrations
  - `listings`: all fields, constraints (`listing_pickup_window`, `listing_pickup_same_day`, `listing_quantity`, `listing_price_positive`), indexes
  - `listing_items`: all fields, constraints, indexes
  - Requirements: Req 15 (surprise bag), Req 16 (itemised listing), Req 17 (lifecycle)
  - Dependencies: Task 2.3

- [x] 2.5 Create `reservations` and `reservation_items` table migrations
  - `reservations`: all fields including `pickup_code VARCHAR(8) UNIQUE`, `payout_commission_sum` constraint, all indexes
  - `reservation_items`: fields, indexes
  - Requirements: Req 7 (reservation), Req 8 (pickup code)
  - Dependencies: Task 2.4

- [x] 2.6 Create `payments` table migration
  - Fields: `id`, `reservation_id`, `gateway`, `method`, `amount`, `currency`, `status`, `gateway_ref UNIQUE`, `gateway_meta`, `initiated_at`, `confirmed_at`, `refunded_at`, `refund_ref`
  - Indexes: `idx_payments_reservation_id`, `idx_payments_gateway_ref`, `idx_payments_status`
  - Requirements: Req 7 (pre-payment), Req 26 (USSD)
  - Dependencies: Task 2.5

- [x] 2.7 Create `ratings` table migration
  - Fields: `id`, `reservation_id`, `rater_id`, `ratee_id`, `ratee_type`, `stars`, `review`, `flag_tag`, `created_at`
  - Unique constraint: `(reservation_id, rater_id)`
  - Indexes: `idx_ratings_ratee_id`, `idx_ratings_reservation_id`
  - Requirements: Req 10 (consumer ratings), Req 19 (business rates consumer)
  - Dependencies: Task 2.5

- [x] 2.8 Create `favourites` table migration
  - Composite primary key `(consumer_id, business_id)`
  - Index: `idx_favourites_business_id`
  - Requirements: Req 11 (favourites)
  - Dependencies: Task 2.3

- [x] 2.9 Create `notifications` table migration
  - Fields: `id`, `user_id`, `type`, `title`, `body`, `payload`, `channel`, `read`, `sent_at`, `created_at`
  - Indexes: `idx_notifications_user_id`, `idx_notifications_read`, `idx_notifications_created_at DESC`
  - Requirements: Req 12 (push notifications)
  - Dependencies: Task 2.2

- [x] 2.10 Create `payouts` table migration
  - Fields: `id`, `business_id`, `amount`, `status`, `bank_account`, `gateway`, `gateway_ref`, `failure_reason`, `requested_at`, `processed_at`, `completed_at`
  - Indexes: `idx_payouts_business_id`, `idx_payouts_status`
  - Requirements: Req 20 (payout management)
  - Dependencies: Task 2.3

- [x] 2.11 Create `disputes` table migration
  - Fields: `id`, `reservation_id`, `raised_by`, `reason`, `description`, `status`, `resolution_note`, `resolved_by`, `raised_at`, `resolved_at`
  - Indexes: `idx_disputes_reservation_id`, `idx_disputes_status`
  - Requirements: Req 25 (dispute resolution)
  - Dependencies: Task 2.5

- [x] 2.12 Create `admin_actions` table migration
  - Fields: `id`, `admin_id`, `action_type`, `target_type`, `target_id`, `reason`, `metadata`, `created_at`
  - Indexes: `idx_admin_actions_admin_id`, `idx_admin_actions_target`
  - Requirements: Req 22 (admin verification), Req 24 (content moderation)
  - Dependencies: Task 2.2

- [x] 2.13 Create `system_config` table migration + seed
  - Fields: `key PRIMARY KEY`, `value`, `description`, `updated_by`, `updated_at`
  - Seed rows: `default_commission_rate`, `food_weight_default_kg`, `co2_per_kg_food`, `no_show_suspension_days`, `payout_min_ngn`, `pickup_reminder_60min`, `pickup_reminder_30min`
  - Requirements: Req 21 (commission config), Design — system_config seed
  - Dependencies: Task 2.2

- [x] 2.14 Create `city_geofences` table migration + seed
  - Fields: `city PRIMARY KEY`, `geom GEOMETRY(Polygon, 4326)`
  - Seed Lagos state bounding polygon and FCT Abuja bounding polygon as defined in design
  - Requirements: Req 27 (geofencing), Design — Lagos & Abuja Geofences
  - Dependencies: Task 2.1

---

### Phase 3 — Authentication API

- [ ] 3.1 Implement OTP send endpoint (`POST /auth/otp/send`)
  - Accept `phone` in Nigerian format (08XXXXXXXXX or +234XXXXXXXXX), normalise to E.164
  - Generate 6-digit OTP, store HMAC hash in Redis with 5-minute TTL: `otp:{phone}`
  - Enforce rate limit via Redis key `otp_rate:{phone}` (max 5/hr, TTL 3600s) — return HTTP 429 if exceeded
  - Call Termii SMS API to deliver OTP within 30 seconds
  - Requirements: Req 1.2, Req 1.5, Req 29.4, Design — Security Design
  - Dependencies: Task 1.4, Task 2.2

- [ ] 3.2 Implement OTP verify endpoint (`POST /auth/otp/verify`)
  - Accept `phone` and `otp`; validate against Redis hash
  - Allow up to 3 incorrect attempts; lock OTP for 10 minutes after 3 failures
  - On success: upsert user record (create if new, fetch if existing), issue JWT access token (RS256, 15-min TTL) + opaque refresh token (stored in `users` table or dedicated table, 30-day TTL)
  - Return `{ accessToken, refreshToken, user }`
  - Requirements: Req 1.3, Req 1.4, Req 1.6
  - Dependencies: Task 3.1, Task 2.2

- [ ] 3.3 Implement JWT access token + refresh token system
  - Create `apps/api/src/plugins/auth.ts` Fastify plugin for JWT verification middleware
  - `POST /auth/refresh` — validate refresh token, issue new access token
  - `POST /auth/logout` — revoke/delete refresh token
  - Requirements: Req 1.6, Req 29 (session security)
  - Dependencies: Task 3.2

- [ ] 3.4 Integrate Google OAuth (`POST /auth/social` with `provider=google`)
  - Exchange `id_token` with Google tokeninfo endpoint; extract `email`, `sub`, `name`
  - Upsert user by email; link federated identity
  - Issue ChopSave access + refresh tokens
  - Requirements: Req 1 (social login path), Design — External Services (Google OAuth)
  - Dependencies: Task 3.3

- [ ] 3.5 Integrate Apple OAuth (`POST /auth/social` with `provider=apple`)
  - Verify Apple identity token (JWT signed by Apple's public keys)
  - Upsert user; link federated identity
  - Issue ChopSave tokens
  - Requirements: Req 1, Design — External Services (Apple OAuth)
  - Dependencies: Task 3.3

- [ ] 3.6 Implement role-based access middleware
  - Create `requireRole(...roles)` Fastify hook — verify JWT claim, check role
  - Apply `requireRole('admin')`, `requireRole('business_owner')`, `requireRole('consumer')` per route group
  - Return HTTP 403 with descriptive error on role mismatch
  - Requirements: Req 13.6, Req 22, Design — RBAC Middleware
  - Dependencies: Task 3.3

---

### Phase 4 — User & Business Registration API

- [ ] 4.1 Implement user profile CRUD (`GET /users/me`, `PATCH /users/me`, `DELETE /users/me`)
  - `GET /users/me`: return full profile including dietary prefs, no-show count, suspension status
  - `PATCH /users/me`: update `display_name`, `avatar_url`, `dietary_prefs`, `fcm_token`; reflect within 2 seconds
  - `DELETE /users/me`: soft-delete — set `status='deleted'`, `deleted_at=NOW()`; schedule PII anonymisation job for 30 days
  - `PATCH /users/me/notifications`: update `notif_prefs` JSONB
  - Requirements: Req 2.1, Req 2.2, Req 2.4, Req 12.4
  - Dependencies: Task 3.6

- [ ] 4.2 Implement business registration endpoint (`POST /businesses/register`)
  - Collect: `business_name`, `type`, `cac_number` (validate 7-digit numeric), `address`, `city` (lagos/abuja), `lat`, `lng`, `contact_phone`, `owner_full_name`
  - Call `GeofenceService.isWithinSupportedCity(lat, lng, city)` using PostGIS `ST_Within` — reject with HTTP 422 if outside geofence
  - Create `business` record with `verification_tier='pending'`
  - Notify admin via `notificationQueue` (new business pending review)
  - Requirements: Req 13.1, Req 13.2, Req 13.3, Req 27.1
  - Dependencies: Task 3.6, Task 2.3, Task 2.14

- [ ] 4.3 Implement business profile CRUD (`GET /businesses/:id`, `PATCH /businesses/:id`)
  - `GET /businesses/:id` (public): return profile, active listing count, aggregate rating, recent reviews
  - `PATCH /businesses/:id` (owner): update description, photo_urls, address (re-validate geofence), contact_phone
  - Requirements: Req 13, Req 14
  - Dependencies: Task 4.2

- [ ] 4.4 Implement tiered verification logic
  - `verified_informal`: admin manually marks after basic review
  - `verified_cac`: admin marks after validating CAC number and uploaded documents
  - Blocked from creating listings while `verification_tier = 'pending'` or `'rejected'`
  - Requirements: Req 13.4, Req 13.5, Req 13.6, Req 22.3, Req 22.4
  - Dependencies: Task 4.2

- [ ] 4.5 Implement admin approve/reject business workflow
  - `POST /admin/businesses/:id/approve` — set `verification_tier='verified_informal'`; enqueue approval notification to business owner (push + SMS)
  - `POST /admin/businesses/:id/reject` — require `reason` (min 10 chars); set `verification_tier='rejected'`; store `rejection_reason`; enqueue rejection notification
  - Log action to `admin_actions` table
  - `GET /admin/businesses/pending` — list pending sorted by `created_at ASC`
  - Requirements: Req 22.1, Req 22.2, Req 22.3, Req 22.4, Req 22.5
  - Dependencies: Task 4.4, Task 3.6, Task 2.12

- [ ] 4.6 Bank account registration (`POST /businesses/:id/bank-accounts`)
  - Accept `bank_code`, `account_number`; call Paystack Resolve Account API to verify
  - Store verified account details (last-4 only for display) in business record or separate table
  - Requirements: Req 20.2, Design — Bank account registration
  - Dependencies: Task 4.3

---

### Phase 5 — Listings API (Geospatial)

- [ ] 5.1 Implement create listing endpoint (`POST /listings`)
  - Accept `type` (`surprise_bag` or `itemised`), `title`, `description`, `original_price`, `discount_price`, `quantity_total`, `pickup_start`, `pickup_end`, `food_categories` (1 primary + up to 2 secondary), `dietary_tags`, `photo_url`, `weight_kg`
  - Validate: business is verified, `discount_price <= 0.50 * original_price`, pickup window on same calendar day (WAT), `quantity_total >= 1`
  - For `itemised` type: accept nested `items[]` array, create `listing_items` rows
  - Requirements: Req 15.1, Req 15.2, Req 16.1, Req 16.2, Req 28
  - Dependencies: Task 4.4, Task 2.4

- [ ] 5.2 Implement listing update and item management endpoints
  - `PATCH /listings/:id` — allow editing `quantity`, `pickup_window`, `description`, `dietary_tags` only when no active reservations exist
  - `PATCH /listings/:id/status` — pause, resume, close (business owner only)
  - `DELETE /listings/:id` — only if zero reservations; remove from feed within 60 seconds
  - `POST /listings/:id/items`, `PATCH /listings/:id/items/:itemId`, `DELETE /listings/:id/items/:itemId`
  - Requirements: Req 15.5, Req 16.4, Req 16.5, Req 17.4
  - Dependencies: Task 5.1

- [ ] 5.3 Implement geospatial nearby listings query (`GET /listings/nearby`)
  - Accept query params: `lat`, `lng`, `radius` (default 5000m, options 1000/3000/5000/10000), `city`, `category`, `price_min`, `price_max`, `dietary`, `min_rating`
  - Execute PostGIS `ST_DWithin` + `ST_Within(geofence)` query as defined in design
  - Return listings sorted by `distance_metres ASC`, include business name, avg_rating, verification_tier
  - Text search: `?q=` param — case-insensitive partial match on listing title and business name
  - Requirements: Req 3.2, Req 3.7, Req 4.1, Req 4.2, Req 4.3
  - Dependencies: Task 5.1, Task 2.14

- [ ] 5.4 Implement listing expiry BullMQ worker
  - Queue: `listing-expiry`, schedule every 60 seconds (repeatable job)
  - Query: `UPDATE listings SET status='expired' WHERE status='active' AND pickup_end < NOW()`
  - Publish `listing.expired` event to Redis channel `channel:listings:{city}` for each expired listing
  - Requirements: Req 17.1, Req 3.6
  - Dependencies: Task 1.5, Task 2.4

- [ ] 5.5 Implement real-time listing feed via SSE + Redis pub/sub
  - `GET /sse/listings?city=lagos` (or `abuja`) — establish SSE connection
  - API subscribes to Redis channel `channel:listings:{city}` using ioredis `subscribe`
  - Forward events (`listing.created`, `listing.sold_out`, `listing.expired`, `listing.quantity_update`) as SSE data frames to connected clients
  - Requirements: Req 3.6, Req 15.3, Req 16.3, Design — Real-Time Updates
  - Dependencies: Task 1.4, Task 5.4

---

### Phase 6 — Reservations & Payments API

- [ ] 6.1 Implement reservation creation with quantity locking (`POST /reservations`)
  - Begin transaction; `SELECT quantity_remaining FROM listings WHERE id=? FOR UPDATE`
  - Validate `quantity_remaining >= requested_qty`; create reservation with `status='pending_payment'`; decrement `quantity_remaining`; commit
  - Generate `pickup_code` via `PickupCodeService.generate()` (6-char crypto-random, uppercase alphanumeric, unambiguous charset)
  - Calculate `commission_amt = ROUND(amount_paid * commission_rate / 100, 2)`, `payout_amt = amount_paid - commission_amt`
  - Validate `|payout_amt + commission_amt - amount_paid| < 0.01`
  - Requirements: Req 7.1, Req 7.4, Req 8.2, Req 21.1, Design — Quantity Invariant, Commission Invariant
  - Dependencies: Task 5.1, Task 3.6

- [ ] 6.2 Implement Paystack payment initiation (`POST /payments/initiate`)
  - Create `payment` record with `status='initiated'`
  - Call Paystack Initialize Transaction API with `amount` (in kobo), `email`, `reference`, `callback_url`
  - Return `{ payment_url, reference }` to client
  - Requirements: Req 7.2, Req 7.3, Req 7.8
  - Dependencies: Task 6.1

- [ ] 6.3 Implement Paystack webhook handler (`POST /payments/webhook/paystack`)
  - Verify `x-paystack-signature` header using HMAC-SHA512 with `PAYSTACK_WEBHOOK_SECRET`; return HTTP 401 if invalid
  - Handle `charge.success`: update `payment.status='successful'`, `reservation.status='confirmed'`; enqueue pickup reminder jobs (T-60min, T-30min); enqueue confirmation notification (push + SMS with pickup_code)
  - Handle `transfer.success` / `transfer.failed`: update payout record status
  - Requirements: Req 7.4, Req 7.6, Design — Payment Security (HMAC-SHA512)
  - Dependencies: Task 6.2

- [ ] 6.4 Implement USSD payment async confirmation flow
  - Present USSD shortcode to consumer on payment initiation when `method=ussd`
  - Payment confirmed asynchronously via same Paystack webhook (`charge.success`)
  - If USSD session expires after 5 minutes without webhook: release quantity and cancel pending reservation
  - Requirements: Req 26.2, Req 26.3, Req 26.4
  - Dependencies: Task 6.3

- [ ] 6.5 Implement pending payment expiry worker
  - Queue: `pending-payment-expiry`, schedule every 60 seconds
  - Find reservations with `status='pending_payment'` AND `created_at < NOW() - INTERVAL '10 minutes'`
  - For each: increment `listing.quantity_remaining` and set `reservation.status='cancelled'`
  - Requirements: Design — pending-payment-expiry worker
  - Dependencies: Task 1.5, Task 6.1

- [ ] 6.6 Implement reservation cancellation and refund logic (`POST /reservations/:id/cancel`)
  - If cancelled > 1 hour before `pickup_start`: initiate full Paystack refund; set `reservation.status='refunded'`; restore quantity
  - If cancelled ≤ 1 hour before `pickup_start`: set `reservation.status='cancelled'`; no refund; do not restore quantity
  - Requirements: Req 9.2, Req 9.3
  - Dependencies: Task 6.3

---

### Phase 7 — Pickup & Collection API

- [ ] 7.1 Implement pickup code validation endpoint (`POST /reservations/:id/collect`)
  - Accept `pickup_code` from business
  - Validate: reservation exists, belongs to business, `status='confirmed'` or `'ready'`, code matches
  - On success: set `reservation.status='completed'`, `collected_at=NOW()`, add `payout_amt` to `business.payout_balance`, update `business.food_saved_kg` and `business.co2_saved_kg`
  - Return HTTP 422 with descriptive error for invalid or already-used code
  - Requirements: Req 18.3, Req 18.4, Req 18.5, Req 20.1
  - Dependencies: Task 6.3

- [ ] 7.2 Implement mark order ready for pickup (`PATCH /business/orders/:id/ready`)
  - Set `reservation.status='ready'`
  - Enqueue `ORDER_READY` notification to consumer (push; SMS fallback)
  - Requirements: Req 18.2, Req 12.3
  - Dependencies: Task 7.1

- [ ] 7.3 Implement no-show automation worker
  - Queue: `no-show-automation`, schedule every 60 seconds
  - Find reservations where `status IN ('confirmed','ready')` AND `listing.pickup_end < NOW()`
  - Update each to `status='no_show'`, `no_show_at=NOW()`
  - Enqueue `NO_SHOW` notification to consumer and business
  - Requirements: Req 8.4, Req 9.4, Design — no-show-automation worker, Correctness Property 5
  - Dependencies: Task 1.5, Task 6.1

- [ ] 7.4 Implement daily no-show suspension check worker
  - Queue: `no-show-suspension-check`, schedule daily (e.g. 02:00 WAT)
  - Find consumers where `no_show_count >= 3` within rolling 30-day window (`no_show_window_start`)
  - Set `users.suspended_until = NOW() + INTERVAL '7 days'`; enqueue `ACCOUNT_SUSPENDED` notification
  - Requirements: Req 9.5, Design — no-show-suspension-check worker
  - Dependencies: Task 7.3

---

### Phase 8 — Notifications System

- [ ] 8.1 Create FCM push notification service wrapper
  - Create `apps/api/src/lib/fcm.ts` using Firebase Admin SDK
  - Expose `sendPush(fcmToken, title, body, data)` — handle FCM errors gracefully (invalid token, unregistered device)
  - Requirements: Req 12, Design — Notification Delivery Strategy
  - Dependencies: Task 1.6

- [ ] 8.2 Create Termii SMS service wrapper
  - Create `apps/api/src/lib/termii.ts`
  - Expose `sendSms(phone, message)` — wrap Termii Send Message API with retry on transient failure
  - Requirements: Req 1.2, Req 12.5, Design — SMS: Termii
  - Dependencies: Task 1.6

- [ ] 8.3 Implement notification dispatch BullMQ worker
  - Queue: `notification-dispatch` (immediate, high priority)
  - Worker receives `{ userId, type, title, body, payload, channels[] }`
  - For each channel: check `users.notif_prefs` → call FCM or Termii accordingly; write row to `notifications` table
  - Requirements: Req 12, Design — Notification Delivery Strategy
  - Dependencies: Task 8.1, Task 8.2, Task 2.9

- [ ] 8.4 Schedule pickup reminder jobs on reservation confirmation
  - On `charge.success` webhook: enqueue `reminder-60min` job with `delay = pickupStart - now - 60min`; enqueue `reminder-30min` job with `delay = pickupEnd - now - 30min`
  - Worker dispatches `PICKUP_REMINDER_60` / `PICKUP_REMINDER_30` notification via `notification-dispatch`
  - Requirements: Req 12.2, Design — Scheduled Notification Jobs
  - Dependencies: Task 8.3, Task 6.3

- [ ] 8.5 Implement new listing nearby fan-out notification
  - On listing publish: query consumers within listing's radius whose `notif_prefs` include `new_listing_nearby=true`
  - Batch-enqueue `NEW_LISTING_NEARBY` notifications via `notification-dispatch`
  - Requirements: Req 12.1
  - Dependencies: Task 8.3, Task 5.1

- [ ] 8.6 Implement favourites new listing notification
  - On listing publish: query `favourites` where `business_id = listing.business_id`; enqueue `NEW_LISTING_FAVOURITE` for each consumer
  - Requirements: Req 11.3
  - Dependencies: Task 8.3, Task 2.8

- [ ] 8.7 Implement in-app notification inbox endpoints
  - `GET /notifications` — return paginated list of user's notifications, sorted `created_at DESC`
  - `PATCH /notifications/:id/read` — set `read=true`
  - `PATCH /notifications/read-all` — set `read=true` for all user's unread notifications
  - Requirements: Req 12, Design — Notifications API
  - Dependencies: Task 8.3

- [ ] 8.8 Implement notification preference management
  - `PATCH /users/me/notifications` — update `users.notif_prefs` JSONB per notification type
  - Validate keys against `NotificationType` enum
  - Requirements: Req 12.4
  - Dependencies: Task 4.1

---

### Phase 9 — Ratings & Reviews

- [ ] 9.1 Implement submit rating endpoint (`POST /ratings`)
  - Accept `reservation_id`, `stars` (1–5), `review` (optional, max 300 chars), `flag_tag` (optional)
  - Validate: reservation is `completed` or `no_show`; rater is either consumer or business owner of that reservation; `(reservation_id, rater_id)` unique constraint enforced
  - On consumer→business rating: trigger aggregate recalculation (see 9.2)
  - Requirements: Req 10.2, Req 10.3, Req 19.1, Req 19.2, Req 19.3
  - Dependencies: Task 7.1, Task 2.7

- [ ] 9.2 Business aggregate rating recalculation
  - After every new consumer→business rating: `UPDATE businesses SET avg_rating = (SELECT AVG(stars) FROM ratings WHERE ratee_id = b.user_id AND ratee_type = 'business'), total_ratings = total_ratings + 1 WHERE id = :businessId`
  - Reflect on business profile within 5 minutes
  - Requirements: Req 10.4, Req 10.5
  - Dependencies: Task 9.1

- [ ] 9.3 No-show flag recording and buyer suspension trigger
  - When business submits rating with `flag_tag='No Show'`: increment `users.no_show_count`; update `no_show_window_start` if outside rolling 30-day window
  - Enqueue `no-show-suspension-check` job for immediate evaluation
  - Requirements: Req 19.4, Req 9.4, Req 9.5
  - Dependencies: Task 9.1, Task 7.4

- [ ] 9.4 Rating display on business profile
  - `GET /businesses/:id/ratings` — return paginated ratings (page size 10), sorted `created_at DESC`
  - Include `avg_rating` and `total_ratings` in `GET /businesses/:id` response
  - Requirements: Req 10.5, Req 6.1
  - Dependencies: Task 9.2

---

### Phase 10 — Payouts & Earnings

- [ ] 10.1 Business earnings dashboard endpoint (`GET /businesses/:id/stats`)
  - Return: gross revenue, commission deducted, net payout earned — broken down by day/week/month (via `?period=` param)
  - Include time-series chart data for past 30 days
  - Return `food_saved_kg`, `co2_saved_kg` from businesses table
  - Requirements: Req 14.1, Req 14.2, Req 14.3, Req 14.4
  - Dependencies: Task 7.1

- [ ] 10.2 Implement manual payout request endpoint (`POST /payouts/request`)
  - Validate: `amount >= 500 NGN`, `amount <= business.payout_balance`, registered bank account exists
  - Create payout record with `status='pending'`; immediately lock payout amount from balance
  - Requirements: Req 20.2, Req 20.3
  - Dependencies: Task 4.6, Task 2.10

- [ ] 10.3 Implement daily payout settlement BullMQ job
  - Queue: `payout-settlement`, cron `0 9 * * 1-5` (10:00 WAT = 09:00 UTC on weekdays)
  - Query businesses with `payout_balance >= 500` and no pending payout; for each: call Paystack Transfer API; create payout record; deduct from `payout_balance`
  - Handle transfer success/failure via Paystack webhook (Task 6.3)
  - On failure: restore balance; enqueue `PAYOUT_FAILED` notification
  - Requirements: Req 20.3, Req 20.4, Req 20.5, Design — Daily Payout Settlement
  - Dependencies: Task 1.5, Task 4.6

- [ ] 10.4 Implement payout history endpoint (`GET /payouts/history`)
  - Return paginated list: `amount`, `status`, `requested_at`, `completed_at`, last 4 digits of bank account
  - Requirements: Req 20.6
  - Dependencies: Task 10.2

- [ ] 10.5 Impact stats calculation
  - `food_saved_kg` updated on reservation completion: `business.food_saved_kg += reservation.quantity * listing.weight_kg`
  - `co2_saved_kg = food_saved_kg * system_config['co2_per_kg_food']`
  - Expose in `GET /businesses/:id/stats` and admin analytics
  - Requirements: Req 14.3, Req 23.1, Design — ImpactStatsService
  - Dependencies: Task 7.1, Task 2.13

---

### Phase 11 — Admin Dashboard API

- [ ] 11.1 Implement platform analytics endpoint (`GET /admin/analytics`)
  - Return: total consumers, verified businesses, all-time reservations, completed pickups, total commission earned (NGN), total `food_saved_kg`
  - Time-series: daily reservations and commission for configurable date range up to 90 days
  - Filter by `?city=lagos|abuja`
  - Cache result with 15-minute TTL in Redis
  - Requirements: Req 23.1, Req 23.2, Req 23.3, Req 23.4
  - Dependencies: Task 3.6, Task 10.5

- [ ] 11.2 Implement disputes queue and resolution endpoints
  - `GET /admin/disputes` — list open disputes sorted by `raised_at ASC`
  - `POST /admin/disputes/:id/resolve` — accept `resolution` (full_refund/partial_refund/no_refund) and mandatory `resolution_note`; update dispute status; trigger Paystack refund if applicable within 24 hours; notify consumer and business
  - `POST /reservations/:id/dispute` — consumer raises dispute within 24h of pickup_end
  - Requirements: Req 25.1, Req 25.2, Req 25.3, Req 25.4
  - Dependencies: Task 3.6, Task 6.6

- [ ] 11.3 Implement user suspension/ban endpoints with audit log
  - `POST /admin/users/:id/suspend` — set `users.suspended_until`; hide active listings; log to `admin_actions`
  - `POST /admin/users/:id/ban` — set `users.status='deleted'`; log to `admin_actions`
  - `POST /admin/businesses/:id/suspend` — set business inactive; hide listings from feed; log action
  - Requirements: Req 24.5, Design — Admin API
  - Dependencies: Task 3.6, Task 2.12

- [ ] 11.4 Implement system config CRUD (`GET /admin/config`, `PATCH /admin/config/:key`)
  - `GET /admin/config` — return all key-value pairs
  - `PATCH /admin/config/:key` — update value; validate numeric keys are in-range (e.g. commission 15–20%)
  - Requirements: Req 21.4, Design — system_config
  - Dependencies: Task 2.13, Task 3.6

---

### Phase 12 — Consumer Mobile App (React Native / Expo)

- [ ] 12.1 Implement authentication flow screens
  - `PhoneEntryScreen` — phone number input with Nigerian format validation and country picker
  - `OTPVerifyScreen` — 6-digit OTP input, countdown timer, resend button (enabled after 60s)
  - `SocialLoginButtons` — Google and Apple sign-in buttons (Expo AuthSession)
  - On success: persist tokens in `expo-secure-store`; navigate to Feed
  - Requirements: Req 1.1, Req 1.2, Req 1.3, Req 1.4, Req 1.5
  - Dependencies: Task 3.2, Task 3.4, Task 3.5

- [ ] 12.2 Implement Near Me feed screen (list view)
  - Request GPS permission on mount; fall back to manual city/area input if denied
  - Fetch `GET /listings/nearby` with user coordinates; render `ListingCard` components
  - Each card shows: business name, listing type, discounted price, struck-through original price, distance, pickup window, remaining quantity, dietary tags, food category icon/label
  - Auto-refresh every 60 seconds; subscribe to SSE for real-time updates
  - Filter panel: max distance, category, price range, dietary tag, min rating
  - Requirements: Req 3.1, Req 3.2, Req 3.3, Req 3.4, Req 3.5, Req 3.6, Req 4.1, Req 4.2, Req 4.3, Req 28.3
  - Dependencies: Task 5.3, Task 5.5

- [ ] 12.3 Implement map view tab
  - `MapViewScreen` using `react-native-maps`
  - Centred on user GPS; render business pins for all active listings
  - Pin tap → summary card (business name, active listing count, nearest pickup window, lowest price)
  - Summary card tap → navigate to business profile
  - Update pins when location changes > 200 m
  - Requirements: Req 5.1, Req 5.2, Req 5.3, Req 5.4
  - Dependencies: Task 12.2

- [ ] 12.4 Implement listing detail screen
  - Show all fields from Req 6.1: type, business name + rating, category, description, photo, discounted/original price, pickup window, remaining quantity, dietary tags, address
  - "Reserve" button visible when `quantity > 0` and pickup window not ended; replaced by "Sold Out" or "Expired" indicators otherwise
  - Favourite toggle button
  - Requirements: Req 6.1, Req 6.2, Req 6.3, Req 11.1
  - Dependencies: Task 12.2

- [ ] 12.5 Implement Surprise Bag checkout flow
  - `QuantitySelectorScreen` → `PaymentMethodSelectorScreen` → `PaymentScreen` → `OrderConfirmationScreen`
  - Show no-show policy before confirm
  - Payment method options: card, bank transfer, USSD, OPay/wallet
  - All amounts in NGN only
  - Complete payment initiation within 5 seconds
  - Requirements: Req 7.1, Req 7.2, Req 7.3, Req 7.7, Req 7.8, Req 9.1
  - Dependencies: Task 6.2, Task 12.4

- [ ] 12.6 Implement Itemised listing checkout (item selection + quantity)
  - Display individual items with name, description, price, dietary tags, photos
  - Allow selection of item quantities; show running total
  - Same payment flow as surprise bag checkout
  - Requirements: Req 16.1, Req 7
  - Dependencies: Task 12.5

- [ ] 12.7 Implement order confirmation screen with pickup code
  - Full-screen card: QR code (react-native-qrcode-svg) + 6-character alphanumeric code
  - Cache reservation data (pickup_code, address, pickup_window) in `AsyncStorage` for offline display
  - Requirements: Req 7.6, Req 8.2, Req 8.3
  - Dependencies: Task 12.5

- [ ] 12.8 Implement Orders screen (active + history)
  - Active orders sorted by pickup_window ASC; tap → pickup code card
  - History with status badge (Completed / No_Show / Cancelled) and amount paid
  - Requirements: Req 8.1, Req 8.5
  - Dependencies: Task 12.7

- [ ] 12.9 Implement Favourites screen
  - List saved businesses with active listing count and next pickup window
  - Add/remove favourite from business profile or feed card
  - Requirements: Req 11.1, Req 11.2
  - Dependencies: Task 12.4

- [ ] 12.10 Implement Profile screen
  - Display name, avatar (upload via S3 pre-signed URL), dietary preferences
  - Notification preference toggles per notification type
  - View own ratings and review history
  - Account deletion with confirmation dialog
  - Requirements: Req 2.1, Req 2.2, Req 2.3, Req 2.4, Req 12.4
  - Dependencies: Task 4.1

---

### Phase 13 — Business Mobile App (React Native)

- [ ] 13.1 Implement business dashboard screen
  - Show: active listing count, today's reservations, all-time completed pickups, net earnings (NGN), food saved (kg)
  - 30-day time-series chart (react-native-chart-kit or Victory Native)
  - Refresh metrics within 5 seconds of load
  - Requirements: Req 14.1, Req 14.2, Req 14.3, Req 14.4
  - Dependencies: Task 10.1

- [ ] 13.2 Implement Create Surprise Bag listing flow
  - Form: price (NGN), quantity, pickup start/end (same-day time picker, WAT), food category, dietary tags, optional photo (camera + gallery, upload to S3)
  - Validate: discount ≤ 50% of original; pickup window same day
  - Submit → `POST /listings` → success confirmation
  - Requirements: Req 15.1, Req 15.2, Req 15.3, Req 15.4
  - Dependencies: Task 5.1

- [ ] 13.3 Implement Create Itemised Listing flow
  - Multi-step form: listing header (pickup window, category) → add items (name, description ≤200 chars, original price, discounted price, quantity, dietary tags, photo)
  - Submit all at once → `POST /listings` with items array
  - Requirements: Req 16.1, Req 16.2, Req 16.3
  - Dependencies: Task 5.1

- [ ] 13.4 Implement Manage Listings screen
  - List active and paused listings with status badges
  - Inline actions: edit quantity/pickup window, pause, resume, close, delete (zero reservations only)
  - Requirements: Req 15.5, Req 16.4, Req 16.5, Req 17.4
  - Dependencies: Task 5.2

- [ ] 13.5 Implement Orders/Reservations screen (today's orders)
  - Show today's reservations grouped by listing: consumer name, reservation time, quantity, pickup code (last 4 chars), pickup window, status
  - Mark order as Ready for Pickup button
  - Real-time updates via SSE or polling
  - Requirements: Req 18.1, Req 18.2, Req 18.6
  - Dependencies: Task 7.2

- [ ] 13.6 Implement QR code scanner screen
  - Use `expo-camera` or `react-native-vision-camera` to scan consumer QR code
  - Extract pickup code from QR; call `POST /reservations/:id/collect`
  - Manual entry fallback input field
  - Show success or error feedback
  - Requirements: Req 18.3, Req 18.4, Design — Pickup Code System (offline fallback)
  - Dependencies: Task 7.1

- [ ] 13.7 Implement Earnings screen
  - Show payout balance, earnings breakdown (gross/commission/net) by day/week/month
  - Payout request flow: select amount, confirm bank account, submit
  - Payout history list
  - Requirements: Req 20.1, Req 20.2, Req 20.6
  - Dependencies: Task 10.2, Task 10.4

---

### Phase 14 — Web App (Next.js 14)

- [ ] 14.1 Implement public landing page
  - Hero section, value proposition, how-it-works steps, city coverage (Lagos & Abuja)
  - CTA buttons: "Find Food Near You" → consumer login, "List Your Business" → business registration
  - SEO metadata, OpenGraph tags
  - Requirements: Design — Web App (Next.js 14)
  - Dependencies: Task 1.1

- [ ] 14.2 Implement consumer auth pages (phone OTP flow)
  - `/login` — phone number entry
  - `/verify` — OTP entry with resend
  - `/auth/callback/google`, `/auth/callback/apple` — OAuth callback handlers
  - Persist JWT in httpOnly cookie or secure localStorage
  - Requirements: Req 1
  - Dependencies: Task 3.2, Task 3.4, Task 3.5

- [ ] 14.3 Implement consumer Near Me feed page (list + map)
  - Server component fetches initial listings via `GET /listings/nearby`
  - Client component subscribes to SSE for real-time updates
  - List view + toggleable map view (react-leaflet or Google Maps JS API)
  - Filter sidebar
  - Requirements: Req 3, Req 4, Req 5
  - Dependencies: Task 5.3, Task 5.5

- [ ] 14.4 Implement listing detail page
  - SSR via Next.js `generateMetadata` for SEO
  - Reserve flow (same UX steps as mobile)
  - Requirements: Req 6, Req 7
  - Dependencies: Task 14.3

- [ ] 14.5 Implement consumer checkout pages
  - `/checkout/:reservationId/payment` — payment method selector, Paystack popup or redirect
  - `/checkout/:reservationId/confirm` — order confirmation with QR code (qrcode.react) + alphanumeric code
  - Requirements: Req 7, Req 8.2
  - Dependencies: Task 6.2

- [ ] 14.6 Implement consumer orders and profile pages
  - `/orders` — active + history
  - `/profile` — edit display name, avatar, dietary prefs, notification settings, account deletion
  - Requirements: Req 8, Req 2
  - Dependencies: Task 4.1

- [ ] 14.7 Implement business partner portal
  - `/business/dashboard` — stats overview
  - `/business/listings/create` — surprise bag + itemised forms
  - `/business/listings` — manage listings
  - `/business/orders` — today's orders, mark ready, manual code entry (no camera on web)
  - `/business/earnings` — payout dashboard + request
  - `/business/settings` — profile, bank account, notification prefs
  - Requirements: Req 13–20
  - Dependencies: Task 10.1, Task 10.4, Task 5.2

- [ ] 14.8 Implement admin dashboard
  - `/admin/businesses/pending` — verification queue with approve/reject actions
  - `/admin/disputes` — disputes queue with resolve action
  - `/admin/analytics` — platform metrics with city filter and date range charts
  - `/admin/users` — search, suspend, ban
  - `/admin/config` — system config editor
  - Server components with admin-only route protection
  - Requirements: Req 22, Req 23, Req 24, Req 25
  - Dependencies: Task 11.1, Task 11.2, Task 11.3, Task 11.4

---

### Phase 15 — Testing

- [ ] 15.1 Unit tests: PickupCodeService
  - Test format: output is exactly 6 characters, all chars from unambiguous charset (`ABCDEFGHJKLMNPQRSTUVWXYZ23456789`)
  - Test uniqueness: generate 10,000 codes and assert no duplicates (probabilistic)
  - Requirements: Design — Pickup Code System, Correctness Property 3
  - Dependencies: Task 6.1

- [ ] 15.2 Unit tests: GeofenceService
  - Test `isWithinSupportedCity` with coordinates clearly inside Lagos, inside Abuja, outside both
  - Test boundary coordinates (on polygon edge)
  - Requirements: Req 27, Design — Geospatial Design
  - Dependencies: Task 5.3

- [ ] 15.3 Unit tests: commission calculation
  - Test `commissionAmt = ROUND(amountPaid * rate / 100, 2)` for various amounts and rates (15%–20%)
  - Test invariant: `|payoutAmt + commissionAmt - amountPaid| < 0.01` holds for all tested inputs
  - Requirements: Req 21, Design — Commission Calculation, Correctness Property 2
  - Dependencies: Task 6.1

- [ ] 15.4 Property-based tests with fast-check: quantity invariant
  - For arbitrary `quantity_total` and sequence of reservations: assert `quantity_remaining >= 0` always
  - Assert sum of confirmed reservation quantities never exceeds `quantity_total`
  - Requirements: Design — Correctness Property 1
  - Dependencies: Task 6.1

- [ ] 15.5 Property-based tests with fast-check: commission invariant
  - For arbitrary `amount_paid` (positive, up to ₦1,000,000) and `commission_rate` (15–20): assert `|payout + commission - amount| < 0.01`
  - Requirements: Design — Correctness Property 2
  - Dependencies: Task 15.3

- [ ] 15.6 Property-based tests with fast-check: pickup code uniqueness
  - Generate 1,000 codes via arbitrary seeds; assert all are distinct and match format regex `^[A-HJ-NP-Z2-9]{6}$`
  - Requirements: Design — Correctness Property 3
  - Dependencies: Task 15.1

- [ ] 15.7 Property-based tests with fast-check: rating idempotency
  - For arbitrary `(reservation_id, rater_id)` pairs: assert submitting the same rating twice returns a unique-constraint error and does not create duplicate rows
  - Requirements: Design — Correctness Property 4, Req 10.3, Req 19.3
  - Dependencies: Task 9.1

- [ ] 15.8 Integration tests: reservation + payment flow
  - Spin up test PostgreSQL and Redis instances (e.g. `testcontainers`)
  - Full flow: create listing → reserve → initiate payment → simulate Paystack webhook → assert `reservation.status='confirmed'`, `listing.quantity_remaining` decremented, pickup code generated
  - Requirements: Req 7.4, Design — Payment & Commission Flow
  - Dependencies: Task 6.3

- [ ] 15.9 Integration tests: webhook handling
  - Test valid HMAC-SHA512 signature → 200 OK and status updates
  - Test tampered payload (invalid signature) → 401
  - Test duplicate webhook delivery (idempotency) → no double-confirmation
  - Requirements: Req 7.3, Design — Payment Security
  - Dependencies: Task 6.3

- [ ] 15.10 Integration tests: no-show automation
  - Insert a `confirmed` reservation with `pickup_end` in the past
  - Trigger worker manually; assert `reservation.status='no_show'` within expected time
  - Assert `no_show_count` incremented; assert suspension triggered after 3rd no-show within 30 days
  - Requirements: Req 9.4, Req 9.5, Design — Correctness Property 5
  - Dependencies: Task 7.3, Task 7.4

- [ ] 15.11 API endpoint tests with Supertest: auth endpoints
  - `POST /auth/otp/send` — valid phone, invalid phone, rate-limit (6th request), E.164 normalisation
  - `POST /auth/otp/verify` — correct OTP, incorrect OTP (3 attempts → lockout), expired OTP
  - `POST /auth/refresh` — valid token, expired token, revoked token
  - Requirements: Req 1, Req 29.4
  - Dependencies: Task 3.2, Task 3.3

- [ ] 15.12 API endpoint tests with Supertest: listings endpoints
  - `GET /listings/nearby` — results within radius, geofence exclusion, filter combination
  - `POST /listings` — valid surprise bag, invalid discount (>50%), unverified business (403), missing fields (422)
  - `PATCH /listings/:id` — edit with zero reservations succeeds; edit with active reservation fails
  - Requirements: Req 3, Req 4, Req 15, Req 16
  - Dependencies: Task 5.1, Task 5.3

- [ ] 15.13 API endpoint tests with Supertest: reservations endpoints
  - `POST /reservations` — successful reserve, over-quantity (422), concurrent requests (quantity lock)
  - `POST /reservations/:id/cancel` — >1hr before pickup (full refund path), <1hr (no refund path)
  - `POST /reservations/:id/collect` — valid code, invalid code, already-used code
  - Requirements: Req 7, Req 9
  - Dependencies: Task 6.1, Task 7.1

---

## Task Dependency Graph

```
Phase 1 (Infrastructure)
  1.1 → 1.2, 1.3, 1.4, 1.5, 1.6, 1.7
  1.2 → 1.3
  1.3 → Phase 2 (all migrations)
  1.4 → 1.5, 3.1, 8.1, 8.2
  1.5 → 5.4, 6.5, 7.3, 7.4, 8.3, 10.3
  1.6 → 8.1, 8.2

Phase 2 (Database)
  2.1 → 2.2
  2.2 → 2.3, 2.9, 2.12, 2.13, 2.14
  2.3 → 2.4, 2.8, 2.10
  2.4 → 2.5
  2.5 → 2.6, 2.7, 2.11
  2.13 → Phase 10 (payouts/config)
  2.14 → 4.2, 5.3

Phase 3 (Auth)
  3.1 → 3.2
  3.2 → 3.3, 12.1, 14.2
  3.3 → 3.4, 3.5, 3.6
  3.6 → Phase 4, 5, 6, 7, 8, 9, 10, 11

Phase 4 (Users & Businesses)
  4.1 → 8.8, 12.10
  4.2 → 4.3, 4.4
  4.3 → 4.6
  4.4 → 4.5, 5.1
  4.6 → 10.2, 10.3

Phase 5 (Listings)
  5.1 → 5.2, 5.4, 5.5, 8.5, 8.6, 13.2, 13.3
  5.3 → 12.2, 14.3
  5.5 → 12.2, 14.3

Phase 6 (Reservations & Payments)
  6.1 → 6.2, 6.5, 6.6, 15.4, 15.5, 15.6
  6.2 → 6.3, 6.4, 14.5
  6.3 → 6.4, 6.6, 7.1, 8.4, 15.8, 15.9

Phase 7 (Pickup)
  7.1 → 7.2, 7.3, 9.1, 10.1, 10.5, 13.6, 15.13
  7.3 → 7.4, 9.3, 15.10
  7.4 → 9.3

Phase 8 (Notifications)
  8.1 → 8.3
  8.2 → 8.3
  8.3 → 8.4, 8.5, 8.6, 8.7

Phase 9 (Ratings)
  9.1 → 9.2, 9.3, 9.4

Phase 10 (Payouts)
  10.1 → 13.1, 13.7, 14.7
  10.2 → 10.3, 10.4, 13.7
  10.5 → 11.1

Phase 11 (Admin)
  11.1 → 14.8
  11.2 → 14.8
  11.3 → 14.8
  11.4 → 14.8

Phase 12 (Consumer Mobile)
  12.2 → 12.3, 12.4
  12.4 → 12.5, 12.6, 12.9
  12.5 → 12.7
  12.7 → 12.8

Phase 13 (Business Mobile)
  13.2 → 13.4
  13.3 → 13.4
  13.5 → 13.6

Phase 14 (Web)
  14.3 → 14.4
  14.4 → 14.5
  14.5 → 14.6
  14.6, 14.7, 14.8 → final delivery

Phase 15 (Testing)
  15.1 → 15.6
  15.3 → 15.5
  15.4, 15.5, 15.6, 15.7 → property-based suite complete
  15.8, 15.9, 15.10 → integration suite complete
  15.11, 15.12, 15.13 → API test suite complete
```

---

## Notes

- **Currency**: All monetary values are in NGN (Nigerian Naira). Paystack requires amounts in kobo (multiply NGN by 100 before API calls).
- **Timezone**: All WAT-sensitive operations (pickup window same-day check, payout cron, no-show check) must use `Africa/Lagos` (UTC+1).
- **Commission rate**: Defaults to 18% but is configurable per business tier via `system_config`. Valid range is 15–20% inclusive.
- **Pickup code charset**: Use only unambiguous characters — `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (excludes I, O, 0, 1).
- **Geofence**: Lagos and Abuja polygons are approximate bounding boxes for MVP; replace with higher-fidelity polygons before production.
- **NDPR compliance**: PII anonymisation on account deletion must complete within 30 days; financial transaction records must be retained for 7 years.
- **Photo storage**: Use S3 pre-signed URLs for upload; store only the resulting object URL in the database. Never serve photos directly from the API.
- **Offline support (mobile)**: Reservation data (pickup_code, address, pickup_window) must be cached in `AsyncStorage` at confirmation time for offline QR display.
- **Webhook idempotency**: Paystack and Flutterwave may deliver webhooks more than once. All webhook handlers must be idempotent (check `payment.gateway_ref` uniqueness before processing).
- **Testing environments**: Use `testcontainers` (Node.js) for integration tests requiring real PostgreSQL + PostGIS and Redis instances. Do not mock the database layer in integration tests.
- **BullMQ repeatable jobs**: Listing expiry, no-show automation, and pending-payment expiry workers use repeatable jobs (every 60s). Ensure only one instance of each repeatable job key is registered on worker startup.
