# Mambruk

URL shortener and link-in-bio pages. Astro on Cloudflare Pages, D1, KV.
See DEPLOYMENT.md for anything involving wrangler.

## Language

English everywhere in the repo: comments, docs, commit messages, test names,
identifiers, error messages, warnings and logs. Indonesian stays only in UI
copy a visitor reads — headings, labels, buttons — because the audience is
Indonesian.

## Comments

Short and flat. State what the code does or the constraint it works under, then
stop. One line where possible, two at most.

```js
// #rrggbb only. Values go straight into a style attribute.
// Constant time compare.
// Legacy path from the standalone shortener. New links are minted at the root.
```

Not this: narrating a chain of consequences, explaining what an attacker could
do, or restating the code in prose. If the reason is worth more than two lines,
it belongs in a commit message.

Comment the non-obvious: a constraint, a workaround, a deliberate shortcut.
Skip comments on code that already reads clearly.

## Code

Ponytail applies: stdlib and native platform before dependencies, shortest
change that works, delete over add. No abstraction with one caller.

- `pnpm` only, never npm or yarn
- Prettier: no semicolons, single quotes, 80 columns
- Tests are `node --test` in `test/*.test.mjs`, no framework. Plain `.js` for
  logic that needs testing, so it imports without a TS loader
- Non-trivial logic leaves one runnable check behind

## Database

`schema.sql` is the shape for fresh databases and never migrates an existing
one — `CREATE TABLE IF NOT EXISTS` will not add a column. Changes to a live
table go in `migrations/NNNN_name.sql` as a one-off. Delete a migration once
every database has moved past it.

## Branches

`feat/add-*` and `chore/*`, stacked on the branch they build on. `master` holds
the old static page; app work merges into `staging`.
