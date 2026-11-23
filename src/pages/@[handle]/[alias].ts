import type { APIRoute } from 'astro'
import { handleRedirect } from '../../utils/redirect'

// Short links owned by one handle, created from the dashboard.
export const GET: APIRoute = (context) =>
  handleRedirect(context, String(context.params.handle ?? '').toLowerCase())

export const prerender = false
