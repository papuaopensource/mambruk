# Mambruk

[![CI](https://github.com/papuaopensource/mambruk/actions/workflows/ci.yml/badge.svg?branch=staging)](https://github.com/papuaopensource/mambruk/actions/workflows/ci.yml)
[![CodeQL](https://github.com/papuaopensource/mambruk/actions/workflows/codeql.yml/badge.svg?branch=staging)](https://github.com/papuaopensource/mambruk/actions/workflows/codeql.yml)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/papuaopensource/mambruk/badge)](https://scorecard.dev/viewer/?uri=github.com/papuaopensource/mambruk)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

An open-source URL shortener and link-in-bio platform. Live at
[mambr.uk](https://mambr.uk).

- Short links at `mambr.uk/{code}`
- Bio pages at `mambr.uk/@{handle}`, with themes and aliases such as
  `mambr.uk/@{handle}/{alias}`
- Sign in with GitHub or Google

Built with Astro on Cloudflare Pages, with D1 for data and KV for rate limiting.

## Development

```sh
pnpm install
cp .env.example .env
pnpm dlx wrangler d1 execute mambruk-db --local --file=./schema.sql
pnpm dev
```

```sh
pnpm format:check
pnpm check
pnpm test
pnpm build
```

Pushes to `staging` run these checks in CI and deploy to Cloudflare Pages.

## License

[MIT](LICENSE)
