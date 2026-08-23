// Short-code shape. Plain JS so `node --test` can import it without a
// TypeScript loader.

const ALPHABET =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

// 4..32 alnum/-/_ . Rejects anything with a dot (favicon.ico, robots.txt) and
// short static route names, so the catch-all redirect never queries D1 for them.
export const CODE_RE = /^[A-Za-z0-9_-]{4,32}$/

export function isCode(value) {
  return typeof value === 'string' && CODE_RE.test(value)
}

// Alias pilihan manusia: huruf kecil, angka, - dan _. Boleh sependek "ig",
// karena keunikannya per handle, bukan global.
export const ALIAS_RE = /^[a-z0-9][a-z0-9_-]{0,31}$/

export function isAlias(value) {
  return typeof value === 'string' && ALIAS_RE.test(value)
}

// Handle tidak boleh menabrak route statis di root, karena /@handle memang
// dipisah dengan @ tapi dashboard, API, dan halaman produk hidup di /app,
// /api, dst. Daftarnya pendek dan sengaja konservatif.
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
