// Signed session cookie. Plain JS so node --test can import it directly.

const encoder = new TextEncoder()

function base64url(bytes) {
  let binary = ''
  for (const b of new Uint8Array(bytes)) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function hmac(value, secret) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  return base64url(await crypto.subtle.sign('HMAC', key, encoder.encode(value)))
}

// equals compares in constant time.
function equals(a, b) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export async function seal(value, secret) {
  return `${value}.${await hmac(value, secret)}`
}

export async function unseal(token, secret) {
  if (typeof token !== 'string') return null
  const cut = token.lastIndexOf('.')
  if (cut < 1) return null
  const value = token.slice(0, cut)
  return equals(token.slice(cut + 1), await hmac(value, secret)) ? value : null
}

export function readCookie(header, name) {
  for (const part of (header ?? '').split(';')) {
    const [key, ...rest] = part.trim().split('=')
    if (key === name) return rest.join('=')
  }
  return null
}
