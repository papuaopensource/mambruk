import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  isCode,
  isAlias,
  isCustomCode,
  isHandle,
  generateCode,
} from '../src/utils/code.js'

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

test('generateCode spreads evenly over the alphabet', () => {
  const counts = new Map()
  for (let i = 0; i < 20000; i++)
    for (const c of generateCode(8)) counts.set(c, (counts.get(c) ?? 0) + 1)
  assert.equal(counts.size, 62)
  const mean = (20000 * 8) / 62
  for (const [c, n] of counts)
    assert.ok(Math.abs(n - mean) < mean * 0.12, `${c} drawn ${n} times`)
})

test('isAlias accepts short human-picked aliases', () => {
  for (const ok of ['ig', 'x', 'gh', 'dev-to', 'kastau_muzik', 'a1'])
    assert.ok(isAlias(ok), ok)
})

test('isAlias rejects anything that would break routing', () => {
  for (const bad of ['', 'IG', '-ig', 'ig/x', 'ig.html', '@ig', 'a'.repeat(33)])
    assert.equal(isAlias(bad), false, bad)
})

test('isHandle accepts valid handles and rejects reserved ones', () => {
  for (const ok of ['daniel', 'papuaopensource', 'jerat-papua', 'a1'])
    assert.ok(isHandle(ok), ok)
  for (const bad of [
    '',
    'a',
    'API',
    'app',
    'admin',
    'contact',
    'a/b',
    '-x',
    'x'.repeat(31),
  ])
    assert.equal(isHandle(bad), false, bad)
})

test('isCustomCode takes picked codes and refuses reserved routes', () => {
  for (const ok of ['papua-dev', 'Workshop_2026', 'abcd'])
    assert.ok(isCustomCode(ok), ok)
  for (const bad of [
    'abc',
    'about',
    'About',
    'LOGIN',
    'dashboard',
    'palette',
    'a.b.c',
    'x'.repeat(33),
  ])
    assert.equal(isCustomCode(bad), false, bad)
})
