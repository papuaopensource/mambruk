import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  THEMES,
  TOKENS,
  isHexColor,
  resolveTheme,
  themeStyle,
  pickOverrides,
} from '../src/utils/theme.js'

test('every preset fills every token', () => {
  for (const [name, theme] of Object.entries(THEMES)) {
    for (const token of TOKENS) {
      assert.ok(isHexColor(theme[token]), `${name}.${token} = ${theme[token]}`)
    }
  }
})

test('isHexColor rejects anything that could inject CSS', () => {
  for (const bad of [
    'red',
    '#fff',
    '#ffffff;',
    '#f0f0f0; background-image:url(https://jahat.example)',
    'url(x)',
    '',
    null,
    '#gggggg',
  ]) {
    assert.equal(isHexColor(bad), false, String(bad))
  }
  assert.ok(isHexColor('#0A0A0A'.toLowerCase()))
})

test('resolveTheme falls back to the default theme', () => {
  assert.deepEqual(resolveTheme('tidakada', null), resolveTheme('noir', null))
})

test('resolveTheme keeps valid overrides and drops the rest', () => {
  const colors = resolveTheme(
    'noir',
    JSON.stringify({ bg: '#123456', fg: 'red; content:"x"', muted: '#ABCDEF' })
  )
  assert.equal(colors.bg, '#123456')
  assert.equal(colors.muted, '#abcdef')
  assert.equal(colors.fg, THEMES.noir.fg, 'unsafe value must be ignored')
})

test('resolveTheme survives broken JSON', () => {
  assert.deepEqual(
    resolveTheme('noir', '{not json'),
    resolveTheme('noir', null)
  )
  assert.deepEqual(
    resolveTheme('noir', '"not an object"'),
    resolveTheme('noir', null)
  )
})

test('themeStyle only emits known tokens', () => {
  const style = themeStyle(resolveTheme('malam', null))
  for (const token of TOKENS)
    assert.match(style, new RegExp(`--mb-${token}: #`))
  assert.doesNotMatch(style, /[<>{}]/)
})

test('pickOverrides keeps only what differs from the preset', () => {
  const base = THEMES.noir
  assert.equal(pickOverrides('noir', { ...base }), null)
  const json = pickOverrides('noir', { ...base, bg: '#000000' })
  assert.deepEqual(JSON.parse(json), { bg: '#000000' })
  assert.equal(pickOverrides('noir', { ...base, bg: 'rgb(0,0,0)' }), null)
})
