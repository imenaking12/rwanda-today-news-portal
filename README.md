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

Run the article SEO migration once if your database already contains older stories:

```powershell
npm run migrate:article-seo
```

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
- Server-side article search, category filtering and pagination.
- SEO-friendly article slugs, shareable article URLs, editable search metadata, related stories and story sharing.
- Featured-story ordering, admin-managed categories and breaking-news ticker, and article detail reading view.
- Administrator sign-in with hashed passwords and signed, expiring bearer tokens.
- Protected article creation, editing, immediate publishing, scheduled publishing, draft saving and deletion.
- A backend worker checks for due scheduled stories every 30 seconds and publishes them automatically while the API process is running.
- Article fields for image URLs and optional YouTube links.
- Signed Cloudinary image uploads from the admin editor (requires private Cloudinary credentials in the backend environment).
- Responsive YouTube embeds on public article pages, using privacy-enhanced YouTube embed URLs.
- Backend validation that accepts supported YouTube video URL formats and rejects unrelated hosts.

## ChatGPT newsroom integration

Rwanda Today includes a protected endpoint for ChatGPT Actions. You can research a story in ChatGPT, ask your connected GPT to prepare an article, and have it save the result as an **unpublished draft** in the Rwanda Today newsroom. It cannot publish, edit, or delete stories through this integration.

- API endpoint: `POST /api/integrations/chatgpt/articles/drafts`
- OpenAPI contract: `docs/chatgpt-actions-openapi.yaml`
- Assistant behavior and setup guide: `docs/CHATGPT-EDITORIAL-ASSISTANT.md`
- Research source references are stored with the draft and displayed to editors and readers.
- Authentication: a private bearer token configured as `CHATGPT_INTEGRATION_TOKEN` on the server.
- Configure the deployed API URL and bearer-token authentication in a ChatGPT GPT Action using the OpenAPI contract.
- Replace the placeholder server URL in the OpenAPI file with the real deployed API URL.
- Generate a secret locally (never in chat): `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`
- The endpoint always creates a draft. An administrator must fact-check it, edit it if needed, and publish it from the dashboard.

The API integration is implemented, but it cannot be used from ChatGPT until a production API domain is deployed, the private token is configured, and the GPT Action is connected.

## Important security notes

- Keep server credentials in `server/.env`; never paste them into chat or commit them.
- The first administrator is created with the local one-time seed script, not a public registration endpoint.
- The current admin token is stored in browser session storage and expires after eight hours. The API now adds baseline security headers and a basic in-memory login rate limit (10 requests per IP per 15 minutes). Before a multi-instance production launch, move to secure HttpOnly cookies with CSRF protection and use a shared rate-limit store such as Redis.
- Signed Cloudinary uploads are implemented. Add the Cloudinary environment values from `.env.example` to activate them; media-library management and video uploads remain future work.
- Test all changes locally before treating a release as production-ready.

## Automated checks

GitHub Actions runs backend unit tests and frontend ESLint/build checks for pull requests targeting `main` and pushes to `main` or feature branches. The backend tests can also be run locally with `npm test` from the `server/` directory.

## Development

Work is developed in feature branches and proposed through pull requests. The `main` branch remains the stable integration branch.
