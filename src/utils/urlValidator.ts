// Target URL checks for format, blocklist, patterns, extension and length.

interface ValidationResult {
  isValid: boolean
  reason?: string
}

const BLACKLISTED_DOMAINS = new Set([
  // Shorteners, so links do not nest.
  'bit.ly',
  'tinyurl.com',
  'short.link',
  'ow.ly',
  't.co',
  'goo.gl',

  // Placeholders until a real blocklist exists.
  'malware-example.com',
  'phishing-site.net',
  'spam-domain.org',

  // Loopback.
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
])

// Matched against the hostname only, not the whole URL.
const IPV4_HOSTNAME = /^[0-9]{1,3}(\.[0-9]{1,3}){3}$/

const SUSPICIOUS_PATTERNS = [
  /\b(phishing|malware|virus|trojan|scam)\b/i,
  /\b(free-money|get-rich|click-here)\b/i,
  /\b(urgent|limited-time|act-now)\b/i,
]

const BLOCKED_EXTENSIONS = new Set([
  'exe',
  'bat',
  'cmd',
  'com',
  'pif',
  'scr',
  'vbs',
  'jar',
  'msi',
  'dll',
  'zip',
  'rar',
  '7z',
])

export class URLValidator {
  static validate(url: string): ValidationResult {
    const formatCheck = this.validateFormat(url)
    if (!formatCheck.isValid) return formatCheck

    const blacklistCheck = this.checkBlacklist(url)
    if (!blacklistCheck.isValid) return blacklistCheck

    const patternCheck = this.checkSuspiciousPatterns(url)
    if (!patternCheck.isValid) return patternCheck

    const extensionCheck = this.checkFileExtension(url)
    if (!extensionCheck.isValid) return extensionCheck

    const lengthCheck = this.checkLength(url)
    if (!lengthCheck.isValid) return lengthCheck

    return { isValid: true }
  }

  private static validateFormat(url: string): ValidationResult {
    try {
      const urlObj = new URL(url)

      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return {
          isValid: false,
          reason: 'Only HTTP and HTTPS URLs are allowed',
        }
      }

      if (!urlObj.hostname || urlObj.hostname.length === 0) {
        return {
          isValid: false,
          reason: 'Invalid hostname',
        }
      }

      if (IPV4_HOSTNAME.test(urlObj.hostname)) {
        return {
          isValid: false,
          reason: 'Raw IP addresses are not allowed',
        }
      }

      return { isValid: true }
    } catch (error) {
      return {
        isValid: false,
        reason: 'Invalid URL format',
      }
    }
  }

  private static checkBlacklist(url: string): ValidationResult {
    try {
      const urlObj = new URL(url)
      const hostname = urlObj.hostname.toLowerCase()

      if (BLACKLISTED_DOMAINS.has(hostname)) {
        return {
          isValid: false,
          reason: 'Domain is blacklisted',
        }
      }

      for (const blacklistedDomain of BLACKLISTED_DOMAINS) {
        if (hostname.endsWith(`.${blacklistedDomain}`)) {
          return {
            isValid: false,
            reason: 'Domain is blacklisted',
          }
        }
      }

      return { isValid: true }
    } catch (error) {
      return { isValid: false, reason: 'Invalid URL for blacklist check' }
    }
  }

  private static checkSuspiciousPatterns(url: string): ValidationResult {
    const lowerUrl = url.toLowerCase()

    for (const pattern of SUSPICIOUS_PATTERNS) {
      if (pattern.test(lowerUrl)) {
        return {
          isValid: false,
          reason: 'URL contains suspicious patterns',
        }
      }
    }

    return { isValid: true }
  }

  private static checkFileExtension(url: string): ValidationResult {
    try {
      const urlObj = new URL(url)
      const pathname = urlObj.pathname.toLowerCase()

      const lastDot = pathname.lastIndexOf('.')
      if (lastDot === -1) return { isValid: true }

      const extension = pathname.substring(lastDot + 1)

      if (BLOCKED_EXTENSIONS.has(extension)) {
        return {
          isValid: false,
          reason: `File type .${extension} is not allowed`,
        }
      }

      return { isValid: true }
    } catch (error) {
      return { isValid: true }
    }
  }

  private static checkLength(url: string): ValidationResult {
    const MAX_URL_LENGTH = 2048 // Standard browser limit

    if (url.length > MAX_URL_LENGTH) {
      return {
        isValid: false,
        reason: 'URL is too long',
      }
    }

    return { isValid: true }
  }

  // isShortener covers more shorteners than the blocklist.
  static isShortener(url: string): boolean {
    try {
      const urlObj = new URL(url)
      const hostname = urlObj.hostname.toLowerCase()

      const shorteners = [
        'bit.ly',
        'tinyurl.com',
        'short.link',
        'ow.ly',
        't.co',
        'goo.gl',
        'is.gd',
        'v.gd',
        'tiny.cc',
      ]

      return shorteners.some(
        (shortener) =>
          hostname === shortener || hostname.endsWith(`.${shortener}`)
      )
    } catch (error) {
      return false
    }
  }
}

export {
  BLACKLISTED_DOMAINS,
  SUSPICIOUS_PATTERNS,
  BLOCKED_EXTENSIONS,
  IPV4_HOSTNAME,
}
