import type { APIRoute } from 'astro'
import { getUser } from '../../utils/auth'
import { URLValidator } from '../../utils/urlValidator'
import { ICON_NAMES } from '../../utils/icons.js'

// Editor tautan halaman bio. Handle tidak diambil dari form: selalu dari
// halaman milik pengguna yang sedang masuk, supaya tidak ada parameter yang
// bisa dipakai menyunting halaman orang lain.
export const POST: APIRoute = async (context) => {
  const db = context.locals.runtime?.env?.DB
  if (!db) return json({ error: 'Layanan sedang tidak tersedia' }, 503)

  const user = await getUser(context)
  if (!user) return json({ error: 'Silakan masuk dulu' }, 401)

  const page = await db
    .prepare('SELECT handle FROM pages WHERE user_id = ?')
    .bind(user.id)
    .first<{ handle: string }>()
  if (!page) return json({ error: 'Klaim handle dulu' }, 400)

  const form = await context.request.formData()
  const action = String(form.get('action') ?? '')

  if (action === 'add') {
    const label = String(form.get('label') ?? '').trim()
    const url = String(form.get('url') ?? '').trim()
    const section = String(form.get('section') ?? '').trim()
    const description = String(form.get('description') ?? '').trim()
    const icon = String(form.get('icon') ?? '').trim()

    if (!label) return json({ error: 'Label wajib diisi' }, 400)

    const validation = URLValidator.validate(url)
    if (!validation.isValid) {
      return json({ error: `URL tidak valid: ${validation.reason}` }, 400)
    }
    if (icon && !ICON_NAMES.includes(icon)) {
      return json({ error: 'Ikon tidak dikenal' }, 400)
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
  if (!Number.isInteger(id)) return json({ error: 'Tautan tidak dikenal' }, 400)

  // Setiap perubahan menyertakan handle pemilik di WHERE-nya: id saja tidak
  // cukup, karena id itu tebakan yang mudah.
  if (action === 'delete') {
    const result = await db
      .prepare('DELETE FROM page_links WHERE id = ? AND handle = ?')
      .bind(id, page.handle)
      .run()
    // Tidak ada baris yang terhapus berarti id itu bukan milik pengguna ini.
    // Balas 404, jangan 302 seolah berhasil: sukses palsu menyembunyikan bug.
    if (!result.meta.changes) return json({ error: 'Tautan tidak dikenal' }, 404)
    return context.redirect('/app', 302)
  }

  if (action === 'move') {
    const direction = String(form.get('direction') ?? '')
    if (direction !== 'up' && direction !== 'down') {
      return json({ error: 'Arah tidak dikenal' }, 400)
    }

    const current = await db
      .prepare('SELECT id, position FROM page_links WHERE id = ? AND handle = ?')
      .bind(id, page.handle)
      .first<{ id: number; position: number }>()
    if (!current) return json({ error: 'Tautan tidak dikenal' }, 404)

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

    // Sudah di ujung: bukan error, tidak ada yang perlu ditukar.
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

  return json({ error: 'Aksi tidak dikenal' }, 400)
}

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export const prerender = false
