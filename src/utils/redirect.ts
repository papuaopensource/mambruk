import type { APIContext } from 'astro'
import { env } from 'cloudflare:workers'
import { RATE_LIMITS, getClientIP } from './rateLimiter'
import { isCode, isAlias } from './code.js'

// handleRedirect serves /{code}, /r/{code} and /@{handle}/{alias}. handle is ''
// for root codes, since SQLite's UNIQUE ignores NULLs.
export async function handleRedirect(
  { params, redirect, request, rewrite, locals }: APIContext,
  handle = ''
): Promise<string | Response> {
  const code = handle ? params.alias : params.code
  const home = handle ? `/@${handle}` : '/'

  // Shape check first, so /robots.txt costs no D1 query.
  if (!(handle ? isAlias(code) : isCode(code))) return rewrite('/404')

  try {
    const rateLimitKV = env.RATE_LIMITER
    const rateLimit = await RATE_LIMITS.REDIRECTS.checkLimit(
      rateLimitKV,
      getClientIP(request)
    )
    if (!rateLimit.allowed) return redirect(home, 302)

    const db = env.DB
    if (!db) {
      console.error('Database not available')
      return redirect(home, 302)
    }

    const link = await db
      .prepare('SELECT url FROM links WHERE handle = ? AND code = ?')
      .bind(handle, code)
      .first<{ url: string }>()

    if (!link) return rewrite('/404')

    // Fire and forget, so the redirect does not wait on the counter.
    const counting = db
      .prepare(
        'UPDATE links SET clicks = clicks + 1 WHERE handle = ? AND code = ?'
      )
      .bind(handle, code)
      .run()
      .catch((error: unknown) => {
        console.error('Failed to update click count:', error)
      })
    locals.cfContext?.waitUntil(counting)

    try {
      const target = new URL(link.url)
      if (!['http:', 'https:'].includes(target.protocol)) {
        console.warn(`Blocked redirect to invalid protocol: ${link.url}`)
        return redirect(home, 302)
      }
    } catch {
      console.warn(`Blocked redirect to malformed URL: ${link.url}`)
      return redirect(home, 302)
    }

    return link.url
  } catch (error) {
    console.error('Error redirecting:', error)
    return redirect(home, 302)
  }
}
