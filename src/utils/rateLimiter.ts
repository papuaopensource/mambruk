// Rate Limiter using Cloudflare KV
// Implements sliding window rate limiting

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
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
    // Fallback if KV is not available (development)
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
      // Get existing requests from KV
      const existingData = await kv.get(key, 'json')
      let requests: number[] = existingData ? (existingData as number[]) : []

      // Filter out requests outside the current window
      requests = requests.filter((timestamp) => timestamp > windowStart)

      // Check if limit exceeded
      if (requests.length >= this.config.maxRequests) {
        const oldestRequest = Math.min(...requests)
        const resetTime = oldestRequest + this.config.windowMs

        return {
          allowed: false,
          remaining: 0,
          resetTime,
        }
      }

      // Add current request
      requests.push(now)

      // Store updated requests with TTL
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
      // Allow request on error to avoid blocking legitimate users
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: now + this.config.windowMs,
      }
    }
  }
}

// Default rate limit configurations
export const RATE_LIMITS = {
  // 10 requests per minute for URL shortening
  URL_SHORTENING: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
  }),

  // 100 requests per minute for redirects (more lenient)
  REDIRECTS: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  }),
}

// Helper function to get client IP
export function getClientIP(request: Request): string {
  // Try Cloudflare headers first
  const cfConnectingIP = request.headers.get('CF-Connecting-IP')
  if (cfConnectingIP) return cfConnectingIP

  // Fallback to other headers
  const xForwardedFor = request.headers.get('X-Forwarded-For')
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim()
  }

  const xRealIP = request.headers.get('X-Real-IP')
  if (xRealIP) return xRealIP

  // Fallback for development
  return 'unknown'
}
