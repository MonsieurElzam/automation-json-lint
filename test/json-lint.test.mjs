import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, mkdtempSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const sample = (n) => readFileSync(new URL(`../samples/${n}`, import.meta.url), 'utf8')
const mod = (n) => import(`../src/${n}.mjs`)
const run = (n, args = []) => spawnSync(process.execPath, [fileURLToPath(new URL(`../src/${n}.mjs`, import.meta.url)), ...args], { encoding: 'utf8' })
const samplePath = (n) => fileURLToPath(new URL(`../samples/${n}`, import.meta.url))

test('19 JSON : erreur avec ligne/colonne, clés dupliquées, JSONC', async () => {
  const { lint, stripJsonc } = await mod('json-lint')
  assert.equal(lint('{"a":[1,2,{"b":null}]}').error, null)
  const bad = lint('{\n  "a": 1,\n  "b": ,\n}')
  assert.equal(bad.error.line, 3); assert.ok(bad.error.col >= 8)
  assert.deepEqual(lint('{"a":1,"a":2,"o":{"x":1,"x":2}}').duplicates.map((d) => d.path), ['$.a', '$.o.x'])
  assert.ok(lint(sample('bad.json')).error || lint(sample('bad.json')).duplicates.length)
  assert.ok(lint(sample('config.jsonc.json')).error)
  assert.equal(lint(stripJsonc(sample('config.jsonc.json'))).error, null)
  assert.equal(stripJsonc('{"url":"http://x//y", /* c */ "n":1,}').length, '{"url":"http://x//y", /* c */ "n":1,}'.length)
  assert.equal(lint('').error.message, 'fin de fichier inattendue')
  assert.equal(run('json-lint', [samplePath('bad.json')]).status, 2)
})
