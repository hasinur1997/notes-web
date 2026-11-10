# CLAUDE.md — Frontend Agent Guide (`notes-web`)

> Guidance for AI coding agents (Claude Code, Codex, Cursor, etc.) working on the **frontend** of the **Notes** application.
> The same file can be used as `AGENTS.md`. The backend lives in the sibling repo `notes-api` with its own guide.
> The full project plan lives in `../docs/project-over.md`. When this file and the plan disagree, **this file wins**.

---

## 1. Project Overview

**Notes** is a note-taking application. People keep private notes, share public posts, and list their interests. Administrators manage users and content. The product has two parts:

- **`notes-api`:** a REST API that owns all data, authentication and authorization.
- **`notes-web` (this repo):** a browser client built with Next.js that talks to the API only.

### Core features

- **Accounts:** register, sign in, sign out, and edit the profile (name, interests).
- **Private notes:** list, create, edit and delete your own notes.
- **Public posts:** browse all posts, publish a post when signed in, and view any user's profile page with their posts.
- **Administration (admin role only):** manage users, browse notes by owner, and view users grouped by interest.

### Product principles

1. **Smooth everyday use.** Fast page loads, clear navigation, and immediate feedback (a loading state, toasts, confirmation dialogs) for every action.
2. **Thin client.** The API is the single source of truth for data, rules and security. The client displays data and sends user intent.
3. **Consistent UI.** One component library (shadcn/ui) with the default theme and a consistent layout across pages.
4. **Simple over clever.** Prefer readable, conventional React code. Add complexity only when a real need appears.

### Repositories

| Repo | Stack | Hosting |
|---|---|---|
| `notes-api` | Node.js LTS, Express, Mongoose, MongoDB Atlas, JWT, bcrypt, zod | Render (free) |
| `notes-web` (this repo) | Next.js (App Router), React, Tailwind CSS, shadcn/ui | Vercel (free) |

---

## 2. Hard Rules (never break these)

1. **No templates or starter kits.** Add individual shadcn components with the CLI only. No shadcn blocks, dashboard examples or boilerplate repos.
2. **No secrets in git.** Only `.env.example` is committed.
3. **The API is the source of truth for security.** Route guards are UX only. Never duplicate business rules (ownership, roles, validation) from the API.
4. **No server-side code.** No Next.js API routes, no server actions, no direct database access.

---

## 3. API Reference (provided by `notes-api`)

### 3.1 Endpoints

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/register` | Public — role is always forced to `user` |
| POST | `/api/auth/login` | Public, rate-limited |
| GET | `/api/auth/me` | Auth |
| PATCH | `/api/users/me` | Auth — only `name`, `interests` |
| GET, POST | `/api/notes` | Auth |
| GET, PATCH, DELETE | `/api/notes/:id` | Owner (admin may GET) |
| GET, POST | `/api/admin/users` | Admin |
| GET, PATCH, DELETE | `/api/admin/users/:id` | Admin |
| GET | `/api/admin/notes?owner=` | Admin |
| GET | `/api/admin/users/grouped-by-interest?interest=` | Admin — Scenario 1 |
| GET, POST | `/api/posts` | GET public, POST auth |
| GET | `/api/users/:id/posts` | Public — Scenario 2 |
| GET | `/api/health` | Public |

Every list endpoint is paginated: `?page=` (starts at 1) and `?limit=` (default 10, max 50).

### 3.2 Response Contracts

```json
// List
{ "data": [], "meta": { "page": 1, "limit": 10, "total": 0, "totalPages": 0 } }

// Error
{ "error": { "message": "Note not found", "code": "NOT_FOUND" } }

// Login
{ "token": "<jwt>", "user": { "_id": "...", "name": "...", "email": "...", "role": "user", "interests": [] } }
```

| Status | Frontend handling |
|---|---|
| 400 | Show `error.message` in a toast |
| 401 | Clear token, redirect to `/login` |
| 403 | Show `error.message` in a toast |
| 404 | Show a not-found state |
| 409 | Show `error.message` (e.g. duplicate email) |
| 429 | Show `error.message` (login rate limit) |

---

## 4. Frontend

### 4.1 Commands

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # must pass before every deploy
npm start
```

### 4.2 Structure

```
src/
├── app/
│   ├── layout.jsx                # AuthProvider, nav, <Toaster />
│   ├── page.jsx                  # redirect to /notes or /login
│   ├── login/ register/ notes/ profile/ posts/
│   ├── users/[id]/posts/page.jsx # Scenario 2
│   └── admin/
│       ├── layout.jsx            # admin guard
│       ├── users/ notes/ interests/
├── components/
│   ├── ui/                       # shadcn (CLI-generated, do not hand-edit unless needed)
│   └── Pager, AuthGuard, NoteForm, UserForm, ...
├── context/AuthContext.jsx
└── lib/api.js, lib/utils.js
```

### 4.3 Conventions

- Every page that fetches data is a client component (`"use client"`). No server-side data fetching: the JWT lives in the browser.
- All API calls go through `lib/api.js`, which:
  - prefixes `process.env.NEXT_PUBLIC_API_URL`
  - attaches `Authorization: Bearer <token>`
  - on 401 clears the token and redirects to `/login`
  - throws the API's `error.message` for toasts
- Token is stored in `localStorage` and read only inside `useEffect` (avoid hydration mismatches). Show a loading state until auth is known.
- Pagination state lives in the URL (`?page=`) via `useSearchParams`; wrap such pages in `<Suspense>`.

### 4.4 UI Rules

- Tailwind utilities + default shadcn theme. No custom design system, no animations, no dark-mode work.
- Allowed shadcn components: `button`, `input`, `label`, `textarea`, `card`, `table`, `dialog`, `alert-dialog`, `badge`, `pagination`, `sonner`. Ask before adding any other.
- Forms are plain controlled inputs. No `react-hook-form`, no shadcn `form`.
- Every destructive action uses `AlertDialog`. Every mutation shows a `sonner` toast.
- Keep pages clean, readable and responsive. Use consistent spacing and layout so the app feels like one product.

### 4.5 Environment Variables

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## 5. Workflow for the Agent

1. **Read before writing.** Check existing pages, components and `lib/api.js` before changing anything.
2. **Work in small steps.** One page/feature per change. Make one commit per feature with a conventional message (`feat:`, `fix:`, `chore:`, `docs:`, `test:`).
3. **Ask before** adding a dependency, a shadcn component not on the allowed list, or a page that needs an endpoint not listed in Section 3.
4. **Before marking work done**, run `npm run build` and fix every error and warning.
5. **Do not invent requirements.** If something is not in this file or `../docs/project-over.md`, ask.

---

## 6. Definition of Done

A frontend page is done when:

- [ ] It calls the API through `lib/api.js` only
- [ ] Loading, empty and error states are handled
- [ ] Mutations show a toast; deletes ask for confirmation
- [ ] `npm run build` passes

---

## 7. Never Do

- Call `fetch` directly instead of going through `lib/api.js`
- Read `localStorage` outside `useEffect`
- Add Next.js API routes, server actions or server-side data fetching
- Rely on route guards for security or re-implement API business rules
- Use shadcn blocks, dashboard templates or starter repos
- Add `react-hook-form`, shadcn `form`, or shadcn components not on the allowed list without asking
- Commit `.env` or real credentials
- Refactor working code just for style without a clear benefit
