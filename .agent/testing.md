# Testing

Tests are `node --test` in `test/*.test.mjs`, no framework. They import plain
`.js` from `src/utils/`, so logic that needs a test lives there, not in `.ts` or
`.astro`.

Tests must not depend on Cloudflare, the network or today's date. Keep decisions
in pure functions, as in `code.js`, `session.js` and `theme.js`.

Non-trivial logic leaves one runnable check behind.

Before finishing a change:

1. `pnpm format:check`
2. `pnpm test`
3. `pnpm build`
4. For routes, auth or D1 changes: `pnpm dev` against the local database and
   exercise the route, including the failing cases (401, 403, 404).
