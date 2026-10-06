import { readFile } from 'node:fs/promises'
import path from 'node:path'
import ts from 'typescript'

export async function miniatureProductionAssets(publicRoot) {
  const catalog = await readFile(path.join(publicRoot, '../src/robot-data-miniature-catalog.ts'), 'utf8')
  const { outputText } = ts.transpileModule(catalog, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } })
  const { SCENES, ROBOTS } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)
  const prefix = 'assets/robot-data-spatial/miniature/'
  const assets = new Set([`${prefix}oak.webp`, `${prefix}stills/overview.webp`, `${prefix}stills/SOURCES.md`, 'assets/robot-data-spatial/styles/textures/wood-normal.jpg'])
  for (const id of [...Object.keys(ROBOTS), 'wuji-left', 'wuji-right']) {
    for (const detail of ['overview', 'web']) {
      const file = `${prefix}${id}/${id}${id === 'h2' ? '-mannequin' : ''}-${detail}.glb`
      assets.add(file)
      const buffer = await readFile(path.join(publicRoot, file))
      if (buffer.toString('ascii', 0, 4) !== 'glTF' || buffer.readUInt32LE(16) !== 0x4e4f534a) throw new Error(`Invalid model: ${file}`)
      const json = JSON.parse(buffer.toString('utf8', 20, 20 + buffer.readUInt32LE(12)).trim())
      for (const material of json.materials ?? []) {
        if (!material.extras?.texture) continue
        const reference = material.extras.texture
        if (!reference.startsWith(`/${prefix}`) || reference.includes('..')) throw new Error(`Unapproved model texture: ${reference}`)
        assets.add(reference.slice(1))
      }
    }
    if (id !== 'luna') assets.add(`${prefix}${id}/LICENSE.txt`)
  }
  for (const scene of SCENES) for (const body of Object.keys(ROBOTS)) for (const hand of ['reference', 'wuji']) assets.add(`${prefix}stills/${scene.id}-${body}-${hand}.webp`)
  for (const font of ['archivo-black', 'bricolage-grotesque']) assets.add(`assets/fonts/miniature-graphic/${font}-LICENSE.txt`)
  assets.add('assets/fonts/miniature-graphic/SOURCES.md')
  return [...assets].sort()
}
