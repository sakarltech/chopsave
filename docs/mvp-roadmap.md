# ChopSave MVP Roadmap

## Purpose

This is the working implementation roadmap for getting ChopSave to a testable MVP in 8 weeks. It is intentionally narrower than the full product requirements: the first release is a Lagos-only Web PWA pilot, with surprise bags as the default listing type, manual business verification, manual payouts, and Railway-hosted staging/production.

This document should be updated after each implementation phase with current status, blockers, and next priorities.

## MVP Direction

- Primary client: Web PWA.
- Pilot market: Lagos only.
- Core marketplace model: businesses list discounted surplus food, consumers reserve and pay, then collect with a pickup code.
- MVP listing type: surprise bags first; itemised listings move to post-MVP unless they become trivial to polish.
- Operations model: manual business verification and manual payouts for the first pilot.
- Hosting default: Railway for staging and pilot production.

## Current App Assessment

### Backend

The backend is the strongest part of the repo. It has meaningful implementation for the marketplace domain, but it still needs build hardening, integration testing, deployment configuration, and client wiring before it can support a pilot.

| Area | Current status | Notes |
| --- | --- | --- |
| API app wiring | Mostly implemented | Fastify registers auth, users, businesses, admin, listings, reservations, payments, business orders, notifications, ratings, payouts, and SSE routes. |
| Database schema | Mostly implemented | Migrations cover users, businesses, listings, reservations, payments, ratings, favourites, notifications, payouts, disputes, admin actions, system config, geofences, and refresh tokens. |
| Auth and sessions | Partially implemented | OTP, refresh token, logout, and auth middleware exist, but real client flow and production SMS verification still need end-to-end testing. |
| Business registration | Mostly implemented | API validates business data, geofence, and queues admin review. Admin UI still needs to be built. |
| Listings | Mostly implemented | API supports creation, nearby discovery, listing detail, management, itemised items, and Redis/SSE events. Client experience is not ready. |
| Reservations | Mostly implemented | API supports create, cancel, list, detail, collect, pickup code, and pending-payment expiry handling. Needs end-to-end payment testing. |
| Payments | Partially implemented | Paystack initiation and webhook handling exist. Client payment flow and real Paystack staging/live verification are not done. |
| Pickup collection | Mostly implemented | Business collection by pickup code exists. QR/scanner/client screens need completion. |
| Admin | Partially implemented | Admin routes exist, but a minimal admin web panel is required for MVP operations. |
| Workers and queues | Partially implemented | BullMQ workers exist for expiry, no-show, reminders, notifications, payouts, and payment timeout. Worker bootstrapping and operational monitoring need verification. |
| Notifications | Partially implemented | Notification storage/queues/providers exist. MVP can start with SMS/in-app and defer push polish. |
| Railway staging | Partially implemented | A GitHub Actions Railway staging workflow and docs exist. Secrets/services still need to be configured and tested. |
| CI/build | Mostly implemented | Lint, type-check, and test commands now pass locally; GitHub Actions verifies pull requests to `main`. Railway staging validation remains outstanding. |

### Web App

The web app is currently a placeholder shell, not an MVP-ready PWA. The landing page exists, but the feed, login, business, and admin pages need real data flows, form handling, auth/session state, loading/error states, and mobile-friendly PWA polish.

### Mobile App

The mobile app has partial screen components, but it is not MVP-ready. The package uses `expo-router/entry`, yet the expected Expo Router `app/` route tree is not present. The mobile app should be treated as post-MVP or secondary during the 8-week Web PWA pilot.

## Competitor Baseline

### Too Good To Go

Too Good To Go sets the closest category benchmark:

- Consumers discover nearby surplus food.
- Businesses sell discounted surprise bags.
- Users reserve and pay in-app.
- Pickup happens during a defined collection window.
- The product emphasizes food-waste impact.
- Businesses use the platform as a partner marketplace to monetize surplus.

