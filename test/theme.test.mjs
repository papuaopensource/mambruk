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

test('setiap preset mengisi seluruh token', () => {
  for (const [name, theme] of Object.entries(THEMES)) {
    for (const token of TOKENS) {
      assert.ok(isHexColor(theme[token]), `${name}.${token} = ${theme[token]}`)
    }
  }
})

test('isHexColor menolak yang bisa menyuntik CSS', () => {
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

test('resolveTheme jatuh ke brutal saat tema tidak dikenal', () => {
  assert.deepEqual(resolveTheme('tidakada', null), resolveTheme('noir', null))
})

test('resolveTheme memakai timpaan yang sah dan membuang yang tidak', () => {
  const colors = resolveTheme(
    'noir',
    JSON.stringify({ bg: '#123456', fg: 'red; content:"x"', muted: '#ABCDEF' })
  )
  assert.equal(colors.bg, '#123456')
  assert.equal(colors.muted, '#abcdef')
  assert.equal(colors.fg, THEMES.noir.fg, 'nilai berbahaya harus diabaikan')
})

test('resolveTheme bertahan terhadap JSON rusak', () => {
  assert.deepEqual(resolveTheme('noir', '{bukan json'), resolveTheme('noir', null))
  assert.deepEqual(resolveTheme('noir', '"bukan objek"'), resolveTheme('noir', null))
})

test('themeStyle hanya memuat token yang dikenal', () => {
  const style = themeStyle(resolveTheme('malam', null))
  for (const token of TOKENS) assert.match(style, new RegExp(`--mb-${token}: #`))
  assert.doesNotMatch(style, /[<>{}]/)
})

test('pickOverrides hanya menyimpan yang berbeda dari preset', () => {
  const base = THEMES.noir
  assert.equal(pickOverrides('noir', { ...base }), null)
  const json = pickOverrides('noir', { ...base, bg: '#000000' })
  assert.deepEqual(JSON.parse(json), { bg: '#000000' })
  assert.equal(pickOverrides('noir', { ...base, bg: 'rgb(0,0,0)' }), null)
})
