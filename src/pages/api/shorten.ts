import type { APIRoute } from 'astro'
import { env } from 'cloudflare:workers'
import { URLValidator } from '../../utils/urlValidator'
import { RATE_LIMITS, getClientIP } from '../../utils/rateLimiter'
import { generateCode, isCode, isCustomCode } from '../../utils/code.js'
import { getUser } from '../../utils/auth'

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

export const POST: APIRoute = async (context) => {
  const { request } = context
  try {
    const clientIP = getClientIP(request)

    const rateLimitKV = env.RATE_LIMITER
    const rateLimitResult = await RATE_LIMITS.URL_SHORTENING.checkLimit(
      rateLimitKV,
      clientIP
    )

    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded. Please try again later.',
          resetTime: rateLimitResult.resetTime,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
            'Retry-After': Math.ceil(
              (rateLimitResult.resetTime - Date.now()) / 1000
            ).toString(),
          },
        }
      )
    }

    const { url, code: picked } = await request.json<{
      url?: unknown
      code?: unknown
    }>()

    if (!url || typeof url !== 'string') {
      return new Response(JSON.stringify({ error: 'URL is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const validation = URLValidator.validate(url.trim())
    if (!validation.isValid) {
      return new Response(
        JSON.stringify({
          error: `Invalid URL: ${validation.reason}`,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    if (URLValidator.isShortener(url)) {
      return new Response(
        JSON.stringify({
          error: 'Shortening other URL shorteners is not allowed',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    const db = env.DB
    if (!db) {
      console.error(
        'Database not available - check D1 binding in wrangler.toml'
      )
      return new Response(
        JSON.stringify({ error: 'Service temporarily unavailable' }),
        {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // A custom code needs a session. Reserved words read as taken.
    const user = await getUser(context)
    const custom = typeof picked === 'string' ? picked.trim() : ''
    if (custom) {
      if (!user) return json({ error: 'Sign in to pick a custom link' }, 401)
      if (!isCode(custom)) return json({ error: 'Invalid custom link' }, 400)
      const taken =
        !isCustomCode(custom) ||
        (await db
          .prepare("SELECT id FROM links WHERE handle = '' AND code = ?")
          .bind(custom)
          .first())
      if (taken) return json({ error: 'That link is not available' }, 409)
    }

    // Same URL, same owner, same code. Anonymous links share NULL.
    const existing = custom
      ? null
      : await db
          .prepare(
            "SELECT code FROM links WHERE url = ? AND handle = '' AND user_id IS ?"
          )
          .bind(url, user?.id ?? null)
          .first()

    if (existing) {
      return new Response(JSON.stringify({ code: existing.code, url }), {
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
        },
      })
    }

    let code = custom
    for (let attempt = 0; !code && attempt < 10; attempt++) {
      const candidate = generateCode()
      const clash = await db
        .prepare("SELECT id FROM links WHERE code = ? AND handle = ''")
        .bind(candidate)
        .first()
      if (!clash) code = candidate
    }
    if (!code) code = generateCode(8)

    const result = await db
      .prepare(
        'INSERT INTO links (handle, code, url, user_id, created_at) VALUES (\'\', ?, ?, ?, datetime("now"))'
      )
      .bind(code, url, user?.id ?? null)
      .run()

    if (!result.success) {
      throw new Error('Failed to insert link into database')
    }

    return new Response(JSON.stringify({ code, url }), {
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': '10',
        'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
      },
    })
  } catch (error) {
    // Two people picked the same custom code at once.
    if (String(error).includes('UNIQUE')) {
      return json({ error: 'That link is not available' }, 409)
    }
    console.error('Error shortening URL:', error)

    // Internal errors stay out of the response.
    const isClientError = error instanceof SyntaxError // JSON parse error
    const statusCode = isClientError ? 400 : 500
    const message = isClientError
      ? 'Invalid request format'
      : 'Internal server error'

    return new Response(JSON.stringify({ error: message }), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