Reference: [Too Good To Go](https://en.wikipedia.org/wiki/Too_Good_To_Go)

### Foodsi

Foodsi is a similar anti-food-waste marketplace:

- Consumers browse nearby packages from restaurants, cafes, bakeries, and shops.
- Cards typically communicate price, discount, distance/address, and pickup time.
- Businesses create discounted packages from unsold food.

Reference: [Foodsi](https://en.wikipedia.org/wiki/Foodsi)

### OLIO

OLIO is adjacent rather than directly equivalent:

- It is more community/peer-sharing oriented.
- It is useful inspiration for community growth and surplus-food education.
- It should not drive MVP marketplace mechanics because ChopSave is a paid consumer-to-business pickup model.

Reference: [OLIO](https://en.wikipedia.org/wiki/Olio_%28app%29)

## Feature Matrix

### Must-Have MVP

| Feature | Current status | Release phase | MVP notes |
| --- | --- | --- | --- |
| OTP login | Partially implemented | MVP | API exists; build Web PWA phone entry, OTP verify, token persistence, logout, and error states. |
| Consumer nearby feed | Partially implemented | MVP | API exists; build Web PWA feed with Lagos default, manual area fallback, listing cards, loading, empty, and error states. |
| Listing detail | Partially implemented | MVP | API exists; build detail page with price, discount, pickup window, business, quantity, policy, and reserve CTA. |
| Business onboarding | Partially implemented | MVP | API exists; build business registration UI and link it to admin verification. |
| Admin approval | Partially implemented | MVP | Routes exist; build minimal admin web panel for pending businesses, approve/reject, and business detail. |
| Business listing creation | Partially implemented | MVP | API and partial mobile screen exist; build Web PWA creation flow for surprise bags. |
| Reservation and payment | Partially implemented | MVP | API exists; wire reservation creation, Paystack initiation, callback state, webhook confirmation, and timeout handling. |
| Pickup code | Partially implemented | MVP | API pickup code exists; build consumer order screen with code and business manual confirmation. |
| Business order collection | Partially implemented | MVP | API exists; build business order queue and collect-by-code workflow. |
| Basic order history | Partially implemented | MVP | API likely exists; build consumer active and past order views. |
| Staging deployment | Partially implemented | MVP | Railway workflow exists; configure secrets/services and test deploy. |
| Minimal support/admin visibility | Partially implemented | MVP | Build reservation/payment lookup and basic operational status for pilot support. |

### Nice-To-Have Post-MVP

| Feature | Current status | Release phase | Notes |
| --- | --- | --- | --- |
| Map view | Partially implemented | Post-MVP | Mobile dependency exists; web/mobile map can wait until feed conversion is understood. |
| Favourites | Partially implemented | Post-MVP | DB exists; defer until repeat consumer behavior matters. |
| Ratings and reviews | Partially implemented | Post-MVP | Backend exists; useful after real completed pickups exist. |
| Push notifications | Partially implemented | Post-MVP | Start with SMS/in-app for MVP; polish FCM later. |
| Itemised listings | Partially implemented | Post-MVP | API supports it, but surprise bags should be the MVP default. |
| Auto payouts | Partially implemented | Post-MVP | Manual payouts are acceptable for the pilot. |
| Disputes dashboard | Partially implemented | Post-MVP | Keep support SOP manual during MVP; build dashboard after support patterns emerge. |
| Social login | Partially implemented | Post-MVP | Phone OTP is enough for MVP. |
| Referrals | Not implemented | Later | Add after retention and invite loops are clearer. |
| Loyalty/credits | Not implemented | Later | Requires payment/refund/accounting maturity. |
| Analytics dashboard | Partially implemented | Later | Useful after pilot data exists. |
| AI demand/surplus prediction | Not implemented | Later | Not relevant until supply/demand data is meaningful. |

## 8-Week Implementation Roadmap

### Week 1: Make Build, CI, and Deploy Reliable

Goal: create a stable base so every later feature can be tested in staging.

- Fix TypeScript/build blockers across API, shared, and web.
- Resolve duplicate `ioredis` type mismatch and BullMQ connection typing.
- Stabilize pnpm/Corepack behavior locally and in CI.
- Configure Railway staging secrets and services for API, web, Postgres/PostGIS, and Redis.
- Decide and implement migration execution for staging.
- Add seed data for Lagos pilot businesses/listings.
- Acceptance: CI passes, Railway staging deploys, `/health` passes, migrations run, and seeded listings can be queried from the API.

#### Week 1 Progress (2026-08-03)

- Completed: CI tooling, workspace linting, TypeScript checks, and the API test suite are passing locally.
- Completed: an idempotent `pnpm --filter @chopsave/api seed` command creates four verified Lagos pilot businesses and active surprise-bag listings after migrations run.
- Completed: the API deployment uses Railway pre-deploy commands to run migrations on every environment and seed Lagos pilot data in `staging` only; the staging workflow smoke-tests `/health` and `/listings/nearby`.
- Pending external setup: configure the Railway project/services/secrets, deploy `main`, then verify the first staging smoke test succeeds.

### Week 2: Web PWA Auth and Consumer Feed

Goal: a consumer can log in and browse available Lagos listings.

- Build phone number entry, OTP verification, session persistence, refresh, and logout.
- Build consumer feed page using `/listings/nearby`.
- Use Lagos as the default pilot city; add manual location/area fallback instead of relying only on GPS.
- Add listing card UI with business name, title, price, discount, pickup window, distance placeholder/manual area, and quantity remaining.
- Add loading, empty, and error states.
- Acceptance: a test consumer can log in on staging and browse seeded listings.

### Week 3: Business Onboarding and Minimal Admin Verification

Goal: a business can apply, and an admin can approve it.

- Build business registration page with business name, category, address, city, phone, owner name, coordinates/manual location, and optional CAC.
- Build admin login/access assumptions using existing role system.
- Build admin pending-business queue with approve/reject actions and rejection reason.
- Add basic validation copy and operational status messages.
- Acceptance: a business can register, an admin can approve it, and the account can create listings after approval.

### Week 4: Business Listing Management for Surprise Bags

Goal: verified businesses can publish and manage simple surplus listings.

- Build create listing flow for surprise bags only.
- Include title, description, original price, discount price, quantity, pickup start/end, category, dietary tags, and optional photo URL.
- Build business listing list with active, paused, sold out, expired, and closed statuses.
- Add pause/resume/close actions where API supports them.
- Acceptance: a verified business can publish a surprise bag visible in the consumer feed.

### Week 5: Reservation and Paystack Payment

Goal: a consumer can reserve and pay for a listing end to end.

- Build listing detail page and reserve flow.
- Create pending reservation, initiate Paystack payment, and show pending payment state.
- Handle successful payment return/callback and webhook-confirmed reservation state.
- Display payment timeout/cancelled state when pending payment expires.
- Add payment failure messaging and retry.
- Acceptance: staging supports a complete test order from listing detail to confirmed paid reservation.

### Week 6: Orders, Pickup Code, and Collection

Goal: the pickup workflow works for consumers and businesses.

- Build consumer active orders and order history.
- Show pickup code clearly for confirmed/ready orders.
- Build business order queue with confirmed/ready/completed/no-show states.
- Build manual collect-by-code workflow for business users.
- Defer QR scanner unless manual collection is already solid.
- Acceptance: business can confirm collection, order becomes completed, and payout/impact stats update.

### Week 7: Pilot Hardening and Support Operations

Goal: make staging safe enough for a closed pilot.

- Add support/admin lookup for reservations, payments, users, and businesses.
- Add log coverage around OTP, Paystack initiation/webhook, payment timeout, reservation creation, and collection.
- Add smoke tests for health, auth, nearby listings, reservation creation, and payment webhook mock.
- Run internal test orders with seeded businesses and real Paystack test keys.
- Document support SOP for failed payments, no-shows, refunds, and business rejection.
- Acceptance: 20 internal staging orders complete without critical flow breaks.

### Week 8: Release Prep and Closed Lagos Beta

Goal: prepare a controlled public-facing MVP pilot.

- Add terms, privacy, cancellation/no-show policy, food safety disclaimer, and support contact.
- Polish Web PWA responsive UX for consumer, business, and admin flows.
- Configure production Railway environment separate from staging.
- Freeze MVP scope and run a bug bash.
- Recruit 3-5 Lagos food partners and a controlled group of consumers.
- Acceptance: closed Lagos beta can onboard real businesses, publish listings, accept paid reservations, and complete pickups.

## Hosting Recommendation

Use Railway for staging and pilot production because ChopSave currently needs a Fastify API, Next.js web app, PostgreSQL/PostGIS, Redis, and background workers. Keeping these together reduces operational overhead during the 8-week MVP window.

Recommended setup:

- One Railway project.
- Two environments: `staging` and `production`.
- Services per environment: API, web, Postgres/PostGIS, Redis.
- GitHub Actions deploys staging from `main`; production should remain manual until the pilot is stable.
- Use Railway for the first pilot; reconsider Vercel for web, Railway/Fly/Render for API, Supabase/Neon for Postgres, and Upstash for Redis only after usage and cost are real.

Pricing references:

- [Railway pricing](https://railway.com/pricing)
- [Render pricing](https://render.com/pricing)
- [Supabase pricing](https://supabase.com/pricing)

## Working Process

- Treat this document as the living plan.
- Start each implementation cycle by picking one weekly milestone and creating a focused branch or PR.
- Keep PRs small and aligned to one milestone.
- After each milestone, update this document with actual status, blockers, and changed decisions.
- Do not expand scope unless it protects the core loop: login, browse, reserve/pay, collect.

## Immediate Next Actions

1. Configure Railway staging secrets and validate deployment.
2. Run migrations and `pnpm --filter @chopsave/api seed` in Railway staging.
3. Build the Web PWA auth and feed.
4. Review this roadmap after Week 1 and adjust the remaining schedule based on real velocity.
