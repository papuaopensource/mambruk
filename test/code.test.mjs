import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isCode, isAlias, generateCode } from '../src/utils/code.js'

test('isCode accepts generated codes', () => {
  for (let i = 0; i < 200; i++) assert.ok(isCode(generateCode()))
  assert.ok(isCode(generateCode(8)))
})

test('isCode rejects static asset and route names', () => {
  for (const bad of [
    'favicon.ico',
    'robots.txt',
    'apple-touch-icon.png',
    'api',
    'app',
    '@papuaopensource',
    'a/b',
    '',
    'x'.repeat(33),
  ]) {
    assert.equal(isCode(bad), false, bad)
  }
})

test('generateCode has the requested length and no bias holes', () => {
  assert.equal(generateCode(6).length, 6)
  const seen = new Set()
  for (let i = 0; i < 500; i++) seen.add(generateCode())
  assert.ok(seen.size > 490, 'codes should not repeat at this volume')
})

test('isAlias menerima alias pendek pilihan manusia', () => {
  for (const ok of ['ig', 'x', 'gh', 'dev-to', 'kastau_muzik', 'a1'])
    assert.ok(isAlias(ok), ok)
})

test('isAlias menolak yang bisa merusak routing', () => {
  for (const bad of ['', 'IG', '-ig', 'ig/x', 'ig.html', '@ig', 'a'.repeat(33)])
    assert.equal(isAlias(bad), false, bad)
})
