import type { APIRoute } from 'astro'
import { handleRedirect } from '../../utils/redirect'

// /@{handle}/{alias} — tautan pendek milik satu handle.
// Belum ada endpoint pembuatannya: baris-barisnya diisi lewat seed/D1 sampai
// auth mendarat, supaya tidak ada yang bisa membuat alias di bawah handle
// orang lain.
export const GET: APIRoute = (context) =>
  handleRedirect(context, String(context.params.handle ?? '').toLowerCase())

export const prerender = false
