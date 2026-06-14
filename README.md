# ChopSave

A Nigerian food waste rescue marketplace. Food businesses — restaurants, bakeries, bukas, canteens, food stalls, supermarkets and cloud kitchens — list surplus food at 50–75% discount. Consumers discover nearby listings via GPS, reserve and pre-pay digitally, then collect with a pickup code.

---

## Monorepo Structure

This repo uses **pnpm workspaces** and **Turborepo** for build orchestration.

```
chopsave/
├── apps/
│   ├── mobile/          # React Native (Expo) — consumer + business mobile apps
│   ├── web/             # Next.js 14 (App Router) — web frontend
│   └── api/             # Fastify + TypeScript — REST API server
├── packages/
│   ├── shared/          # Shared TypeScript types, enums, and utilities
│   ├── ui/              # Shared UI component library (React Native Web)
│   └── config/          # Shared ESLint, TypeScript, and Prettier configs
├── pnpm-workspace.yaml
├── turbo.json
├── package.json
└── .gitignore
```

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 9+

### Install dependencies

```bash
pnpm install
```

### Run all apps in development mode

```bash
pnpm dev
```

### Build all packages

```bash
pnpm build
```

### Run linting across the monorepo

```bash
pnpm lint
```

### Run all tests

```bash
pnpm test
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native (Expo SDK 51+) |
| Web | Next.js 14 (App Router) |
| API | Fastify + TypeScript |
| Database | PostgreSQL 15 + PostGIS |
| Cache / Pub-Sub | Redis 7 |
| Job Queue | BullMQ |
| Push Notifications | Firebase Cloud Messaging |
| SMS / OTP | Termii |
| Payments | Paystack (primary) + Flutterwave (fallback) |
| File Storage | AWS S3 / Cloudflare R2 |
| CDN | Cloudflare |
