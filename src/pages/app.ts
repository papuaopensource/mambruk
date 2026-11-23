import type { APIRoute } from 'astro'

// The dashboard moved to /dashboard. Kept so old links and bookmarks work.
export const GET: APIRoute = ({ redirect }) => redirect('/dashboard', 301)

export const prerender = false
