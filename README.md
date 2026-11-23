# Mambruk

[![CI](https://github.com/papuaopensource/mambruk/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/papuaopensource/mambruk/actions/workflows/ci.yml)
[![CodeQL](https://github.com/papuaopensource/mambruk/actions/workflows/codeql.yml/badge.svg?branch=master)](https://github.com/papuaopensource/mambruk/actions/workflows/codeql.yml)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/papuaopensource/mambruk/badge)](https://scorecard.dev/viewer/?uri=github.com/papuaopensource/mambruk)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

> An open-source URL shortener and link-in-bio platform.

Initiated by **Papua Open Source**. Live at [mambr.uk](https://mambr.uk).

## About

Mambruk puts short links and link-in-bio pages under one account and one
domain. Short links live at `mambr.uk/{code}`, bio pages at
`mambr.uk/@{handle}`.

## Features

- Shorten any URL, no account needed
- Bio pages with sections, icons and descriptions per link
- Themes and custom colors for bio pages
- Aliases under a handle, such as `mambr.uk/@{handle}/{alias}`
- Sign in with GitHub or Google
- Click counts per short link
- Rate limiting and URL checks against nested shorteners and unsafe targets

## Stack

- Astro 7 + TypeScript, server rendered with `@astrojs/cloudflare`
- Cloudflare Workers for hosting
- Cloudflare D1 (SQLite) database
- Cloudflare KV for rate limiting
- Tailwind CSS v4
- OAuth with GitHub and Google
- Wrangler for local development and deploys
- pnpm as package manager

## Getting Started

```sh
pnpm install
cp .env.example .env
pnpm dlx wrangler d1 execute mambruk-db --local --file=./schema.sql
pnpm dev
```

Before opening a pull request:

```sh
pnpm format:check
pnpm check
pnpm test
pnpm build
```

Pull requests go to `staging`, which deploys a preview for review. Merging
`staging` into `master` deploys to production.

## License

MIT License. See the [LICENSE](LICENSE) file for details.
