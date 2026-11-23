// Public address of Mambruk, from `site` in astro.config.mjs. OAuth keeps the
// request origin instead, since the provider checks the real callback URL.
export const SITE = new URL(import.meta.env.SITE)
export const HOST = SITE.host
