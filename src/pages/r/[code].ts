import type { APIRoute } from 'astro'
import { handleRedirect } from '../../utils/redirect'

// Legacy path from the standalone shortener. Links already handed out as
// /r/{code} keep working; new links are minted at the root.
export const GET: APIRoute = (context) => handleRedirect(context)

export const prerender = false
