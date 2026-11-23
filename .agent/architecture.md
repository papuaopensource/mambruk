# Architecture

## URL Namespace

```
/{code}              countdown page, then the target
/r/{code}            legacy alias of /{code}, kept so old links work
/@{handle}           bio page
/@{handle}/{alias}   short link owned by a handle
/api/*               JSON API
/login               sign in, 302 to /dashboard when signed in
/dashboard           dashboard, 302 to /login without a session
/app                 301 to /dashboard, kept so old links work
/about, /contact,    text pages on src/layouts/InfoPage.astro
/help, /privacy,
/terms
```

`@` keeps handles and root codes apart. Handles skip the reserved words in
`code.js`, such as `api`, `app` and `r`.

## Rules

- A short link renders `RedirectPage.astro`, the target with a 3 second
  countdown, then `location.replace`, or a meta refresh without JS. Each view of
  that page counts as a click, kept alive with `locals.cfContext.waitUntil`.
- Other redirects are 302. A 301 is cached by browsers, so a target could never
  change. The one 301 is `/app`, a route that moved for good.
- A custom root code needs a session and passes `isCustomCode` in `code.js`,
  which keeps reserved words off the root. `links.user_id` records the owner.
- Unknown codes, aliases and handles call `rewrite('/404')`. The page keeps the
  URL and `src/pages/404.astro` sets the 404 status.
- Check the code's shape with `code.js` before any D1 query, so `/favicon.ico`
  and friends cost nothing.
- Addresses shown on pages and in Open Graph tags come from `site` in
  `astro.config.mjs`, through `src/utils/site.ts`, so they read `mambr.uk` on
  any origin. OAuth redirect URIs keep the request origin.
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
SameSite=Lax` cookie, then sends the user to `/dashboard`. A failure goes to
`/login?error={code}`, and the login page words the known codes. The redirect
URI is built from the request origin, so every origin needs its own entry at
the provider.

Ownership lives in `pages.user_id`. Every write under a handle checks it.

## Adding A Route

1. Add the file under `src/pages/`. Server routes set `prerender = false`.
2. Put logic that needs a test in plain `.js` under `src/utils/`.
3. Read the user with the helper in `auth.ts`; reject before touching D1.
4. Add a new top-level path segment to the reserved words in `code.js`.
