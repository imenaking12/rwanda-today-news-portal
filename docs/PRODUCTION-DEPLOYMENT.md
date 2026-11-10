# Rwanda Today — production deployment and handoff

This guide prepares the production launch using MongoDB Atlas, Render for the Express API and Cloudflare Pages for the React website. No production service is created by this document; the owner must sign in to the providers and supply private credentials.

## 1. Before deployment

- [ ] Rotate the MongoDB Atlas database-user password because an earlier password was shared in a chat. Do not reuse it.
- [ ] Confirm the Atlas database user has only the database permissions the application needs.
- [ ] Add the Render and Cloudflare accounts and choose the production region closest to the main readership.
- [ ] Create a Cloudinary account and a signed image-upload preset.
- [ ] Decide the public website domain and API subdomain, for example `www.example.com` and `api.example.com`.

Never put database passwords, JWT secrets, Cloudinary secrets, administrator passwords or ChatGPT Action tokens in GitHub source files, issue comments or chat messages.

## 2. Deploy the API on Render

Create a new Web Service connected to the GitHub repository.

- Root directory: `server`
- Runtime: Node
- Build command: `npm ci`
- Start command: `npm start`
- Health check path: `/api/status`
- Branch: `main`

Set the following environment variables in Render's private environment settings:

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `PORT` | Use the platform-provided port; the app defaults to 5000 when absent |
| `CLIENT_URL` | Exact public Cloudflare Pages/custom website origin, including `https://` |
| `PUBLIC_SITE_URL` | Canonical public website origin |
| `MONGO_URI` | Newly rotated MongoDB Atlas connection string |
| `JWT_SECRET` | New random secret, at least 32 characters |
| `CHATGPT_INTEGRATION_TOKEN` | New random private token, at least 32 characters |
| `OPENAI_API_KEY` | Private OpenAI API key for the embedded newsroom AI assistant |
| `OPENAI_MODEL` | Optional model override; defaults to `gpt-6-luna` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `CLOUDINARY_UPLOAD_PRESET` | Name of the signed upload preset |
| `CLOUDINARY_FOLDER` | `rwanda-today` |

Do not set `ADMIN_PASSWORD` permanently. The first admin is created once using the seed script after the database connection is verified.

### Seed the first administrator

After the API service is deployed and its database connection is healthy:

1. Temporarily add `ADMIN_USERNAME`, `ADMIN_EMAIL` and a unique `ADMIN_PASSWORD` to the Render environment settings.
2. Open the service Shell in Render and run `npm run seed:admin` from the service root directory (`server`).
3. Confirm the command reports that the administrator was created.
4. Remove `ADMIN_PASSWORD` from the service environment settings immediately and redeploy if the platform requires it.
5. Keep the password in a password manager. Never send it to ChatGPT.

If the seed script reports that an administrator already exists, do not repeatedly seed or delete database records. Sign in with the existing administrator or follow a deliberate password-reset procedure.

## 3. Deploy the React website on Cloudflare Pages

Create a Pages project connected to the same GitHub repository.

- Production branch: `main`
- Root directory: `client`
- Build command: `npm ci && npm run build`
- Build output directory: `dist`
- Environment variable: `VITE_API_URL=https://YOUR_API_HOST/api`

Replace the placeholder with the actual Render API origin. After the first deployment, set Render's `CLIENT_URL` and `PUBLIC_SITE_URL` to the exact canonical Pages/custom-domain origin and redeploy the API.

Add the custom domain to Cloudflare Pages and verify HTTPS before using it in the API configuration.

## 4. ChatGPT newsroom connection

1. Confirm the API is reachable over HTTPS at `https://YOUR_API_HOST/api/status`.
2. Open the ChatGPT GPT Action configuration for your Rwanda Today editorial assistant.
3. Import `docs/chatgpt-actions-openapi.yaml`.
4. Replace the placeholder server URL with the actual API origin followed by `/api`.
5. Set Action authentication to HTTP Bearer and enter the same private `CHATGPT_INTEGRATION_TOKEN` value configured in Render.
6. Save and test the `listRwandaTodayCategories` action. It should return the active categories from the newsroom database.
7. Ask the assistant to research a harmless sample story. Review the sources and draft content before approving the action call.
8. Confirm `createRwandaTodayDraft` creates a draft in the admin dashboard and that it does not appear on the public homepage.
9. Publish the test story only if it is clearly labelled as a test; otherwise delete the test draft after verification.

The ChatGPT Action can create drafts only. It cannot publish, edit or delete articles. Keep that human editorial approval boundary.

- [ ] Set `OPENAI_API_KEY` privately in Render and verify the dashboard AI research assistant creates a cited unpublished draft. OpenAI API usage is billed separately from a ChatGPT subscription.

## 5. Production acceptance checklist

- [ ] Public homepage loads on desktop and mobile.
- [ ] Public categories are loaded from MongoDB.
- [ ] Search and pagination return correct results.
- [ ] Published story pages load by their readable slug.
- [ ] Drafts remain private.
- [ ] Admin login and logout work.
- [ ] Article creation, editing, draft saving and publishing work.
- [ ] Scheduled publishing is tested while the API service is awake.
- [ ] Breaking-news selection appears on the public site and can be removed.
- [ ] YouTube embeds accept supported YouTube URLs only.
- [ ] Cloudinary image uploads work and return HTTPS image URLs.
- [ ] Sitemap and RSS feed use the production website origin.
- [ ] ChatGPT can list categories and save an unpublished, source-linked draft.
- [ ] Invalid ChatGPT tokens are rejected.
- [ ] Backups and a restore procedure are configured in MongoDB Atlas.
- [ ] Error monitoring and uptime alerts are configured.
- [ ] Privacy, corrections, contact and editorial policy pages are published before collecting reader data.

## 6. Important hosting limitations and hardening

- A free or sleeping API host may pause between requests. The scheduled-publishing worker runs only while the API process is awake; use an always-on service or a dedicated scheduled job if exact publication times are important.
- The current admin login rate limiter is in-memory and the admin token is held in browser session storage. Before a high-traffic or multi-instance production launch, implement secure HttpOnly cookie sessions, CSRF protection and a shared rate-limit store.
- Configure MongoDB backups and periodically test restoring them.
- Keep the API secret and ChatGPT integration token separate. Rotate either independently if exposed.
- Do not announce the site as production-ready until the acceptance checklist is completed against the deployed services.
