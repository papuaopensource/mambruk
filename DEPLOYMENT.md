# Deployment

Mambruk runs on Cloudflare Pages with D1 for data and KV for rate limiting.
Everything below is `wrangler` from the repo root. Wrangler is a devDependency,
so `pnpm dlx wrangler` uses the pinned version.

## 1. Log in

```bash
pnpm dlx wrangler login
pnpm dlx wrangler whoami
```

Check the account name before going further. Credentials live in
`~/.config/.wrangler/config/default.toml`; `wrangler logout` switches accounts.

Resource ids in `wrangler.toml` belong to one account. After switching, an id
from the old account still looks valid but is not found, and the error says
nothing about accounts.

## 2. D1 database

```bash
pnpm dlx wrangler d1 create mambruk-db
```

Copy `database_id` from the output into `wrangler.toml`. Then apply the schema:

```bash
pnpm dlx wrangler d1 execute mambruk-db --remote --file=./schema.sql
```

`schema.sql` uses `CREATE TABLE IF NOT EXISTS`, so re-running it is safe — and
for the same reason it will not add a column to a table that already exists.
Existing databases take the files in `migrations/` instead.

## 3. KV for rate limiting

```bash
pnpm dlx wrangler kv namespace create RATE_LIMITER
pnpm dlx wrangler kv namespace create RATE_LIMITER --preview
```

Copy both ids into `wrangler.toml`. While they are placeholders, `checkLimit`
sees no binding and lets every request through.

## 4. Pages project

```bash
pnpm dlx wrangler pages project create mambruk --production-branch staging
```

Project names are globally unique and Cloudflare appends a suffix when taken.
This one lives at `https://mambruk-ckd.pages.dev`. Use the URL from the output.

## 5. Secrets

```bash
pnpm dlx wrangler pages secret put AUTH_SECRET --project-name mambruk
pnpm dlx wrangler pages secret put GITHUB_CLIENT_ID --project-name mambruk
pnpm dlx wrangler pages secret put GITHUB_CLIENT_SECRET --project-name mambruk
pnpm dlx wrangler pages secret put GOOGLE_CLIENT_ID --project-name mambruk
pnpm dlx wrangler pages secret put GOOGLE_CLIENT_SECRET --project-name mambruk
```

Values are prompted for. Don't pass them as arguments or pipe them from `echo`;
both end up in shell history.

`AUTH_SECRET` needs 32+ characters and should differ from the one in `.env`:

```bash
openssl rand -hex 32
```

Changing it invalidates every session, which is also how you revoke them all.

Pages binds variables when a deployment is created, so a new secret does
nothing until the next deploy.

List what is set with `pnpm dlx wrangler pages secret list --project-name mambruk`.

## 6. Build and deploy

```bash
pnpm install
pnpm test
pnpm build
pnpm dlx wrangler pages deploy dist --project-name mambruk --branch staging
```

`pages deploy` uploads the local `dist/` as-is. It does not build and it does
not read git, so `pnpm build` first. `--branch` is a label: matching the
production branch makes it the production deployment, anything else becomes a
preview with its own URL.

`pages deployment list` shows a Source column with the commit wrangler picked
up from the working tree — the quickest way to see what is actually live.

## 7. Migrations

Files in `migrations/` are one-offs for databases that already exist. A fresh
database created in step 2 needs none of them.

```bash
pnpm dlx wrangler d1 export mambruk-db --remote --output backup.sql
pnpm dlx wrangler d1 execute mambruk-db --remote --file=./migrations/0001_links_handle.sql
```

`0001` rebuilds `links` so uniqueness is per owner. `0002` adds `pages.colors`.

## 8. OAuth in production

Callback URLs are tied to the origin, so a localhost app will not work in
production until its URL is added.

| Provider | Redirect URI                                             |
| -------- | -------------------------------------------------------- |
| GitHub   | `https://mambruk-ckd.pages.dev/api/auth/callback/github` |
| Google   | `https://mambruk-ckd.pages.dev/api/auth/callback/google` |

Add them alongside the localhost ones rather than replacing them. Separate apps
for local and production keep production secrets off the laptop.

## 9. Custom domain

`wrangler pages` has no domain command. Use the dashboard:

> Workers & Pages → **mambruk** → Custom domains → Set up a domain

The domain must already be a site on the same Cloudflare account. Afterwards
update the OAuth redirect URIs and the `og:url` / `og:image` tags.

## Local development

```bash
cp .env.example .env
pnpm dlx wrangler d1 execute mambruk-db --local --file=./schema.sql
pnpm dev
```

`pnpm dev` uses `platformProxy`, so D1 and KV come from `.wrangler/state/` in
this folder, separate from production.

- `.env` is read once at startup. Editing it while the server runs changes
  nothing, and sessions then fail silently as if the cookie were bad.
- Local D1 state is keyed by `database_id`. Change the id and the local
  database looks empty; re-apply `schema.sql`.
- Open `localhost`, not `127.0.0.1`. The redirect URI follows the origin, and
  the OAuth app registers `localhost`.

```bash
pnpm dlx wrangler d1 execute mambruk-db --local  --command="SELECT * FROM links"
pnpm dlx wrangler d1 execute mambruk-db --remote --command="SELECT * FROM links"
```

`--command` runs multiple statements as one batch: one failure rolls back the
lot and reports only a log file path. Seed by hand one statement at a time.

## Bindings missing in production

Deploy succeeds, the landing page and `/app` work, but anything touching the
database returns 503 or 404.

Environments do not inherit bindings. One `[env.production]` block in
`wrangler.toml`, even for a single `vars` entry, means the production
deployment uses that block alone and the top-level D1 and KV bindings are
ignored — silently.

Check what is actually deployed:

```bash
mkdir /tmp/check && cd /tmp/check
pnpm dlx wrangler pages download config mambruk
cat wrangler.toml
```

Run it in an empty folder; it overwrites `wrangler.toml` where it runs.

Either drop the `[env.*]` blocks so the top level applies everywhere, or copy
every binding into each one. This project does the former.

## Login fails with `?error=token_exchange`

```bash
pnpm dlx wrangler pages deployment tail --project-name mambruk
```

`incorrect_client_credentials` means `GITHUB_CLIENT_SECRET` does not match its
client id. GitHub shows a client secret once; generating a new one kills the
old immediately, including the copy in `.env`.

## Logs and rollback

```bash
pnpm dlx wrangler pages deployment tail --project-name mambruk
pnpm dlx wrangler pages deployment list --project-name mambruk
```

Rollback is a dashboard action (Deployments → pick one → Rollback) or simply
deploying an earlier commit. `wrangler pages` has no rollback command.

## Before going public

- [ ] `database_id` and both KV ids filled in, not placeholders
- [ ] Production `AUTH_SECRET` set and different from `.env`
- [ ] Production OAuth redirect URIs added
- [ ] `schema.sql` applied to the remote database
- [ ] `pnpm test` and `pnpm build` pass
- [ ] `git check-ignore .env` answers
