import type { APIRoute } from 'astro'
import { handleRedirect } from '../utils/redirect'

export const GET: APIRoute = (context) => handleRedirect(context)

export const prerender = false
