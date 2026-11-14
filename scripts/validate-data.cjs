const fs = require('node:fs')
const path = require('node:path')

const ROOT = path.resolve(__dirname, '..')
const ROSTER_DIR = path.join(ROOT, 'src', 'data', '..', 'content', 'students')
const SNAPSHOT_DIR = path.join(ROOT, 'src', 'data', 'students')
const SUMMARIES_FILE = path.join(ROOT, 'src', 'data', 'student-summaries.json')

const PLATFORM_KEYS = ['tlx', 'codeforces', 'leetcode']
const errors = []

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'))
const listJson = (dir) => {
  if (!fs.existsSync(dir)) return []
  return fs
    .readdirSync(dir)
    .filter((file) => /^\d+\.json$/.test(file))
    .sort()
}

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0
const isHandle = (value) => value === null || isNonEmptyString(value)

const rosterFiles = listJson(ROSTER_DIR)
if (!rosterFiles.length) {
  errors.push('Tidak ada roster di src/content/students. Jalankan "npm run sync:roster".')
}

const rosters = new Map()
const seenHandles = new Map()

for (const file of rosterFiles) {
  const roster = readJson(path.join(ROSTER_DIR, file))
  const expectedNim = file.replace(/\.json$/, '')

  if (!isNonEmptyString(roster.nim) || !/^\d{6,}$/.test(roster.nim)) {
    errors.push(`${file}: NIM tidak valid`)
    continue
  }
  if (roster.nim !== expectedNim) {
    errors.push(`${file}: NIM "${roster.nim}" tidak cocok dengan nama file`)
  }
  if (!isNonEmptyString(roster.nama)) errors.push(`${file}: nama kosong`)
  if (!isNonEmptyString(roster.kelasHuruf)) errors.push(`${file}: kelasHuruf kosong`)
  if (!isNonEmptyString(roster.kelas)) errors.push(`${file}: kelas kosong`)
  if (typeof roster.aktif !== 'boolean') errors.push(`${file}: aktif harus boolean`)
  if (!roster.platforms || typeof roster.platforms !== 'object') {
    errors.push(`${file}: platforms tidak ada`)
    continue
  }

  const platformKeys = Object.keys(roster.platforms).sort()
  if (platformKeys.join(',') !== [...PLATFORM_KEYS].sort().join(',')) {
    errors.push(`${file}: platform harus ${PLATFORM_KEYS.join(', ')}`)
  }

  for (const key of PLATFORM_KEYS) {
    const handle = roster.platforms[key]
    if (!isHandle(handle)) {
      errors.push(`${file}: handle ${key} harus string atau null`)
      continue
    }
    if (!handle) continue
    const normalized = `${key}:${handle.toLowerCase()}`
    if (seenHandles.has(normalized)) {
      errors.push(`${file}: handle ${key} "${handle}" juga dipakai oleh ${seenHandles.get(normalized)}`)
    } else {
      seenHandles.set(normalized, roster.nim)
    }
  }

  if (rosters.has(roster.nim)) {
    errors.push(`${file}: NIM duplikat ${roster.nim}`)
  } else {
    rosters.set(roster.nim, roster)
  }
}

const snapshotFiles = listJson(SNAPSHOT_DIR)
const snapshotNims = new Set()

for (const file of snapshotFiles) {
  const nim = file.replace(/\.json$/, '')
  const snapshot = readJson(path.join(SNAPSHOT_DIR, file))
  snapshotNims.add(nim)

  if (!rosters.has(nim)) {
    errors.push(`${file}: snapshot tidak punya roster`)
  }
  if (snapshot.meta?.studentNim && snapshot.meta.studentNim !== nim) {
    errors.push(`${file}: meta.studentNim tidak cocok`)
  }
  if (!snapshot.platforms || typeof snapshot.platforms !== 'object') {
    errors.push(`${file}: platforms tidak ada`)
    continue
  }

  const platformKeys = Object.keys(snapshot.platforms).sort()
  if (platformKeys.join(',') !== [...PLATFORM_KEYS].sort().join(',')) {
    errors.push(`${file}: platform snapshot harus ${PLATFORM_KEYS.join(', ')}`)
  }

  let solvedTotal = 0
  let submissionTotal = 0
  let activePlatforms = 0

  for (const key of PLATFORM_KEYS) {
    const platform = snapshot.platforms[key]
    if (!platform || typeof platform !== 'object') {
      errors.push(`${file}: platform ${key} tidak ada`)
      continue
    }
    const solved = Number(platform.totalSolved || 0)
    const submissions = Number(platform.totalSubmissions || 0)
    if (!Number.isFinite(solved) || solved < 0) {
      errors.push(`${file}: totalSolved ${key} tidak valid`)
    }
    if (!Number.isFinite(submissions) || submissions < 0) {
      errors.push(`${file}: totalSubmissions ${key} tidak valid`)
    }
    solvedTotal += solved
    submissionTotal += submissions
    if (platform.handle || solved > 0) activePlatforms += 1
  }

  if (Number(snapshot.overview?.totalSolved || 0) !== solvedTotal) {
    errors.push(`${file}: overview.totalSolved ${snapshot.overview?.totalSolved} != ${solvedTotal}`)
  }
  if (Number(snapshot.overview?.totalSubmissions || 0) !== submissionTotal) {
    errors.push(`${file}: overview.totalSubmissions ${snapshot.overview?.totalSubmissions} != ${submissionTotal}`)
  }
  if (Number(snapshot.overview?.activePlatforms || 0) !== activePlatforms) {
    errors.push(`${file}: overview.activePlatforms ${snapshot.overview?.activePlatforms} != ${activePlatforms}`)
  }

  for (const [day, entry] of Object.entries(snapshot.overview?.heatmap || {})) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) {
      errors.push(`${file}: tanggal heatmap tidak valid "${day}"`)
    }
    if (!entry || typeof entry !== 'object') {
      errors.push(`${file}: entry heatmap ${day} tidak valid`)
      continue
    }
    if (Number(entry.tries || 0) < 0 || Number(entry.ac || 0) < 0) {
      errors.push(`${file}: entry heatmap ${day} negatif`)
    }
  }

  for (const item of snapshot.recentGlobalFeed || []) {
    if (!isNonEmptyString(item.title)) {
      errors.push(`${file}: feed tanpa judul`)
    }
    if (item.platform && !PLATFORM_KEYS.includes(item.platform)) {
      errors.push(`${file}: platform feed tidak dikenal "${item.platform}"`)
    }
  }
}

