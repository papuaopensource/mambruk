import { test } from 'node:test'
import assert from 'node:assert/strict'
import { seal, unseal, readCookie } from '../src/utils/session.js'

const SECRET = 'rahasia-uji'

test('unseal mengembalikan nilai yang disegel dengan kunci sama', async () => {
  const token = await seal('sesi-123', SECRET)
  assert.equal(await unseal(token, SECRET), 'sesi-123')
})

test('unseal menolak tanda tangan palsu atau kunci lain', async () => {
  const token = await seal('sesi-123', SECRET)
  assert.equal(await unseal(token, 'kunci-lain'), null)
  assert.equal(await unseal(token.slice(0, -1) + 'A', SECRET), null)
  assert.equal(await unseal('sesi-999.' + token.split('.')[1], SECRET), null)
  assert.equal(await unseal('tanpa-titik', SECRET), null)
  assert.equal(await unseal(null, SECRET), null)
})

test('readCookie hanya mengambil cookie yang namanya persis', async () => {
  const header = 'other=1; mambruk_session=abc.def; mambruk_session_x=zzz'
  assert.equal(readCookie(header, 'mambruk_session'), 'abc.def')
  assert.equal(readCookie('', 'mambruk_session'), null)
  assert.equal(readCookie(undefined, 'mambruk_session'), null)
})
