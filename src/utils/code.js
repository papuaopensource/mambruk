// Short code, alias and handle shapes. Plain JS so node --test can import it.

const ALPHABET =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

// 4-32 chars, no dots, so /favicon.ico and /robots.txt never reach D1.
export const CODE_RE = /^[A-Za-z0-9_-]{4,32}$/

export function isCode(value) {
  return typeof value === 'string' && CODE_RE.test(value)
}

// Alias is unique per handle, so short ones like "ig" are fine.
export const ALIAS_RE = /^[a-z0-9][a-z0-9_-]{0,31}$/

export function isAlias(value) {
  return typeof value === 'string' && ALIAS_RE.test(value)
}

// Top-level routes and product words. No handle or custom code may take one.
const RESERVED = new Set([
  'app',
  'api',
  'admin',
  'login',
  'logout',
  'auth',
  'about',
  'contact',
  'help',
  'support',
  'terms',
  'privacy',
  'palette',
  'settings',
  'dashboard',
  'mambruk',
  'me',
  'new',
  'static',
  'assets',
  'r',
])

// isCustomCode checks a code a signed-in user picked. Case is ignored for the
// reserved words, so /About cannot shadow /about.
export function isCustomCode(value) {
  return isCode(value) && !RESERVED.has(value.toLowerCase())
}

export const HANDLE_RE = /^[a-z0-9][a-z0-9-]{1,29}$/

export function isHandle(value) {
  return (
    typeof value === 'string' && HANDLE_RE.test(value) && !RESERVED.has(value)
  )
}

// generateCode keeps 6 bits of each random byte and skips 62 and 63, so every
// character has the same odds.
export function generateCode(length = 6) {
  let out = ''
  while (out.length < length) {
    for (const b of crypto.getRandomValues(new Uint8Array(length))) {
      const i = b >> 2
      if (i < ALPHABET.length && out.length < length) out += ALPHABET[i]
    }
  }
  return out
}
