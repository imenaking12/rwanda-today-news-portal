# Rwanda Today — build roadmap

## Phase 1: Working publishing foundation
- [x] React/Vite public site foundation
- [x] Express and MongoDB connection
- [x] Article and category data models
- [x] Public published-article API
- [x] Administrator model with bcrypt password hashing
- [x] Administrator login and expiring signed token
- [x] Protected article create, edit, publish, draft and delete endpoints
- [x] React homepage connected to published articles
- [x] Initial administrator dashboard and article editor
- [ ] Verify the full flow locally and fix any runtime issues

## Phase 2: Editorial workflow and reader discovery
- [ ] Rich-text editor with safe content rendering
- [ ] Category management
- [x] Safe unpublished draft preview in the admin editor
- [ ] Scheduled publishing
- [x] Protected ChatGPT Actions endpoint for creating unpublished article drafts
- [x] Save and display article research source references for editorial verification
- [ ] Breaking-news ticker and homepage story ordering
- [ ] Article SEO fields, slugs, social sharing and related stories
- [x] Server-side category filtering and search
- [x] Paginated public article feed

## Phase 3: Media
- [ ] Cloudinary account and server-side upload integration (requires your Cloudinary account)
- [ ] Image and video upload validation
- [ ] Media library with reusable assets
- [x] Embedded YouTube player with URL validation
- [x] Backend unit tests for supported and rejected YouTube URL formats
- [x] GitHub Actions workflow for backend tests and frontend lint/build
- [ ] Galleries and video news pages

## Phase 4: Reader experience
- [ ] Responsive category pages and article URLs
- [ ] Related stories, bookmarks and reading history
- [ ] Newsletter subscriptions
- [ ] About, contact, corrections, privacy and editorial policy pages
- [ ] Accessibility, metadata, sitemap and performance improvements

## Phase 5: Production readiness
- [ ] Secure HttpOnly cookie sessions and CSRF strategy
- [x] Baseline security headers and in-memory administrator login rate limiting
- [ ] Login rate limiting, validation and security headers
- [ ] Role/permission model and audit logs
- [x] Automated backend tests and GitHub Actions workflow added (checks must pass before merge)
- [ ] Error monitoring, backups and deployment configuration
- [ ] Production deployment, API domain, ChatGPT Action connection and custom domain (requires your deployment/domain accounts)

## Editorial categories

Rwanda, Politics, Business, Sports, Entertainment, Technology, World and Opinion.

## Architecture

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB Atlas + Mongoose
- Password hashing: bcryptjs
- Media: Cloudinary (planned)
- Video source: YouTube embeds (URL support is present)
