import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'
import { getUser } from '../../utils/auth'
import { isAlias } from '../../utils/code.js'
import { URLValidator } from '../../utils/urlValidator'

// Aliases under the user's handle. The handle comes from the session, not the
// form, and every write filters on it.
export const POST: APIRoute = async (context) => {
  const db = env.DB
  if (!db) return json({ error: 'Service unavailable' }, 503)

  const user = await getUser(context)
  if (!user) return json({ error: 'Please sign in first' }, 401)

  const page = await db
    .prepare('SELECT handle FROM pages WHERE user_id = ?')
    .bind(user.id)
    .first<{ handle: string }>()
  if (!page) return json({ error: 'Claim a handle first' }, 400)

  const form = await context.request.formData()
  // Forms from before actions existed only ever added.
  const action = String(form.get('action') ?? 'add')
  const alias = String(form.get('alias') ?? '')
    .trim()
    .toLowerCase()
  if (!isAlias(alias)) return json({ error: 'Invalid alias' }, 400)

  if (action === 'delete') {
    const result = await db
      .prepare('DELETE FROM links WHERE handle = ? AND code = ?')
      .bind(page.handle, alias)
      .run()
    // Nothing deleted means the alias is not under this user's handle.
    if (!result.meta.changes) return json({ error: 'Unknown alias' }, 404)
    return context.redirect('/dashboard', 302)
  }

  if (action !== 'add' && action !== 'update') {
    return json({ error: 'Unknown action' }, 400)
  }

  const url = String(form.get('url') ?? '').trim()
  const validation = URLValidator.validate(url)
  if (!validation.isValid) {
    return json({ error: `Invalid URL: ${validation.reason}` }, 400)
  }

  if (action === 'update') {
    const result = await db
      .prepare('UPDATE links SET url = ? WHERE handle = ? AND code = ?')
      .bind(url, page.handle, alias)
      .run()
    if (!result.meta.changes) return json({ error: 'Unknown alias' }, 404)
    return context.redirect('/dashboard', 302)
  }

  const result = await db
    .prepare(
      'INSERT INTO links (handle, code, url) VALUES (?, ?, ?) ON CONFLICT(handle, code) DO NOTHING'
    )
    .bind(page.handle, alias, url)
    .run()
  // Changing an existing alias goes through update, so add never overwrites.
  if (!result.meta.changes) return json({ error: 'Alias already exists' }, 409)
  return context.redirect('/dashboard', 302)
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export const prerender = false
