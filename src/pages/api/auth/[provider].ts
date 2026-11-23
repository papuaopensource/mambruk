import type { APIRoute } from 'astro'
import {
  PROVIDERS,
  credentials,
  isProvider,
  setStateCookie,
} from '../../../utils/auth'

export const GET: APIRoute = async (context) => {
  const provider = context.params.provider
  if (!isProvider(provider)) return context.redirect('/', 302)

  const creds = credentials(context.locals, provider)
  if (!creds) {
    return new Response(
      `${PROVIDERS[provider].label} login is not configured on the server.`,
      { status: 503 }
    )
  }

  // Random state, kept in a signed cookie and checked on the way back.
  const state = crypto.randomUUID()
  const url = new URL(PROVIDERS[provider].authorize)
  url.searchParams.set('client_id', creds.id)
  url.searchParams.set(
    'redirect_uri',
    `${context.url.origin}/api/auth/callback/${provider}`
  )
  url.searchParams.set('scope', PROVIDERS[provider].scope)
  url.searchParams.set('state', state)
  if (provider === 'google') {
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('prompt', 'select_account')
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: url.toString(),
      'Set-Cookie': await setStateCookie(context, state),
    },
  })
}

export const prerender = false
