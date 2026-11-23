import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'
import { getUser } from '../../utils/auth'
import { isHandle } from '../../utils/code.js'
import { THEME_NAMES, pickOverrides } from '../../utils/theme.js'

// Claim a handle. One page per user for now.
export const POST: APIRoute = async (context) => {
  const db = env.DB
  if (!db) return json({ error: 'Service unavailable' }, 503)

  const user = await getUser(context)
  if (!user) return json({ error: 'Sign in first' }, 401)

  const form = await context.request.formData()
  const handle = String(form.get('handle') ?? '')
    .trim()
    .toLowerCase()
  const title = String(form.get('title') ?? '').trim()
  const tagline = String(form.get('tagline') ?? '').trim()
  const theme = String(form.get('theme') ?? 'noir').trim()

  if (!isHandle(handle)) {
    return json({ error: 'Handle is invalid or reserved' }, 400)
  }
  if (!title) return json({ error: 'Title is required' }, 400)
  if (!THEME_NAMES.includes(theme)) {
    return json({ error: 'Unknown theme' }, 400)
  }

  // Colours equal to the preset are not stored, so a new theme recolours all.
  const colors = pickOverrides(theme, {
    bg: form.get('bg'),
    surface: form.get('surface'),
    fg: form.get('fg'),
    muted: form.get('muted'),
    btn_bg: form.get('btn_bg'),
    btn_fg: form.get('btn_fg'),
    btn_border: form.get('btn_border'),
  })

  const taken = await db
    .prepare('SELECT user_id FROM pages WHERE handle = ?')
    .bind(handle)
    .first<{ user_id: string | null }>()
  if (taken && taken.user_id !== user.id) {
    return json({ error: 'Handle is taken' }, 409)
  }

  const mine = await db
    .prepare('SELECT handle FROM pages WHERE user_id = ?')
    .bind(user.id)
    .first<{ handle: string }>()
  if (mine && mine.handle !== handle) {
    return json({ error: 'You already have a page: @' + mine.handle }, 409)
  }

  await db
    .prepare(
      `INSERT INTO pages (handle, user_id, title, tagline, theme, colors)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(handle) DO UPDATE SET title = excluded.title,
                                         tagline = excluded.tagline,
                                         theme = excluded.theme,
                                         colors = excluded.colors`
    )
    .bind(handle, user.id, title, tagline || null, theme, colors)
    .run()

  return context.redirect('/app', 302)
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export const prerender = false
