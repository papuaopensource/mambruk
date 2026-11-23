# Security

## Secrets

- `.env` and `.dev.vars` stay out of the repository. Check with
  `git check-ignore .env`.
- Set production secrets with `wrangler pages secret put`, which prompts. Never
  pass a secret as an argument or pipe it from `echo`.
- Do not print secrets, tokens or session ids, or write them to files or logs.
- Production `AUTH_SECRET` differs from the local one. Rotating it ends every
  session.
- Do not send the user's email address to external services.

## OAuth

- The `state` parameter is checked on every callback.
- Add a redirect URI per origin at the provider; do not replace the localhost one.

## Input

- Every target URL goes through `urlValidator.ts`: `http` and `https` only, no
  nested shorteners, no raw IP hosts.
- Colors are `#rrggbb` only, because they go into a style attribute.
- Handles, aliases and codes are checked against their shapes in `code.js`;
  handles also against the reserved words.

## Ownership

- Every write under a handle checks `pages.user_id` against the session user;
  another user's handle answers 403.
- Ask before deleting rows, pages or Cloudflare resources the user made.
