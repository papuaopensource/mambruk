# Project

## Overview

Mambruk is a URL shortener and link-in-bio pages, run by Papua Open Source at
`mambr.uk`.

- Astro 5, `output: 'server'`, adapter `@astrojs/cloudflare` with `platformProxy`
- Cloudflare Pages, D1 (`DB`) for data, KV (`RATE_LIMITER`) for rate limiting
- Tailwind CSS 3 through `@astrojs/tailwind`
- TypeScript strict; plain `.js` for logic that tests import
- `pnpm` 9, Node 18+

## Repository Layout

```
.agent/                      working notes for coding agents
src/pages/
  index.astro                landing: shorten form and bio page entry
  [code].ts                  /{code}, 302 to the target
  r/[code].ts                legacy /r/{code}, same handler
  @[handle].astro            bio page from D1
  @[handle]/[alias].ts       /@handle/alias, a short link under a handle
  app/index.astro            dashboard, needs a session
  api/shorten.ts             anonymous shortening
  api/links.ts               aliases under an owned handle
  api/pages.ts               claim and edit a bio page
  api/page-links.ts          links on a bio page
  api/auth/                  OAuth start, callback, logout
src/utils/
  redirect.ts                shared redirect logic
  code.js                    code shape and generation
  session.js                 HMAC-signed session cookie
  auth.ts                    OAuth providers, user lookup
  theme.js                   bio page themes and colors
  icons.js                   named icon map
  urlValidator.ts            target URL checks
  rateLimiter.ts             sliding window over KV
src/components/, src/layouts/
public/assets/               logo, favicons
schema.sql                   shape of a fresh database
migrations/                  one-offs for existing databases
test/                        node --test files
index.html, assets/          the old static page, served from master
```

## Environment Variables

Local values go in `.env` (template `.env.example`); production values are Pages
secrets.

```
AUTH_SECRET            signs the session cookie, 32+ characters
GITHUB_CLIENT_ID       GitHub OAuth
GITHUB_CLIENT_SECRET
GOOGLE_CLIENT_ID       Google OAuth, Web client
GOOGLE_CLIENT_SECRET
```

## Development Commands

```sh
pnpm install
pnpm dev                 # astro dev with local D1 and KV in .wrangler/state
pnpm test                # node --test test/*.test.mjs
pnpm build
pnpm preview             # wrangler pages dev dist
pnpm format              # prettier --write
pnpm format:check
```

Apply the schema to the local database once:

```sh
pnpm dlx wrangler d1 execute mambruk-db --local --file=./schema.sql
```

`.env` is read once at startup. Restart `pnpm dev` after editing it, or sessions
fail as if the cookie were bad. Open `localhost`, not `127.0.0.1`: the OAuth
redirect follows the origin.
