# Commits

`.husky/commit-msg` enforces Conventional Commits on the first line:

```text
type(scope): description
```

## Rules

- **Type**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`,
  `ci`, `build`, `revert`.
- **Scope**, optional: `auth`, `bio`, `shortener`, `dashboard`, `db`. Omit it for
  repository-wide changes.
- **Description**: English, lowercase, imperative or noun phrase, no trailing
  period, at most 72 characters.
- A body only when the reason does not fit the line.
- No co-author or attribution line, in commits or pull requests.
- One logical change per commit.

```text
feat: add handle aliases (/@handle/alias)
fix: exchange OAuth code with form-urlencoded body
chore: switch repo language to English
```

## Branches

`feat/add-*` and `chore/*`, stacked on the branch they build on. Code merges
into `staging`, which CI deploys to Cloudflare Workers, and `staging` merges
into `master`, the default branch. Docs-only changes may go straight to
`master`; fast-forward `staging` after.

## Workflow

- Commit only when asked. Never push unless asked, and check `git remote -v`
  first.
- Merge only with explicit permission: the user merges.
- Never commit `.env`, `.dev.vars`, `dist/`, `.wrangler/` or database exports.
- Check `git diff` before finishing.
