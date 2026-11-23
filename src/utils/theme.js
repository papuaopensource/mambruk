// Bio page themes, colour tokens rendered as CSS variables. Token model from
// treelink (github.com/trevortylerlee/treelink), trimmed to what this design uses.

export const TOKENS = [
  'bg', // Background
  'surface', // Card
  'fg', // Primary text
  'muted', // Secondary text
  'btn_bg', // Button background
  'btn_fg', // Button text
  'btn_border', // Button border and shadow
]

/** @type {Record<string, Record<string, string>>} */
export const THEMES = {
  noir: {
    label: 'Noir',
    bg: '#f5f5f5',
    surface: '#ffffff',
    fg: '#171717',
    muted: '#737373',
    btn_bg: '#ffffff',
    btn_fg: '#262626',
    btn_border: '#171717',
  },
  air: {
    label: 'Air',
    bg: '#ffffff',
    surface: '#ffffff',
    fg: '#18181b',
    muted: '#a1a1aa',
    btn_bg: '#f4f4f5',
    btn_fg: '#18181b',
    btn_border: '#e4e4e7',
  },
  mineral: {
    label: 'Mineral',
    bg: '#efe9e1',
    surface: '#f8f5f1',
    fg: '#3f3a34',
    muted: '#8a8078',
    btn_bg: '#ffffff',
    btn_fg: '#3f3a34',
    btn_border: '#d6cec3',
  },
  sage: {
    label: 'Sage',
    bg: '#e8ede8',
    surface: '#f6f9f6',
    fg: '#24382c',
    muted: '#6b8274',
    btn_bg: '#ffffff',
    btn_fg: '#24382c',
    btn_border: '#a8c0b0',
  },
  bloom: {
    label: 'Bloom',
    bg: '#fdf2f8',
    surface: '#ffffff',
    fg: '#831843',
    muted: '#be6b93',
    btn_bg: '#ffffff',
    btn_fg: '#831843',
    btn_border: '#f9a8d4',
  },
  rise: {
    label: 'Rise',
    bg: '#fff7ed',
    surface: '#ffffff',
    fg: '#7c2d12',
    muted: '#b06a45',
    btn_bg: '#ffffff',
    btn_fg: '#7c2d12',
    btn_border: '#fdba74',
  },
  lake: {
    label: 'Lake',
    bg: '#0f172a',
    surface: '#1e293b',
    fg: '#f1f5f9',
    muted: '#94a3b8',
    btn_bg: '#1e293b',
    btn_fg: '#e2e8f0',
    btn_border: '#475569',
  },
  twilight: {
    label: 'Twilight',
    bg: '#1a1425',
    surface: '#251d33',
    fg: '#f3e8ff',
    muted: '#a99bc1',
    btn_bg: '#2d2340',
    btn_fg: '#f3e8ff',
    btn_border: '#6d5b8f',
  },
  mono: {
    label: 'Mono',
    bg: '#000000',
    surface: '#0a0a0a',
    fg: '#ffffff',
    muted: '#a3a3a3',
    btn_bg: '#000000',
    btn_fg: '#ffffff',
    btn_border: '#ffffff',
  },
}

export const THEME_NAMES = Object.keys(THEMES)

// #rrggbb, because values go into a style attribute unescaped.
export const HEX_RE = /^#[0-9a-f]{6}$/

export function isHexColor(value) {
  return typeof value === 'string' && HEX_RE.test(value.toLowerCase())
}

// resolveTheme merges the owner's valid overrides onto the preset.
export function resolveTheme(themeName, overridesJson) {
  const base = THEMES[themeName] ?? THEMES.noir
  /** @type {Record<string, string>} */
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

// themeStyle renders colors as CSS variables for the page wrapper.
export function themeStyle(colors) {
  return TOKENS.map((token) => `--mb-${token}: ${colors[token]}`).join('; ')
}

// pickOverrides turns form input into JSON, or null when it matches the preset.
export function pickOverrides(themeName, input) {
  const base = THEMES[themeName] ?? THEMES.noir
  const kept = {}
  for (const token of TOKENS) {
    const value = String(input[token] ?? '').toLowerCase()
    if (isHexColor(value) && value !== base[token]) kept[token] = value
  }
  return Object.keys(kept).length ? JSON.stringify(kept) : null
}
