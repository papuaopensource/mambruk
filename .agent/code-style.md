# Code style

Clean Code, SOLID and DRY apply to every part of Mambruk: API routes, pages,
utils and tests.

## Language

English everywhere in the repo: comments, docs, commit messages, test names,
identifiers, error messages, warnings, logs and API responses.

UI copy is Indonesian, plain and friendly, the way a person would say it.
Address the reader as `kamu`, keep sentences short, and say what happens. No
hype, no slang for its own sake, no exclamation marks, and no claim or promise
the code does not back, such as a blocklist that does not exist. The help,
privacy and terms pages follow the code, so update them with it. A page words
its own errors instead of showing the English API message. Terms that read
better in English stay English, such as `Dashboard`, `Preview` and the open
source credit. Seeded content of a real page keeps its own language.

No em dashes, in code or prose. Use a comma, a full stop, or restructure the
sentence.

## Tooling

- `pnpm` for every command, never npm or yarn.
- Prettier: no semicolons, single quotes, trailing commas (es5), 2 spaces, 80
  columns. `pnpm format` applies it, `pnpm format:check` checks it.
- TypeScript strict. Plain `.js` with JSDoc where `node --test` imports it.
- Comments follow [code-conventions.md](code-conventions.md).

## Clean Code

- Write the smallest code that solves the actual problem. Delete before adding.
- Prefer boring and obvious over clever.
- Stdlib and the platform before a dependency: Web Crypto, `URL`, `fetch`,
  native form elements, CSS before JS.
- Names carry the meaning, so most code needs no comment.
- A function does one thing at one level of abstraction.
- Files stay under 500 lines; split by responsibility. `app/index.astro` is
  close.
- No dead code, no commented-out code, no unused exports.
- An API route validates its input first and answers with a clear status: 400,
  401, 403, 404, 409, 429, 503.

## SOLID, as Mambruk reads it

- **Single responsibility.** One route file, one endpoint. One util, one job:
  `code.js` shapes, `session.js` cookies, `auth.ts` providers and users,
  `redirect.ts` redirects, `theme.js` themes.
- **Open/closed.** A table, not a branch, where variants grow: `PROVIDERS` in
  `auth.ts`, `THEMES` in `theme.js`, `ICONS` in `icons.js`. A new provider or
  theme is a new entry.
- **Liskov substitution.** A stand-in owes the real contract. A fake D1 that
  never fails is not a stand-in for D1.
- **Interface segregation.** Small helpers taking what they use, not the whole
  `APIContext` when a `URL` will do.
- **Dependency inversion.** Utils depend on no route or page. Pure logic in
  `.js` depends on no Cloudflare binding, so it is testable without one.

SOLID misapplied is a class for every helper and a file for every function. A
new abstraction names the second caller that needs it.

## DRY

One source of truth per piece of knowledge:

- shapes and reserved words in `code.js`; colors in `theme.js`;
- shared helpers reused: `handleRedirect`, `getUser`, `URLValidator`,
  `RateLimiter`;
- the schema in `schema.sql`, mirrored by each migration.

Extend an existing helper before writing a second one. Do not merge code that
only looks alike: DRY is about one piece of knowledge, not similar lines.

## Data in tables, not in branches

Lists that grow, such as themes, icons, providers, reserved words and rate
limits, live in one exported constant next to the code that reads it. Facts of a
mechanism stay inline: HTTP statuses, cookie attributes, regex shapes.
