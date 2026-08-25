import type { APIRoute } from 'astro'
import {
  PROVIDERS,
  createSession,
  credentials,
  isProvider,
  readStateCookie,
  upsertUser,
  type Provider,
} from '../../../../utils/auth'

type Profile = {
  providerId: string
  email: string
  name: string | null
  avatarUrl: string | null
}

async function fetchProfile(
  provider: Provider,
  token: string
): Promise<Profile | null> {
  if (provider === 'github') {
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'mambruk',
    }
    const user = await fetch('https://api.github.com/user', { headers }).then(
      (r) => (r.ok ? r.json<any>() : null)
    )
    if (!user) return null

    // Email bisa disembunyikan di profil publik; ambil yang primary+verified.
    let email: string | null = user.email ?? null
    if (!email) {
      const emails = await fetch('https://api.github.com/user/emails', {
        headers,
      }).then((r) => (r.ok ? r.json<any[]>() : []))
      email =
        emails.find((e) => e.primary && e.verified)?.email ??
        emails.find((e) => e.verified)?.email ??
        null
    }
    if (!email) return null

    return {
      providerId: String(user.id),
      email,
      name: user.name ?? user.login ?? null,
      avatarUrl: user.avatar_url ?? null,
    }
  }

  const info = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => (r.ok ? r.json<any>() : null))

  // email_verified false berarti Google sendiri belum yakin email itu milik
  // orang yang login — jangan dipakai sebagai identitas.
  if (!info?.sub || !info.email || info.email_verified === false) return null

  return {
    providerId: String(info.sub),
    email: info.email,
    name: info.name ?? null,
    avatarUrl: info.picture ?? null,
  }
}

export const GET: APIRoute = async (context) => {
  const provider = context.params.provider
  if (!isProvider(provider)) return context.redirect('/', 302)

  const creds = credentials(context.locals, provider)
  const db = context.locals.runtime?.env?.DB
  if (!creds || !db) return context.redirect('/?error=auth_unavailable', 302)

  const code = context.url.searchParams.get('code')
  const state = context.url.searchParams.get('state')
  const expected = await readStateCookie(context)
  if (!code || !state || !expected || state !== expected) {
    return context.redirect('/?error=state_mismatch', 302)
  }

  // application/x-www-form-urlencoded, bukan JSON: Google menolak badan JSON
  // di endpoint token, dan GitHub menerima keduanya. Satu bentuk untuk dua
  // provider lebih sedikit yang bisa salah.
  const tokenResponse = await fetch(PROVIDERS[provider].token, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
      'User-Agent': 'mambruk',
    },
    body: new URLSearchParams({
      client_id: creds.id,
      client_secret: creds.secret,
      code,
      redirect_uri: `${context.url.origin}/api/auth/callback/${provider}`,
      grant_type: 'authorization_code',
    }),
  })

  const payload = await tokenResponse.json<any>().catch(() => null)
  const accessToken = payload?.access_token
  if (!accessToken) {
    // Tanpa baris ini kegagalannya cuma tampak sebagai ?error=token_exchange
    // di URL, dan penyebab sebenarnya — kredensial salah, kode kedaluwarsa,
    // redirect_uri beda — tidak terlihat di mana pun.
    console.error(
      `Token exchange ${provider} gagal: status=${tokenResponse.status}`,
      `error=${payload?.error}`,
      `description=${payload?.error_description}`
    )
    return context.redirect('/?error=token_exchange', 302)
  }

  const profile = await fetchProfile(provider, accessToken)
  if (!profile) return context.redirect('/?error=no_verified_email', 302)

  const userId = await upsertUser(db, { provider, ...profile })
  const sessionCookie = await createSession(context, userId)

  return new Response(null, {
    status: 302,
    headers: { Location: '/app', 'Set-Cookie': sessionCookie },
  })
}

export const prerender = false
