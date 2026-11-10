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
| POST | `/api/auth/forgot-password` | Public — `{ email }`; same reply whether or not the account exists |
| POST | `/api/auth/reset-password` | Public — `{ email, token, password }` from the emailed link; 400 `INVALID_RESET_TOKEN` if wrong/used/expired |
| PATCH | `/api/users/me` | Auth — only `name`, `interests` |
| POST, DELETE | `/api/users/me/avatar` | Auth — profile photo (multipart `image`, ≤ 5 MB); users and people on notes include `avatar: { url } \| null` |
| GET, POST | `/api/notes` | Auth — owned + shared notes; GET filters: `?pinned=`, `?label=`, `?q=`, `?reminder=true` |
| GET | `/api/notes/summary` | Auth — `{ totalNotes, reminders, labels: [{ name, count }] }` |
| POST | `/api/notes/labels` | Auth — create a label no note uses yet (`{ name }`); 409 if it exists ignoring case |
| PATCH, DELETE | `/api/notes/labels/:name` | Auth — rename (`{ name }`) or remove a label on all visible notes and the user's created labels |
| GET, PATCH | `/api/notes/:id` | Owner or collaborator (admin may GET) |
| DELETE | `/api/notes/:id` | Owner only |
| POST | `/api/notes/:id/copy` | Owner or collaborator |
| POST, DELETE | `/api/notes/:id/collaborators[/:userId]` | Owner (add/remove), or a collaborator removing themselves |
| POST, PUT, DELETE | `/api/notes/:id/images[/:imageId]` | Owner or collaborator — multipart `image` ≤ 5 MB (PUT replaces an image in place, e.g. after cropping); 503 if uploads are not configured |

Notes include `color`, `reminderAt`, `images`, `owner` / `collaborators` as `{ _id, name, email }`, and `isOwner`. `content` is Markdown, rendered only with `lib/markdown.jsx` (React elements, never HTML strings).
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
| 401 | Clear token, redirect to `/login` (also after a password reset elsewhere: `TOKEN_REVOKED`) |
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
│   ├── login/ register/ forgot-password/ reset-password/ notes/ profile/ posts/
│   ├── users/[id]/posts/page.jsx # Scenario 2
│   └── admin/
│       ├── layout.jsx            # admin guard
│       ├── users/ notes/ interests/
├── components/
│   ├── ui/                       # shadcn (CLI-generated, do not hand-edit unless needed)
│   ├── auth/                     # AuthLayout, AuthCard, FormField, Register/Login/ForgotPassword/ResetPassword views, ...
│   ├── layout/                   # AppShell (header + sidebar), SearchBox, UserMenu, UserAvatar
│   ├── profile/                  # ProfileView (photo, name, interests, account), ProfilePhoto, InterestsInput
│   ├── crop/                     # ImageCropDialog (free-form crop: 8 handles, aspect presets, full image, rotate); geometry in lib/crop.js
│   ├── notes/                    # NotesView, NoteCard, NoteGrid, NoteComposer, NoteEditorDialog, EditLabelsDialog, ...
│   │   └── editor/               # NoteEditor (shared by composer + dialog), toolbar, FormatBar, ColorMenu, ReminderMenu, CollaboratorsDialog, NoteImages
│   └── BrandLogo, Pager, AuthGuard, NoteForm, UserForm, ...
├── context/AuthContext.jsx
├── hooks/                        # reusable stateful logic (useNotes, usePagination, ...)
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

- Screens are built to match the provided designs. Visual tokens (colors, radius) live only in `src/app/globals.css` as shadcn CSS variables (`--primary`, `--border`, `--brand-soft`, ...); use the Tailwind classes they generate (`bg-primary`, `text-muted-foreground`, `bg-brand-soft`), never raw hex values in components.
- Font: Nunito via `next/font/google` in `app/layout.jsx`. Icons: `lucide-react`.
- shadcn style is `base-nova` (Base UI primitives). Utilities come from the official `cn` package.
- No animations beyond the components' defaults, no dark-mode work.
- Allowed shadcn components: `button`, `input`, `label`, `textarea`, `card`, `table`, `dialog`, `alert-dialog`, `badge`, `pagination`, `sonner`, `dropdown-menu` (account menu, toolbar menus), `sheet` (mobile sidebar), `popover` ("Label note" picker; `ui/popover.jsx` passes `anchor` to the positioner). Ask before adding any other.
- Forms are plain controlled inputs. No `react-hook-form`, no shadcn `form`.
- Every destructive action uses `AlertDialog`. Every mutation shows a `sonner` toast.
- Keep pages clean, readable and responsive. Use consistent spacing and layout so the app feels like one product.

### 4.5 Environment Variables

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## 5. Coding Rules

Every coding agent and contributor follows these rules for every change. If a rule conflicts with Section 2 (Hard Rules), Section 2 wins.

### 5.1 Design (SOLID, applied to React + Next.js)

- **Single responsibility.** One reason to change per module:
  - `app/**/page.jsx` compose a page: read URL state, call a hook, render components.
  - `components/` render UI from props and raise events. They do not call the API directly.
  - `hooks/` hold reusable stateful logic (fetching a list, submitting a form, pagination).
  - `lib/api.js` is the only place that talks to the network.
  - `context/AuthContext.jsx` owns auth state only.
