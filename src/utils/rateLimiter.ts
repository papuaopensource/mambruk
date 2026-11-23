// Sliding window rate limiter over KV.

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
}

export class RateLimiter {
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config
  }

  async checkLimit(
    kv: KVNamespace | undefined,
    identifier: string
  ): Promise<RateLimitResult> {
    if (!kv) {
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: Date.now() + this.config.windowMs,
      }
    }

    const now = Date.now()
    const windowStart = now - this.config.windowMs
    const key = `rate_limit:${identifier}`

    try {
      const existingData = await kv.get(key, 'json')
      let requests: number[] = existingData ? (existingData as number[]) : []

      requests = requests.filter((timestamp) => timestamp > windowStart)

      if (requests.length >= this.config.maxRequests) {
        const oldestRequest = Math.min(...requests)
        const resetTime = oldestRequest + this.config.windowMs

        return {
          allowed: false,
          remaining: 0,
          resetTime,
        }
      }

      requests.push(now)

      await kv.put(key, JSON.stringify(requests), {
        expirationTtl: Math.ceil(this.config.windowMs / 1000),
      })

      return {
        allowed: true,
        remaining: this.config.maxRequests - requests.length,
        resetTime: now + this.config.windowMs,
      }
    } catch (error) {
      console.error('Rate limiter error:', error)
      // Fail open, so a KV outage does not block redirects.
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: now + this.config.windowMs,
      }
    }
  }
}

export const RATE_LIMITS = {
  URL_SHORTENING: new RateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 10,
  }),

  REDIRECTS: new RateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 100,
  }),
}

// getClientIP prefers Cloudflare's header. 'unknown' shares one bucket.
export function getClientIP(request: Request): string {
  const cfConnectingIP = request.headers.get('CF-Connecting-IP')
  if (cfConnectingIP) return cfConnectingIP

  const xForwardedFor = request.headers.get('X-Forwarded-For')
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim()
  }

  const xRealIP = request.headers.get('X-Real-IP')
  if (xRealIP) return xRealIP

  return 'unknown'
}
