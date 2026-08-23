// URL Validation and Security Checks
// Prevents malicious URLs and implements blacklisting

interface ValidationResult {
  isValid: boolean
  reason?: string
}

// Common malicious/spam domains and patterns
const BLACKLISTED_DOMAINS = new Set([
  // Malware/Phishing domains (examples)
  'bit.ly', // Prevent nested shorteners
  'tinyurl.com',
  'short.link',
  'ow.ly',
  't.co',
  'goo.gl',

  // Known malicious patterns (add real ones in production)
  'malware-example.com',
  'phishing-site.net',
  'spam-domain.org',

  // Localhost and internal networks
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
])

// Raw IPv4 host, e.g. http://203.0.113.10/ — checked against the hostname
// only. The old version tested this against the whole URL, which rejected any
// link containing a dotted version number.
const IPV4_HOSTNAME = /^[0-9]{1,3}(\.[0-9]{1,3}){3}$/

// Suspicious URL patterns
const SUSPICIOUS_PATTERNS = [
  /\b(phishing|malware|virus|trojan|scam)\b/i,
  /\b(free-money|get-rich|click-here)\b/i,
  /\b(urgent|limited-time|act-now)\b/i,
]

// File extensions that should be blocked
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
  /**
   * Comprehensive URL validation
   */
  static validate(url: string): ValidationResult {
    // Basic format validation
    const formatCheck = this.validateFormat(url)
    if (!formatCheck.isValid) return formatCheck

    // Domain blacklist check
    const blacklistCheck = this.checkBlacklist(url)
    if (!blacklistCheck.isValid) return blacklistCheck

    // Suspicious pattern check
    const patternCheck = this.checkSuspiciousPatterns(url)
    if (!patternCheck.isValid) return patternCheck

    // File extension check
    const extensionCheck = this.checkFileExtension(url)
    if (!extensionCheck.isValid) return extensionCheck

    // URL length check
    const lengthCheck = this.checkLength(url)
    if (!lengthCheck.isValid) return lengthCheck

    return { isValid: true }
  }

  /**
   * Basic URL format validation
   */
  private static validateFormat(url: string): ValidationResult {
    try {
      const urlObj = new URL(url)

      // Only allow HTTP/HTTPS
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return {
          isValid: false,
          reason: 'Only HTTP and HTTPS URLs are allowed',
        }
      }

      // Check for valid hostname
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

  /**
   * Check against blacklisted domains
   */
  private static checkBlacklist(url: string): ValidationResult {
    try {
      const urlObj = new URL(url)
      const hostname = urlObj.hostname.toLowerCase()

      // Check exact domain match
      if (BLACKLISTED_DOMAINS.has(hostname)) {
        return {
          isValid: false,
          reason: 'Domain is blacklisted',
        }
      }

      // Check subdomain matches
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

  /**
   * Check for suspicious patterns in URL
   */
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

  /**
   * Check for blocked file extensions
   */
  private static checkFileExtension(url: string): ValidationResult {
    try {
      const urlObj = new URL(url)
      const pathname = urlObj.pathname.toLowerCase()

      // Extract file extension
      const lastDot = pathname.lastIndexOf('.')
      if (lastDot === -1) return { isValid: true } // No extension

      const extension = pathname.substring(lastDot + 1)

      if (BLOCKED_EXTENSIONS.has(extension)) {
        return {
          isValid: false,
          reason: `File type .${extension} is not allowed`,
        }
      }

      return { isValid: true }
    } catch (error) {
      return { isValid: true } // Allow if can't parse
    }
  }

  /**
   * Check URL length limits
   */
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

  /**
   * Check if URL is a known URL shortener (prevent nesting)
   */
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

// Export for easy access
export { BLACKLISTED_DOMAINS, SUSPICIOUS_PATTERNS, BLOCKED_EXTENSIONS, IPV4_HOSTNAME }
