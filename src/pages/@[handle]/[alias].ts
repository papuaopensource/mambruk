import type { APIRoute } from 'astro'
import { handleRedirect } from '../../utils/redirect'

// Short links owned by one handle. Created from the dashboard, never anonymously.
export const GET: APIRoute = (context) =>
  handleRedirect(context, String(context.params.handle ?? '').toLowerCase())

export const prerender = false
