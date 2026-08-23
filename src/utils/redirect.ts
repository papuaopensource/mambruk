import type { APIContext } from 'astro'
import { RATE_LIMITS, getClientIP } from './rateLimiter'
import { isCode } from './code.js'

// Shared by /{code} and the legacy /r/{code}.
export async function handleRedirect({
  params,
  locals,
  redirect,
  request,
}: APIContext) {
  const { code } = params

  // Cheap shape check first: never spend a D1 query on /robots.txt & friends.
  if (!isCode(code)) return redirect('/', 302)

  try {
    const rateLimitKV = locals.runtime?.env?.RATE_LIMITER
    const rateLimit = await RATE_LIMITS.REDIRECTS.checkLimit(
      rateLimitKV,
      getClientIP(request)
    )
    if (!rateLimit.allowed) return redirect('/', 302)

    const db = locals.runtime?.env?.DB
    if (!db) {
      console.error('Database not available')
      return redirect('/', 302)
    }

    const link = await db
      .prepare('SELECT url FROM links WHERE code = ?')
      .bind(code)
      .first<{ url: string }>()

    if (!link) return redirect('/', 302)

    // Fire and forget: the redirect should not wait on the counter.
    db.prepare('UPDATE links SET clicks = clicks + 1 WHERE code = ?')
      .bind(code)
      .run()
      .catch((error: unknown) => {
        console.error('Failed to update click count:', error)
      })

    try {
      const target = new URL(link.url)
      if (!['http:', 'https:'].includes(target.protocol)) {
        console.warn(`Blocked redirect to invalid protocol: ${link.url}`)
        return redirect('/', 302)
      }
    } catch {
      console.warn(`Blocked redirect to malformed URL: ${link.url}`)
      return redirect('/', 302)
    }

    // 302, not 301: a 301 is cached by the browser forever, which loses clicks
    // and makes a link's destination impossible to change later.
    return redirect(link.url, 302)
  } catch (error) {
    console.error('Error redirecting:', error)
    return redirect('/', 302)
  }
}
