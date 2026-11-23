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

// Reserved for product routes.
const RESERVED_HANDLES = new Set([
  'api',
  'app',
  'admin',
  'login',
  'logout',
  'auth',
  'about',
  'help',
  'support',
  'terms',
  'privacy',
  'settings',
  'dashboard',
  'mambruk',
  'me',
  'new',
  'static',
  'assets',
  'r',
])

export const HANDLE_RE = /^[a-z0-9][a-z0-9-]{1,29}$/

export function isHandle(value) {
  return (
    typeof value === 'string' &&
    HANDLE_RE.test(value) &&
    !RESERVED_HANDLES.has(value)
  )
}

export function generateCode(length = 6) {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  let out = ''
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length]
  return out
}
