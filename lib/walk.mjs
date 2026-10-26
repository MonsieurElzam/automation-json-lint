import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

export const DEFAULT_SKIP = new Set(['node_modules', '.git', '.next', 'dist', 'build', 'coverage', '.cache'])

/** Liste récursive des fichiers d'un dossier (liens symboliques et dossiers de dépendances ignorés). */
export function walkFiles(dir, { skip = DEFAULT_SKIP, filter = () => true } = {}, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isSymbolicLink() || skip.has(entry.name)) continue
    const full = join(dir, entry.name)
    if (entry.isDirectory()) walkFiles(full, { skip, filter }, out)
    else if (entry.isFile() && filter(full)) out.push({ path: full, size: statSync(full).size })
  }
  return out
}
