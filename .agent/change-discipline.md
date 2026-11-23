# Change Discipline

- Keep changes small and focused on the task.
- Do not change `.env`, `wrangler.toml` ids, secrets or the user's local files
  without asking.
- Do not delete or overwrite existing changes in the worktree.
- Do not touch `index.html`, `assets/` or the Pages workflow on app branches;
  they serve the old static page from `master`.
- Do not run anything with `--remote` against D1 without asking.
- Check `git diff` before finishing, and keep `dist/`, `.wrangler/`, exports and
  secrets out of the change.
