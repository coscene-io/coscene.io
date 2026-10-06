import { cp, mkdir, readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { miniatureProductionAssets } from './miniature-production-assets.mjs'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const publicRoot = path.join(projectRoot, 'public')
const distRoot = path.join(projectRoot, 'dist')
const assetPattern = /\/(?:assets\/[A-Za-z0-9@._+/-]+|favicon\.svg)/g
const qualityTracePrefix = '/assets/quality-trace/'
const qualityTraceProductionAssets = [
  'assets/quality-trace/content.json',
  'assets/quality-trace/grasp-head-45.png',
  'assets/quality-trace/ribbon/astribot-s1-front.webp',
  'assets/quality-trace/ribbon/grasp-evidence.webp',
  'assets/quality-trace/ribbon/place-evidence.webp',
  'assets/quality-trace/ribbon/right-wrist-45.webp',
  'assets/quality-trace/ribbon/kitchen-scene.webp',
  'assets/quality-trace/task-grasp-motion.mp4',
]

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await walk(entryPath))
    else files.push(entryPath)
  }

  return files
}

async function copyEntry(source, destination) {
  const sourceStats = await stat(source)
  await mkdir(path.dirname(destination), { recursive: true })
  await cp(source, destination, { recursive: sourceStats.isDirectory() })
}

async function copyReference(reference) {
  const relativePath = reference.slice(1)
  const source = path.join(publicRoot, relativePath)
  const destination = path.join(distRoot, relativePath)

  try {
    await stat(destination)
    return []
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
  }

  try {
    await copyEntry(source, destination)
    return [relativePath]
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
  }

  const sourceDirectory = path.dirname(source)
  const destinationDirectory = path.dirname(destination)
  const prefix = path.basename(source)
  const matches = (await readdir(sourceDirectory, { withFileTypes: true }))
    .filter((entry) => entry.name.startsWith(prefix))

  if (!matches.length) {
    throw new Error(`Missing production asset referenced by the bundle: ${reference}`)
  }

  const copied = []
  for (const match of matches) {
    await copyEntry(
      path.join(sourceDirectory, match.name),
      path.join(destinationDirectory, match.name),
    )
    copied.push(path.join(path.dirname(relativePath), match.name))
  }
  return copied
}

const bundleFiles = (await walk(distRoot)).filter((file) => /\.(?:css|html|js)$/.test(file))
const references = new Set()

for (const file of bundleFiles) {
  const contents = await readFile(file, 'utf8')
  for (const match of contents.matchAll(assetPattern)) references.add(match[0])
}

const copied = new Set()
if ([...references].some(reference => reference.startsWith('/assets/ego-data-study/'))) {
  await copyEntry(path.join(publicRoot, 'assets/ego-data-study'), path.join(distRoot, 'assets/ego-data-study'))
  for (const file of await walk(path.join(publicRoot, 'assets/ego-data-study'))) {
    copied.add(path.relative(publicRoot, file))
  }
}
if ([...references].some(reference => reference.startsWith('/assets/robot-data-spatial/miniature/'))) {
  for (const relative of await miniatureProductionAssets(publicRoot)) {
    await copyEntry(path.join(publicRoot, relative), path.join(distRoot, relative))
    copied.add(relative)
  }
}
const qualityTraceReferences = [...references].filter(reference => reference.startsWith(qualityTracePrefix))
if (qualityTraceReferences.length) {
  // Canvas artwork loads filenames dynamically. Ship its explicit runtime set,
  // rather than the prefix directory's historical media and source manifests.
  const allowed = new Set(qualityTraceProductionAssets.map(relative => `/${relative}`))
  for (const reference of qualityTraceReferences) {
    if (reference !== qualityTracePrefix && !allowed.has(reference)) {
      throw new Error(`Quality delivery asset is not in the production list: ${reference}`)
    }
  }
  for (const relative of qualityTraceProductionAssets) {
    await copyEntry(path.join(publicRoot, relative), path.join(distRoot, relative))
    copied.add(relative)
  }
}
for (const reference of [...references].sort()) {
  // Dynamic model paths are expanded from the catalog, never by copying raw source folders.
  if (reference.startsWith('/assets/robot-data-spatial/miniature/')) continue
  if (reference.startsWith(qualityTracePrefix)) continue
  for (const file of await copyReference(reference)) copied.add(file)
}

console.log(`Copied ${copied.size} production asset paths into dist.`)
