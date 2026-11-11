# notes-web

Web client for **Notes**: private notes, public posts and an admin area. It talks only to the REST API in the sibling repo [`notes-api`](https://github.com/hasinur1997/notes-api), which owns all data, authentication and access rules.

**Stack:** Next.js (App Router), React, Tailwind CSS and shadcn/ui (Base UI). No server-side data fetching, API routes or server actions: the browser holds the JWT and calls the API directly.

---

## Features

- **Public pages (no account needed):** the posts feed at `/` with a short description and "Read more" for each post, a full post at `/posts/[id]`, and a person's profile with their posts at `/users/[id]/posts`. Lists load more while you scroll.
- **Accounts:** register, sign in, forgot / reset password, profile (name, interests, photo) and settings.
- **Notes:** a Markdown editor with formatting, colours, labels, pinning, reminders, up to 5 images (with cropping) and sharing with collaborators. Search, label filters, and page numbers or infinite scroll.
- **My posts:** write, edit and delete your public posts with the same editor (text, colour, images). Posts open in place.
- **Admin:** manage users (create, edit, change role, delete, search), read any user's notes, and see users grouped by interest.

## Requirements

| Tool | Version |
|---|---|
| Node.js | 20.12 or newer (24 LTS recommended; CI uses 24) |
| notes-api | Running locally or deployed (see its README) |

---

## Development setup

```bash
git clone https://github.com/hasinur1997/notes-web.git
cd notes-web
npm install
cp .env.example .env.local
```

Point the app at the API in `.env.local`:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

> **macOS:** AirPlay Receiver uses port 5000, so the API usually runs on `5001`. Use `http://localhost:5001/api`.

The API must allow this app's origin: keep `CORS_ORIGIN=http://localhost:3000` in the API's `.env`.

Start the app:

```bash
npm run dev     # http://localhost:3000
```

To sign in as an admin, create the admin in the API (`npm run seed` there). To fill the public feed, run `npm run seed -- --sample-posts` in the API.

> In development, Next.js compiles each page the first time you open it, so the first visit to a page can take a moment. Production builds are fast from the start.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build (must pass before every deploy) |
| `npm start` | Serves the production build |
| `npm run lint` | ESLint |

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | ✅ | API base URL including `/api`. It is built into the browser code, so set it **before** `npm run build` |

Only `.env.example` is committed. Never put secrets in `NEXT_PUBLIC_*` variables: they are visible in the browser.

---

## Project structure

```
src/
├── app/                 pages (App Router): /, /login, /register, /notes, /posts, /posts/[id],
│                        /users/[id]/posts, /profile, /settings, /admin/{users,user-notes,interests}
├── components/
│   ├── ui/              shadcn components (added with the CLI)
│   ├── layout/          AppShell (header + sidebar), PublicShell, SidebarPage, NavigationProgress, UserMenu
│   ├── notes/           notes screen, cards, grid, composer, shared editor
│   ├── posts/           feed, post page, a user's posts, My posts, post editor and viewer
│   ├── admin/           users, user's notes, interests
│   └── auth/ profile/ settings/ crop/
├── context/AuthContext.jsx   who is signed in
├── hooks/               useApiQuery, useInfiniteList, useFieldErrors, ...
└── lib/                 api.js (the only module that calls the API), queryCache, validation, markdown, ...
```

## How it works

- **API calls** go only through `src/lib/api.js`, which adds the `Authorization: Bearer` header, turns errors into messages for toasts, and signs the user out on a `401`.
- **Auth state** lives in `AuthContext`. The token is kept in `localStorage` and read only inside effects, so server and client renders match. Route guards are for the UI only; the API decides what each user may do.
- **Smooth navigation:** pages keep their header and sidebar steady, a thin bar at the top shows a page is loading, and API responses are cached for the session (`lib/queryCache.js`). Going back to a page shows its data at once and refreshes it in the background. The cache is cleared whenever the signed-in account changes.
- **Forms** show errors under each field instead of browser popups (`lib/validation.js`, `hooks/useFieldErrors.js`). These checks give quick feedback; the API validates everything again.
- **Markdown** is rendered by `lib/markdown.jsx` into React elements only (no HTML strings), so note and post text can never inject markup.

---

## Deployment

Production runs on cPanel (Phusion Passenger) and is deployed by GitHub Actions (`.github/workflows/deploy.yml`) on every push to `main`:

1. **Build** on GitHub: `npm ci`, `npm run lint` and `npm run build` with `NEXT_PUBLIC_API_URL` from the `production` environment's variables. Shared hosting has too little memory to build there.
2. **Deploy:** the built app (`.next`, `package.json`, `server.js`, …) is sent over SSH, dependencies are installed with `npm install --omit=dev`, and Passenger restarts. Passenger starts the app through `server.js`.

**One-time setup:** create the app in cPanel **Setup Node.js App** (startup file `server.js`). On GitHub, in **Settings → Environments → `production`**, add the variable `NEXT_PUBLIC_API_URL` and the secrets `CPANEL_SSH_KEY`, `CPANEL_KNOWN_HOSTS`, `CPANEL_HOST`, `CPANEL_PORT`, `CPANEL_USERNAME` and `CPANEL_DEPLOY_PATH`.

## Troubleshooting

| Problem | Fix |
|---|---|
| "The app is not configured: NEXT_PUBLIC_API_URL is missing." | Set it in `.env.local` and restart `npm run dev` (or rebuild) |
| "Cannot reach the server" | Start the API, and check the port in `NEXT_PUBLIC_API_URL` |
| CORS errors in the browser console | Add this app's exact origin to `CORS_ORIGIN` in the API |
| Images do not show | Images stored on the API server are served from its `/uploads`; check that the API is reachable from the browser |
