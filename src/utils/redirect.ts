import type { APIContext } from 'astro'
import { RATE_LIMITS, getClientIP } from './rateLimiter'
import { isCode, isAlias } from './code.js'

// Shared by /{code}, /r/{code} and /@{handle}/{alias}. handle is '' for the
// global namespace: SQLite's UNIQUE ignores NULLs.
export async function handleRedirect(
  { params, locals, redirect, request }: APIContext,
  handle = ''
) {
  const code = handle ? params.alias : params.code
  const home = handle ? `/@${handle}` : '/'

  // Shape check first, so /robots.txt never costs a D1 query.
  if (!(handle ? isAlias(code) : isCode(code))) return redirect(home, 302)

  try {
    const rateLimitKV = locals.runtime?.env?.RATE_LIMITER
    const rateLimit = await RATE_LIMITS.REDIRECTS.checkLimit(
      rateLimitKV,
      getClientIP(request)
    )
    if (!rateLimit.allowed) return redirect(home, 302)

    const db = locals.runtime?.env?.DB
    if (!db) {
      console.error('Database not available')
      return redirect(home, 302)
    }

    const link = await db
      .prepare('SELECT url FROM links WHERE handle = ? AND code = ?')
      .bind(handle, code)
      .first<{ url: string }>()

    if (!link) return redirect(home, 302)

    // Fire and forget: the redirect should not wait on the counter.
    db.prepare(
      'UPDATE links SET clicks = clicks + 1 WHERE handle = ? AND code = ?'
    )
      .bind(handle, code)
      .run()
      .catch((error: unknown) => {
        console.error('Failed to update click count:', error)
      })

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

    // 302, not 301: browsers cache 301 forever, losing clicks and pinning the
    // destination.
    return redirect(link.url, 302)
  } catch (error) {
    console.error('Error redirecting:', error)
    return redirect(home, 302)
  }
}
