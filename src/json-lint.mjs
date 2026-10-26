#!/usr/bin/env node
/* Valide tous les fichiers JSON d'un dossier : erreur de syntaxe avec ligne et colonne, et clés dupliquées
   (que JSON.parse accepte sans rien dire). Option --jsonc pour tolérer commentaires et virgules finales. */
import { readFileSync } from 'node:fs'
import { extname } from 'node:path'
import { walkFiles } from '../lib/walk.mjs'
import { isMain, parseArgs, usage, fail } from '../lib/cli.mjs'

/** Remplace commentaires et virgules finales par des espaces (les positions ne bougent pas). */
export function stripJsonc(text) {
  let out = ''
  let inString = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    const n = text[i + 1]
    if (inString) { out += c; if (c === '\\') { out += n ?? ''; i++ } else if (c === '"') inString = false; continue }
    if (c === '"') { inString = true; out += c; continue }
    if (c === '/' && n === '/') { while (i < text.length && text[i] !== '\n') { out += ' '; i++ } i--; continue }
    if (c === '/' && n === '*') { i += 2; out += '  '; while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) { out += text[i] === '\n' ? '\n' : ' '; i++ } out += '  '; i++; continue }
    out += c
  }
  return out.replace(/,(\s*[}\]])/g, (_, ws) => ` ${ws}`)
}

/** Analyse récursive minimale : renvoie { error } (ligne/colonne) ou { duplicates }. */
export function lint(text) {
  let i = 0
  const duplicates = []
  const pos = (at) => { const before = text.slice(0, at); const lines = before.split('\n'); return { line: lines.length, col: lines[lines.length - 1].length + 1 } }
  const err = (msg) => { throw Object.assign(new Error(msg), { at: i }) }
  const ws = () => { while (/\s/.test(text[i] ?? '')) i++ }
  const str = () => {
    const start = i; i++
    while (i < text.length && text[i] !== '"') { if (text[i] === '\n') err('chaîne non terminée'); if (text[i] === '\\') i++; i++ }
    if (text[i] !== '"') err('chaîne non terminée')
    i++
    return JSON.parse(text.slice(start, i))
  }
  const value = (path) => {
    ws()
    const c = text[i]
    if (c === '{') {
      i++; ws(); const seen = new Set()
      if (text[i] === '}') { i++; return }
      for (;;) {
        ws(); if (text[i] !== '"') err('clé entre guillemets attendue')
        const at = i; const key = str()
        if (seen.has(key)) duplicates.push({ path: `${path}.${key}`, ...pos(at) }); seen.add(key)
        ws(); if (text[i] !== ':') err('« : » attendu'); i++
        value(`${path}.${key}`); ws()
        if (text[i] === ',') { i++; continue }
        if (text[i] === '}') { i++; return }
        err('« , » ou « } » attendu')
      }
    } else if (c === '[') {
      i++; ws(); if (text[i] === ']') { i++; return }
      for (let n = 0; ; n++) { value(`${path}[${n}]`); ws(); if (text[i] === ',') { i++; continue } if (text[i] === ']') { i++; return } err('« , » ou « ] » attendu') }
    } else if (c === '"') str()
    else {
      const m = text.slice(i).match(/^(-?\d+(\.\d+)?([eE][+-]?\d+)?|true|false|null)/)
      if (!m) err(c === undefined ? 'fin de fichier inattendue' : `caractère inattendu « ${c} »`)
      i += m[0].length
    }
  }
  try { value('$'); ws(); if (i < text.length) err('contenu après la fin du document') } catch (e) { return { error: { message: e.message, ...pos(e.at ?? i) }, duplicates } }
  return { error: null, duplicates }
}

if (isMain(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2), ['help', 'jsonc'])
  usage(`
Usage : node src/json-lint.mjs dossier-ou-fichier [--jsonc]
Contrôle les .json (avec --jsonc : tolère commentaires et virgules finales, utile pour tsconfig.json).
Code de sortie 2 si un fichier est invalide ou contient des clés dupliquées.`, args, 1)
  let files
  try { files = args._.flatMap((p) => (extname(p) === '.json' ? [{ path: p }] : walkFiles(p, { filter: (f) => f.endsWith('.json') }))) } catch (e) { fail(e.message) }
  let bad = 0
  for (const f of files) {
    const raw = readFileSync(f.path, 'utf8')
    const r = lint(args.jsonc ? stripJsonc(raw) : raw)
    if (r.error) { bad++; console.log(`✗ ${f.path}:${r.error.line}:${r.error.col}  ${r.error.message}`) }
    for (const d of r.duplicates) { bad++; console.log(`✗ ${f.path}:${d.line}:${d.col}  clé dupliquée ${d.path}`) }
  }
  console.log(`${files.length} fichier(s) JSON, ${bad ? `${bad} problème(s).` : 'aucun problème.'}`)
  process.exit(bad ? 2 : 0)
}
