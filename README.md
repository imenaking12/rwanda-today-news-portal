# Rwanda Today

A full-stack digital newspaper platform built with React, Vite, Node.js, Express and MongoDB Atlas.

## Project structure

- `client/` — React public newspaper website and administrator dashboard.
- `server/` — Express API, MongoDB models, authentication and article publishing.
- `docs/` — project planning and technical documentation.

## Requirements

- Node.js 20.19+ or 22.12+ recommended.
- npm.
- A MongoDB Atlas database or local MongoDB instance.

## Run the backend

Open a terminal:

```powershell
cd server
npm install
```

Create `server/.env` using `server/.env.example` as a guide. Set a real MongoDB connection string and a long random JWT secret. Never commit `.env`.

Create the first administrator once:

```powershell
npm run seed:admin
```

After the account has been created, remove the temporary `ADMIN_PASSWORD` value from `.env`. Then start the API:

```powershell
npm run dev
```

The API runs at `http://localhost:5000`.

## Run the frontend

Open a second terminal:

```powershell
cd client
npm install
npm run dev
```

Open the Vite URL shown in the terminal, normally `http://localhost:5173`.

Optional: create `client/.env.local` and set `VITE_API_URL=http://localhost:5000/api` if your API uses another address.

## Current features

- Public newspaper homepage powered by published MongoDB articles.
- Category filtering and headline search.
- Article detail reading view.
- Administrator sign-in with hashed passwords and signed, expiring bearer tokens.
- Protected article creation, editing, publishing, draft saving and deletion.
- Article fields for image URLs and optional YouTube links.

## Important security notes

- Keep server credentials in `server/.env`; never paste them into chat or commit them.
- The first administrator is created with the local one-time seed script, not a public registration endpoint.
- The current admin token is stored in the browser session storage and expires after eight hours. A production deployment should move to secure, HttpOnly cookies, add login rate limiting, and configure strict deployment origins.
- Media URLs are supported now. Direct Cloudinary uploads and media-library management are a later integration step.
- Test all changes locally before merging the feature branch into `main`.

## Development branch

Current development work is being built on `feature/rwanda-today-platform`. Merge it into `main` only after local verification.
