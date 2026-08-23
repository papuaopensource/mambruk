import type { APIContext } from 'astro'
import { seal, unseal, readCookie } from './session.js'

export const SESSION_COOKIE = 'mambruk_session'
const STATE_COOKIE = 'mambruk_oauth_state'
const SESSION_DAYS = 30

export type User = {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
  plan: string
}

type Env = Record<string, string | undefined> & { DB?: D1Database }

export const PROVIDERS = {
  github: {
    label: 'GitHub',
    authorize: 'https://github.com/login/oauth/authorize',
    token: 'https://github.com/login/oauth/access_token',
    scope: 'read:user user:email',
  },
  google: {
    label: 'Google',
    authorize: 'https://accounts.google.com/o/oauth2/v2/auth',
    token: 'https://oauth2.googleapis.com/token',
    scope: 'openid email profile',
  },
} as const

export type Provider = keyof typeof PROVIDERS

export function isProvider(value: unknown): value is Provider {
  return typeof value === 'string' && value in PROVIDERS
}

function env(locals: APIContext['locals']): Env {
  return (locals.runtime?.env ?? {}) as Env
}

// Gagal tertutup: tanpa AUTH_SECRET, jangan menandatangani apa pun dengan
// nilai bawaan — cookie yang bisa ditebak sama saja dengan tanpa login.
function secret(locals: APIContext['locals']): string {
  const value = env(locals).AUTH_SECRET
  if (!value || value.length < 32) {
    throw new Error('AUTH_SECRET belum diset (minimal 32 karakter)')
  }
  return value
}

export function credentials(locals: APIContext['locals'], provider: Provider) {
  const e = env(locals)
  const id = e[`${provider.toUpperCase()}_CLIENT_ID`]
  const secretValue = e[`${provider.toUpperCase()}_CLIENT_SECRET`]
  return id && secretValue ? { id, secret: secretValue } : null
}

function cookie(name: string, value: string, maxAge: number, url: URL) {
  const parts = [
    `${name}=${value}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ]
  // Secure hanya dilewati di localhost, supaya `pnpm dev` di http tetap bisa
  // login tanpa melemahkan produksi.
  if (url.protocol === 'https:') parts.push('Secure')
  return parts.join('; ')
}

export async function setStateCookie(context: APIContext, state: string) {
  return cookie(STATE_COOKIE, await seal(state, secret(context.locals)), 600, context.url)
}

export async function readStateCookie(context: APIContext) {
  const raw = readCookie(context.request.headers.get('cookie'), STATE_COOKIE)
  return raw ? await unseal(raw, secret(context.locals)) : null
}

export function clearCookie(name: string, url: URL) {
  return cookie(name, '', 0, url)
}

export async function createSession(context: APIContext, userId: string) {
  const db = env(context.locals).DB!
  const id = crypto.randomUUID()
  const expires = Date.now() + SESSION_DAYS * 86400 * 1000
  await db
    .prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)')
    .bind(id, userId, expires)
    .run()
  return cookie(
    SESSION_COOKIE,
    await seal(id, secret(context.locals)),
    SESSION_DAYS * 86400,
    context.url
  )
}

export async function getUser(context: APIContext): Promise<User | null> {
  const db = env(context.locals).DB
  if (!db) return null

  const raw = readCookie(context.request.headers.get('cookie'), SESSION_COOKIE)
  if (!raw) return null

  let sessionId: string | null = null
  try {
    sessionId = await unseal(raw, secret(context.locals))
  } catch {
    return null // AUTH_SECRET belum diset
  }
  if (!sessionId) return null

  const row = await db
    .prepare(
      `SELECT u.id, u.email, u.name, u.avatar_url, u.plan, s.expires_at
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.id = ?`
    )
    .bind(sessionId)
    .first<User & { expires_at: number }>()

  if (!row) return null
  if (row.expires_at < Date.now()) {
    await db.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run()
    return null
  }
  const { expires_at: _drop, ...user } = row
  return user
}

export async function destroySession(context: APIContext) {
  const db = env(context.locals).DB
  const raw = readCookie(context.request.headers.get('cookie'), SESSION_COOKIE)
  if (db && raw) {
    try {
      const id = await unseal(raw, secret(context.locals))
      if (id) await db.prepare('DELETE FROM sessions WHERE id = ?').bind(id).run()
    } catch {
      // AUTH_SECRET hilang: cookie tetap dihapus di bawah.
    }
  }
  return clearCookie(SESSION_COOKIE, context.url)
}

export async function upsertUser(
  db: D1Database,
  profile: {
    provider: Provider
    providerId: string
    email: string
    name: string | null
    avatarUrl: string | null
  }
) {
  const existing = await db
    .prepare('SELECT id FROM users WHERE provider = ? AND provider_id = ?')
    .bind(profile.provider, profile.providerId)
    .first<{ id: string }>()

  if (existing) {
    await db
      .prepare('UPDATE users SET email = ?, name = ?, avatar_url = ? WHERE id = ?')
      .bind(profile.email, profile.name, profile.avatarUrl, existing.id)
      .run()
    return existing.id
  }

  const id = crypto.randomUUID()
  await db
    .prepare(
      `INSERT INTO users (id, email, name, avatar_url, provider, provider_id)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      profile.email,
      profile.name,
      profile.avatarUrl,
      profile.provider,
      profile.providerId
    )
    .run()
  return id
}
