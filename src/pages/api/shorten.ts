import type { APIRoute } from 'astro'
import { URLValidator } from '../../utils/urlValidator'
import { RATE_LIMITS, getClientIP } from '../../utils/rateLimiter'
import { generateCode } from '../../utils/code.js'

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Get client IP for rate limiting
    const clientIP = getClientIP(request)

    // Check rate limit
    const rateLimitKV = locals.runtime?.env?.RATE_LIMITER
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

    const { url } = await request.json()

    // Validate input
    if (!url || typeof url !== 'string') {
      return new Response(JSON.stringify({ error: 'URL is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Comprehensive URL validation
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

    // Check if it's a nested shortener
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

    // Get D1 database from Cloudflare runtime
    const db = locals.runtime?.env?.DB
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

    // Check if URL already exists
    const existing = await db
      .prepare('SELECT code FROM links WHERE url = ?')
      .bind(url)
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

    // Generate unique code
    let code: string
    let attempts = 0
    const maxAttempts = 10

    do {
      code = generateCode()
      const existingCode = await db
        .prepare('SELECT id FROM links WHERE code = ?')
        .bind(code)
        .first()

      if (!existingCode) break

      attempts++
      if (attempts >= maxAttempts) {
        code = generateCode(8) // Use longer code if collision
        break
      }
    } while (attempts < maxAttempts)

    // Insert new link with metadata
    const result = await db
      .prepare(
        'INSERT INTO links (code, url, created_at) VALUES (?, ?, datetime("now"))'
      )
      .bind(code, url)
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
    console.error('Error shortening URL:', error)

    // Don't expose internal errors to users
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
