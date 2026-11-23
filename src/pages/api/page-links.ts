import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'
import { getUser } from '../../utils/auth'
import { URLValidator } from '../../utils/urlValidator'
import { ICON_NAMES } from '../../utils/icons.js'

// Bio page link editor. The handle comes from the session, not the form.
export const POST: APIRoute = async (context) => {
  const db = env.DB
  if (!db) return json({ error: 'Service unavailable' }, 503)

  const user = await getUser(context)
  if (!user) return json({ error: 'Sign in first' }, 401)

  const page = await db
    .prepare('SELECT handle FROM pages WHERE user_id = ?')
    .bind(user.id)
    .first<{ handle: string }>()
  if (!page) return json({ error: 'Claim a handle first' }, 400)

  const form = await context.request.formData()
  const action = String(form.get('action') ?? '')

  if (action === 'add') {
    const label = String(form.get('label') ?? '').trim()
    const url = String(form.get('url') ?? '').trim()
    const section = String(form.get('section') ?? '').trim()
    const description = String(form.get('description') ?? '').trim()
    const icon = String(form.get('icon') ?? '').trim()

    if (!label) return json({ error: 'Label is required' }, 400)

    const validation = URLValidator.validate(url)
    if (!validation.isValid) {
      return json({ error: `Invalid URL: ${validation.reason}` }, 400)
    }
    if (icon && !ICON_NAMES.includes(icon)) {
      return json({ error: 'Unknown icon' }, 400)
    }

    const last = await db
      .prepare('SELECT MAX(position) AS max FROM page_links WHERE handle = ?')
      .bind(page.handle)
      .first<{ max: number | null }>()

    await db
      .prepare(
        `INSERT INTO page_links (handle, section, label, description, url, icon, position)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        page.handle,
        section || null,
        label,
        description || null,
        url,
        icon || null,
        (last?.max ?? 0) + 1
      )
      .run()

    return context.redirect('/app', 302)
  }

  const id = Number(form.get('id'))
  if (!Number.isInteger(id)) return json({ error: 'Unknown link' }, 400)

  // Every write filters on the owner's handle, since ids are guessable.
  if (action === 'delete') {
    const result = await db
      .prepare('DELETE FROM page_links WHERE id = ? AND handle = ?')
      .bind(id, page.handle)
      .run()
    // Nothing deleted means the id belongs to someone else.
    if (!result.meta.changes) return json({ error: 'Unknown link' }, 404)
    return context.redirect('/app', 302)
  }

  if (action === 'move') {
    const direction = String(form.get('direction') ?? '')
    if (direction !== 'up' && direction !== 'down') {
      return json({ error: 'Unknown direction' }, 400)
    }

    const current = await db
      .prepare(
        'SELECT id, position FROM page_links WHERE id = ? AND handle = ?'
      )
      .bind(id, page.handle)
      .first<{ id: number; position: number }>()
    if (!current) return json({ error: 'Unknown link' }, 404)

    const neighbour = await db
      .prepare(
        direction === 'up'
          ? `SELECT id, position FROM page_links
             WHERE handle = ? AND position < ? ORDER BY position DESC LIMIT 1`
          : `SELECT id, position FROM page_links
             WHERE handle = ? AND position > ? ORDER BY position ASC LIMIT 1`
      )
      .bind(page.handle, current.position)
      .first<{ id: number; position: number }>()

    // Last in its list, nothing to swap.
    if (neighbour) {
      await db.batch([
        db
          .prepare('UPDATE page_links SET position = ? WHERE id = ?')
          .bind(neighbour.position, current.id),
        db
          .prepare('UPDATE page_links SET position = ? WHERE id = ?')
          .bind(current.position, neighbour.id),
      ])
    }
    return context.redirect('/app', 302)
  }

  return json({ error: 'Unknown action' }, 400)
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export const prerender = false
