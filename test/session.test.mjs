import { test } from 'node:test'
import assert from 'node:assert/strict'
import { seal, unseal, readCookie } from '../src/utils/session.js'

const SECRET = 'test-secret'

test('unseal returns the value sealed with the same key', async () => {
  const token = await seal('session-123', SECRET)
  assert.equal(await unseal(token, SECRET), 'session-123')
})

test('unseal rejects forged signatures and other keys', async () => {
  const token = await seal('session-123', SECRET)
  assert.equal(await unseal(token, 'kunci-lain'), null)
  assert.equal(await unseal(token.slice(0, -1) + 'A', SECRET), null)
  assert.equal(await unseal('session-999.' + token.split('.')[1], SECRET), null)
  assert.equal(await unseal('no-dot', SECRET), null)
  assert.equal(await unseal(null, SECRET), null)
})

test('readCookie matches the exact cookie name only', async () => {
  const header = 'other=1; mambruk_session=abc.def; mambruk_session_x=zzz'
  assert.equal(readCookie(header, 'mambruk_session'), 'abc.def')
  assert.equal(readCookie('', 'mambruk_session'), null)
  assert.equal(readCookie(undefined, 'mambruk_session'), null)
})
