# Architecture

## URL Namespace

```
/{code}              302 to the target
/r/{code}            legacy alias of /{code}, kept so old links work
/@{handle}           bio page
/@{handle}/{alias}   short link owned by a handle
/api/*               JSON API
/app/*               dashboard, session required
```

`@` keeps handles and root codes apart. Handles skip the reserved words in
`code.js`, such as `api`, `app` and `r`.

## Rules

- Redirects are 302. A 301 is cached by browsers, so clicks go uncounted and a
  target can never change.
- Unknown codes, aliases and handles call `rewrite('/404')`. The page keeps the
  URL and `src/pages/404.astro` sets the 404 status.
- Check the code's shape with `code.js` before any D1 query, so `/favicon.ico`
  and friends cost nothing.
- Bindings and secrets come from `env` in `cloudflare:workers`. A missing
  binding degrades: no `DB` returns 503, no `RATE_LIMITER` lets the request
  through.
- No `[env.*]` blocks in `wrangler.toml`: environments do not inherit bindings.
- One shared helper per job in `src/utils/`. Extend it before writing a second.
- No auth or ORM library. Sessions are an HMAC-signed cookie holding an id; the
  row lives in D1.

## Auth

`/api/auth/{provider}` redirects to GitHub or Google. The callback exchanges the
code, upserts `users`, writes a `sessions` row and sets an `HttpOnly; Secure;
SameSite=Lax` cookie. The redirect URI is built from the request origin, so every
origin needs its own entry at the provider.

Ownership lives in `pages.user_id`. Every write under a handle checks it.

## Adding A Route

1. Add the file under `src/pages/`. Server routes set `prerender = false`.
2. Put logic that needs a test in plain `.js` under `src/utils/`.
3. Read the user with the helper in `auth.ts`; reject before touching D1.
4. Add a new top-level path segment to the reserved words in `code.js`.
