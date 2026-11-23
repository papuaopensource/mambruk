# Testing

Tests are `node --test` in `test/*.test.mjs`, no framework. They import plain
`.js` from `src/utils/`, so logic that needs a test lives there, not in `.ts` or
`.astro`.

Tests must not depend on Cloudflare, the network or today's date. Keep decisions
in pure functions, as in `code.js`, `session.js` and `theme.js`.

Non-trivial logic leaves one runnable check behind.

The pre-commit hook runs Prettier on staged files and `pnpm test`. CI on
`staging` chains the same steps as jobs, format, then typecheck and test, then
build, and deploys that build to Cloudflare Pages. Pull requests stop before the
deploy.

Before finishing a change:

1. `pnpm format:check`
2. `pnpm check`
3. `pnpm test`
4. `pnpm build`
5. For routes, auth or D1 changes: `pnpm dev` against the local database and
   exercise the route, including the failing cases (401, 403, 404).