for (const nim of rosters.keys()) {
  if (!snapshotNims.has(nim)) {
    errors.push(`${nim}: snapshot belum ada. Jalankan "npm run crawl:data".`)
  }
}

if (!fs.existsSync(SUMMARIES_FILE)) {
  errors.push('src/data/student-summaries.json belum ada.')
} else {
  const summaries = readJson(SUMMARIES_FILE)
  if (!Array.isArray(summaries.students)) {
    errors.push('student-summaries.json: students harus array')
  } else {
    if (summaries.students.length !== rosters.size) {
      errors.push(`student-summaries.json: jumlah ${summaries.students.length} != roster ${rosters.size}`)
    }

    const summaryNims = new Set()
    for (const summary of summaries.students) {
      if (!rosters.has(summary.nim)) {
        errors.push(`student-summaries.json: NIM ${summary.nim} tidak ada di roster`)
        continue
      }
      if (summaryNims.has(summary.nim)) {
        errors.push(`student-summaries.json: NIM duplikat ${summary.nim}`)
      }
      summaryNims.add(summary.nim)

      const roster = rosters.get(summary.nim)
      if (summary.nama !== roster.nama) {
        errors.push(`student-summaries.json: nama ${summary.nim} tidak cocok`)
      }
      if (summary.kelas !== roster.kelas || summary.kelasHuruf !== roster.kelasHuruf) {
        errors.push(`student-summaries.json: kelas ${summary.nim} tidak cocok`)
      }
      if (summary.aktif !== roster.aktif) {
        errors.push(`student-summaries.json: aktif ${summary.nim} tidak cocok`)
      }

      const snapshotPath = path.join(SNAPSHOT_DIR, `${summary.nim}.json`)
      if (!fs.existsSync(snapshotPath)) continue
      const snapshot = readJson(snapshotPath)

      if (Number(summary.totalSolved || 0) !== Number(snapshot.overview?.totalSolved || 0)) {
        errors.push(`student-summaries.json: totalSolved ${summary.nim} tidak cocok snapshot`)
      }
      if (Number(summary.totalSubmissions || 0) !== Number(snapshot.overview?.totalSubmissions || 0)) {
        errors.push(`student-summaries.json: totalSubmissions ${summary.nim} tidak cocok snapshot`)
      }

      for (const key of PLATFORM_KEYS) {
        const platform = snapshot.platforms?.[key] || {}
        const summaryPlatform = summary.platforms?.[key] || {}
        if (Number(summaryPlatform.solved || 0) !== Number(platform.totalSolved || 0)) {
          errors.push(`student-summaries.json: solved ${summary.nim} ${key} tidak cocok`)
        }
        if (Number(summaryPlatform.submissions || 0) !== Number(platform.totalSubmissions || 0)) {
          errors.push(`student-summaries.json: submissions ${summary.nim} ${key} tidak cocok`)
        }
      }

      const hasHandle = PLATFORM_KEYS.some((key) => Boolean(roster.platforms[key]))
      const expectedSync =
        !hasHandle ? 'unlinked'
        : Number(summary.totalSolved || 0) > 0 ? 'ok'
        : 'empty'
      if (summary.sync !== expectedSync) {
        errors.push(`student-summaries.json: sync ${summary.nim} "${summary.sync}" != "${expectedSync}"`)
      }
    }

    for (const nim of rosters.keys()) {
      if (!summaryNims.has(nim)) {
        errors.push(`student-summaries.json: NIM ${nim} tidak punya ringkasan`)
      }
    }
  }
}

if (errors.length > 0) {
  console.error('Validasi data gagal:')
  errors.forEach((error) => console.error(`- ${error}`))
  process.exit(1)
}

const summary = readJson(SUMMARIES_FILE)
const totalSolved = summary.students.reduce((sum, student) => sum + student.totalSolved, 0)
console.log(`Data OK: ${rosters.size} mahasiswa, ${totalSolved} soal selesai, ${snapshotFiles.length} snapshot.`)
