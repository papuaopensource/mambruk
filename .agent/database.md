# Database

D1 database `mambruk-db`, binding `DB`.

| Table        | Holds                                                                      |
| ------------ | -------------------------------------------------------------------------- |
| `links`      | short links; `handle` is empty for root codes, unique per `(handle, code)` |
| `users`      | one row per OAuth identity                                                 |
| `sessions`   | session id, user, expiry                                                   |
| `pages`      | bio pages; `user_id` owns the handle                                       |
| `page_links` | ordered links on a bio page, grouped by `section`                          |

`links.user_id` owns the root links a user made while signed in. Anonymous links
keep NULL.

## Schema and migrations

`schema.sql` is the shape for fresh databases and never migrates an existing one,
since `CREATE TABLE IF NOT EXISTS` will not add a column. Changes to a live table
go in `migrations/NNNN_name.sql` as a one-off, and `schema.sql` gets the same
change. Delete a migration once every database has moved past it.

Export before running a migration on the remote database:

```sh
pnpm dlx wrangler d1 export mambruk-db --remote --output backup.sql
pnpm dlx wrangler d1 execute mambruk-db --remote --file=./migrations/NNNN_name.sql
```

## Seeding by hand

`--command` runs several statements as one batch: one failure rolls back the lot
and reports only a log file path. Run statements one at a time.

Local D1 state is keyed by `database_id`. A changed id makes the local database
look empty; re-apply `schema.sql`.
