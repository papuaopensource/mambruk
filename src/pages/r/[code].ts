import type { APIRoute } from 'astro'
import { handleRedirect } from '../../utils/redirect'

// Legacy path from the standalone shortener. New links are minted at the root.
export const GET: APIRoute = (context) => handleRedirect(context)

export const prerender = false
