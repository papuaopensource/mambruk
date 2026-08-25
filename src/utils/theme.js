// Tema halaman bio: sekumpulan token warna yang dirender jadi CSS variable.
// Modelnya meniru treelink (github.com/trevortylerlee/treelink), tapi di sana
// variabelnya ditulis sekali di global.css saat build. Di sini tema berbeda
// per halaman dan dibaca dari database, jadi tokennya dipadatkan ke tujuh yang
// benar-benar dipakai desain ini.

export const TOKENS = [
  'bg', // latar halaman
  'surface', // latar kartu
  'fg', // teks utama
  'muted', // teks sekunder
  'btn_bg', // latar tombol
  'btn_fg', // teks tombol
  'btn_border', // garis tombol sekaligus bayangannya
]

export const THEMES = {
  brutal: {
    label: 'Brutal (bawaan)',
    bg: '#f5f5f5',
    surface: '#ffffff',
    fg: '#262626',
    muted: '#737373',
    btn_bg: '#ffffff',
    btn_fg: '#525252',
    btn_border: '#262626',
  },
  malam: {
    label: 'Malam',
    bg: '#0a0a0a',
    surface: '#171717',
    fg: '#fafafa',
    muted: '#a3a3a3',
    btn_bg: '#171717',
    btn_fg: '#e5e5e5',
    btn_border: '#e5e5e5',
  },
  papua: {
    label: 'Papua',
    bg: '#f0fdf4',
    surface: '#ffffff',
    fg: '#14532d',
    muted: '#4d7c62',
    btn_bg: '#ffffff',
    btn_fg: '#14532d',
    btn_border: '#15803d',
  },
  senja: {
    label: 'Senja',
    bg: '#fff7ed',
    surface: '#ffffff',
    fg: '#7c2d12',
    muted: '#9a6a4f',
    btn_bg: '#ffffff',
    btn_fg: '#7c2d12',
    btn_border: '#c2410c',
  },
}

export const THEME_NAMES = Object.keys(THEMES)

// Hanya #rrggbb. Nilai warna ditulis apa adanya ke atribut style, jadi tanpa
// pemeriksaan ini satu nilai seperti "red;background-image:url(...)" cukup
// untuk menyuntikkan CSS ke halaman orang.
export const HEX_RE = /^#[0-9a-f]{6}$/

export function isHexColor(value) {
  return typeof value === 'string' && HEX_RE.test(value.toLowerCase())
}

// Ambil preset, lalu timpa dengan warna pilihan pemilik halaman. Nilai yang
// tidak lolos pemeriksaan dibuang diam-diam supaya halaman tetap terbaca,
// bukan gagal render.
export function resolveTheme(themeName, overridesJson) {
  const base = THEMES[themeName] ?? THEMES.brutal
  const colors = {}
  for (const token of TOKENS) colors[token] = base[token]

  let overrides = null
  if (overridesJson) {
    try {
      overrides = JSON.parse(overridesJson)
    } catch {
      overrides = null
    }
  }

  if (overrides && typeof overrides === 'object') {
    for (const token of TOKENS) {
      const value = overrides[token]
      if (isHexColor(value)) colors[token] = value.toLowerCase()
    }
  }

  return colors
}

// Dipakai sebagai atribut style pada pembungkus halaman.
export function themeStyle(colors) {
  return TOKENS.map((token) => `--mb-${token}: ${colors[token]}`).join('; ')
}

// Menyaring masukan form jadi JSON yang boleh disimpan, atau null kalau tidak
// ada yang berbeda dari presetnya.
export function pickOverrides(themeName, input) {
  const base = THEMES[themeName] ?? THEMES.brutal
  const kept = {}
  for (const token of TOKENS) {
    const value = String(input[token] ?? '').toLowerCase()
    if (isHexColor(value) && value !== base[token]) kept[token] = value
  }
  return Object.keys(kept).length ? JSON.stringify(kept) : null
}
