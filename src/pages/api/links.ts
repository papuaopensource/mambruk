import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'
import { getUser } from '../../utils/auth'
import { isAlias } from '../../utils/code.js'
import { URLValidator } from '../../utils/urlValidator'

// Create an alias under handle.
export const POST: APIRoute = async (context) => {
  const db = env.DB
  if (!db) return json({ error: 'Service unavailable' }, 503)

  const user = await getUser(context)
  if (!user) return json({ error: 'Please sign in first' }, 401)

  const form = await context.request.formData()
  const handle = String(form.get('handle') ?? '')
    .trim()
    .toLowerCase()
  const alias = String(form.get('alias') ?? '')
    .trim()
    .toLowerCase()
  const url = String(form.get('url') ?? '').trim()

  if (!isAlias(alias)) return json({ error: 'Invalid alias' }, 400)

  const validation = URLValidator.validate(url)
  if (!validation.isValid) {
    return json({ error: `Invalid URL: ${validation.reason}` }, 400)
  }

  const page = await db
    .prepare('SELECT user_id FROM pages WHERE handle = ?')
    .bind(handle)
    .first<{ user_id: string | null }>()
  if (!page || page.user_id !== user.id) {
    return json({ error: 'That handle is not yours' }, 403)
  }

  await db
    .prepare(
      `INSERT INTO links (handle, code, url) VALUES (?, ?, ?)
       ON CONFLICT(handle, code) DO UPDATE SET url = excluded.url`
    )
    .bind(handle, alias, url)
    .run()

  return context.redirect('/dashboard', 302)
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export const prerender = false
