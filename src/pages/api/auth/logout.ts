import type { APIRoute } from 'astro'
import { destroySession } from '../../../utils/auth'

export const POST: APIRoute = async (context) => {
  const cookie = await destroySession(context)
  return new Response(null, {
    status: 302,
    headers: { Location: '/', 'Set-Cookie': cookie },
  })
}

export const prerender = false
