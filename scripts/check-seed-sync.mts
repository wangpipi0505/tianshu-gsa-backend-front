import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const frontRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const seedDir = resolve(frontRoot, '../tianshu-gsa-backend/server/src/main/resources/seed')

const REQUIRED = [
  'Target-001',
  'Target-ME-001',
  'DS-OPTICAL-01',
  'JOB-FUSION-20260825-01',
  'SCENE-DEFAULT-01'
]

function listFiles(dir: string, ext: string[]): string[] {
  if (!existsSync(dir)) {
    return []
  }
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      return listFiles(full, ext)
    }
    return ext.some((e) => entry.name.endsWith(e)) ? [full] : []
  })
}

function blob(files: string[]): string {
  return files.map((file) => readFileSync(file, 'utf8')).join('\n')
}

const mockFiles = listFiles(join(frontRoot, 'src/mock'), ['.ts', '.json'])
const seedFiles = listFiles(seedDir, ['.json'])
if (!seedFiles.length) {
  console.error(`seed 目录不可用或没有 json：${seedDir}`)
  process.exit(1)
}
if (!mockFiles.length) {
  console.error(`mock 目录不可用：${join(frontRoot, 'src/mock')}`)
  process.exit(1)
}

const mockBlob = blob(mockFiles)
const seedBlob = blob(seedFiles)
const missingInSeed = REQUIRED.filter((id) => !seedBlob.includes(id))
const missingInMock = REQUIRED.filter((id) => !mockBlob.includes(id))

if (missingInSeed.length || missingInMock.length) {
  console.error('稳定主键缺失')
  if (missingInSeed.length) console.error('  seed 缺少:', missingInSeed.join(', '))
  if (missingInMock.length) console.error('  mock 缺少:', missingInMock.join(', '))
  process.exit(1)
}

console.log(`check-seed-sync ok  mockFiles=${mockFiles.length} seedFiles=${seedFiles.length}`)
console.log(`required: ${REQUIRED.join(', ')}`)
