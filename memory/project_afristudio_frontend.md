---
name: AfriStudio Frontend Project
description: Full React/TypeScript/Tailwind frontend for AfriStudio African art auction platform
type: project
---

AfriStudio is an African digital art auction platform. The frontend is a React + TypeScript + Vite + Tailwind CSS SPA.

**Why:** Built from scratch based on OpenAPI spec provided by user (AfriStudio API v1.0.0).

**Tech stack:** React 19, TypeScript, Vite, Tailwind CSS v3, React Router v7, Axios, Lucide Icons, @tanstack/react-query installed but not yet wired.

**API base URL:** Configured via `VITE_API_URL` env var (default: `http://localhost:8000`).

**Authentication:** JWT Bearer tokens stored in localStorage. Access token auto-refreshed via Axios interceptor using refresh token.

**Role-based access:** Dashboard sidebar items are filtered by `user.permissions` from the API. Super Admin has all permissions. Bidders have limited access (auctions, cart, orders, wallet, profile).

**How to apply:** When adding new pages/features, follow the existing pattern: API call in `src/api/index.ts`, types in `src/api/types.ts`, page in `src/pages/dashboard/` or `src/pages/landing/`, route in `src/App.tsx`.