- **Open/closed.** Extend components through props and composition (`children`, render props), not by adding special cases inside them.
- **Liskov substitution.** Components with the same role share the same props contract (for example, every form takes `initialValues`, `onSubmit`, `submitting`).
- **Interface segregation.** Keep props small and focused. Pass what a component needs, not whole objects "just in case".
- **Dependency inversion.** Pages depend on hooks and `lib/api.js` functions, not on `fetch`, `localStorage` or URLs directly.
- Do not add abstractions until at least two real callers need them.

### 5.2 Security (mandatory for every feature)

The API enforces security; the client must never weaken it:

- All requests go through `lib/api.js`. Never call `fetch` directly or build API URLs by hand in components.
- Never render untrusted content as HTML. No `dangerouslySetInnerHTML`. Rely on React's escaping. Note Markdown goes through `lib/markdown.jsx`, which only creates React elements.
- Only follow internal redirect targets (paths starting with a single `/`). Never redirect to a URL taken from the query string without checking it.
- Never log tokens or user data to the console. Never put tokens in URLs.
- Clear the token and all cached user data on logout and on any 401.
- Only `NEXT_PUBLIC_*` variables reach the browser; never put secrets in them.
- Route guards are UX only (Section 2): hide what a user cannot do, but always let the API decide.
- Ask before adding a dependency; run `npm audit` after adding one and resolve high or critical findings.

### 5.3 Performance

- Fetch only what the page shows, always with pagination.
- Avoid duplicate requests: one fetch per page/query change, cancel or ignore stale responses (`AbortController`).
- Avoid unnecessary re-renders: stable keys from `_id`, no inline object/array props in hot lists, `useMemo` / `useCallback` only where profiling or obvious cost justifies it.
- Keep client bundles small: import only the shadcn components a page uses; no large libraries for small tasks.

### 5.4 Readability and structure

- Function components and hooks only. `const` by default, `async/await`, no `var`.
- Small components with one job. A component longer than ~150 lines, or a function longer than ~40 lines, should be split.
- Descriptive names: components `PascalCase` (`NoteForm`), hooks `useCamelCase` (`useNotes`), handlers `handleX` (`handleDelete`), booleans read as questions (`isLoading`, `canEdit`).
- File names: `PascalCase.jsx` for components, `camelCase.js` for hooks and libraries.
- No magic numbers or strings: name them as constants.
- No dead code, commented-out code, unused imports or stray `console.log` in commits.
- Reuse before writing: check `components/`, `hooks/` and `lib/` for an existing piece first.

### 5.5 Comments and documentation

- **Every exported component, hook and function has a JSDoc comment** with a one-sentence summary, `@param` for props/arguments, and `@returns`.
- Non-exported helpers get at least a one-line comment saying what they do.
- Inline comments explain **why**, not what (for example, why the token is read inside `useEffect`).
- Keep comments accurate: update or delete them when the code changes.

```jsx
/**
 * Form for creating or editing a note.
 *
 * @param {object} props
 * @param {{ title: string, content: string }} props.initialValues - Values to start with.
 * @param {(values: { title: string, content: string }) => Promise<void>} props.onSubmit - Called with the form values.
 * @param {boolean} props.submitting - Disables the form while a request is in flight.
 * @returns {JSX.Element}
 */
export function NoteForm({ initialValues, onSubmit, submitting }) { ... }
```

### 5.6 Testability

- Keep logic out of JSX: put data shaping, validation helpers and API calls in plain functions or hooks so they can be tested without rendering a page.
- Components receive data and callbacks through props so they can be rendered in isolation.
- Every page handles and can be checked in its loading, empty, error and success states.
- The test tooling (runner and libraries) is not chosen yet. Ask before adding it.

---

## 6. Workflow for the Agent

1. **Read before writing.** Check existing pages, components and `lib/api.js` before changing anything.
2. **Work in small steps.** One page/feature per change. Make one commit per feature with a conventional message (`feat:`, `fix:`, `chore:`, `docs:`, `test:`).
   Commits are authored only by the repository owner (the local `user.name` / `user.email`). Never add `Co-Authored-By:` trailers, "Generated with" lines or any other AI attribution to commit messages or PR descriptions.
3. **Ask before** adding a dependency, a shadcn component not on the allowed list, or a page that needs an endpoint not listed in Section 3.
4. **Before marking work done**, run `npm run build` and fix every error and warning.
5. **Do not invent requirements.** If something is not in this file or `../docs/project-over.md`, ask.

---

## 7. Definition of Done

A frontend page is done when:

- [ ] It calls the API through `lib/api.js` only
- [ ] Loading, empty and error states are handled
- [ ] Mutations show a toast; deletes ask for confirmation
- [ ] The Section 5.2 security rules are followed
- [ ] Every new exported component, hook and function has a JSDoc comment
- [ ] `npm run build` passes

---

## 8. Never Do

- Call `fetch` directly instead of going through `lib/api.js`
- Read `localStorage` outside `useEffect`
- Add Next.js API routes, server actions or server-side data fetching
- Rely on route guards for security or re-implement API business rules
- Use shadcn blocks, dashboard templates or starter repos
- Add `react-hook-form`, shadcn `form`, or shadcn components not on the allowed list without asking
- Commit `.env` or real credentials
- Refactor working code just for style without a clear benefit
