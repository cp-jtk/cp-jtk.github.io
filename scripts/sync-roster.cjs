#!/usr/bin/env node
// Sinkronisasi roster mahasiswa dari Google Sheets (CSV publik).
//
// Sumber: STUDENT_SHEET_CSV_URL
// Header diasumsikan berada di baris ke-2 dan data mulai baris ke-3, dengan
// urutan kolom: NIM, NAMA, Kelas (huruf), [auto] Kelas, TLX, Leetcode, Codeforces.
//
// Output: satu file JSON per mahasiswa di src/content/students/<nim>.json.
// Script ini tidak melakukan crawl platform; jalankan `npm run crawl:data`
// setelah roster berhasil disinkronkan.

const fs = require('node:fs')
const path = require('node:path')
const { loadEnv } = require('./lib/env.cjs')
const { parseCsv } = require('./lib/csv.cjs')

loadEnv()

const ROOT = path.resolve(__dirname, '..')
const ROSTER_DIR = path.join(ROOT, 'src', 'content', 'students')

const PLATFORM_KEYS = ['tlx', 'leetcode', 'codeforces']

const normalizeText = (value) =>
  String(value ?? '')
    .replace(/\u00a0/g, ' ')
    .trim()

const normalizeHeader = (value) =>
  normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

const normalizeNim = (value) => normalizeText(value).replace(/\s+/g, '')

const normalizeHandle = (value, platform) => {
  let raw = normalizeText(value)
  if (!raw || raw === '-' || raw === '—' || raw.toLowerCase() === 'n/a') return null

  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw)
      const parts = url.pathname.split('/').filter(Boolean)
      if (platform === 'tlx') {
        const index = parts.indexOf('profiles')
        if (index >= 0 && parts[index + 1]) return parts[index + 1]
      }
      if (platform === 'codeforces') {
        const index = parts.indexOf('profile')
        if (index >= 0 && parts[index + 1]) return parts[index + 1]
      }
      if (platform === 'leetcode') {
        const index = parts.indexOf('u')
        if (index >= 0 && parts[index + 1]) return parts[index + 1]
      }
      const last = parts.at(-1)
      if (last) return last.replace(/^@/, '')
    } catch {
      // fall through to plain handle
    }
  }

  return raw.replace(/^@/, '')
}

const findHeaderIndex = (headers, predicate, fallback) => {
  const index = headers.findIndex((header) => predicate(normalizeHeader(header)))
  return index >= 0 ? index : fallback
}

const buildColumnMap = (headers) => ({
  nim: findHeaderIndex(headers, (header) => header === 'nim', 0),
  nama: findHeaderIndex(headers, (header) => header === 'nama' || header === 'name' || header === 'nama lengkap', 1),
  kelasHuruf: findHeaderIndex(headers, (header) => header === 'kelas' || header === 'class', 2),
  kelas: findHeaderIndex(headers, (header) => header.includes('auto'), 3),
  tlx: findHeaderIndex(headers, (header) => header.includes('tlx'), 4),
  leetcode: findHeaderIndex(headers, (header) => header.includes('leetcode'), 5),
  codeforces: findHeaderIndex(headers, (header) => header.includes('codeforces'), 6),
})

const cell = (row, index) => (index >= 0 ? normalizeText(row[index]) : '')

const toJson = (value) => `${JSON.stringify(value, null, 2)}\n`

async function fetchCsv(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'CP JTK Dashboard roster sync',
      Accept: 'text/csv,text/plain,*/*',
    },
    signal: AbortSignal.timeout(60_000),
  })
  if (!res.ok) {
    throw new Error(`Gagal mengambil spreadsheet: HTTP ${res.status} ${res.statusText}`)
  }
  return res.text()
}

async function main() {
  const csvUrl = process.env.STUDENT_SHEET_CSV_URL
  if (!csvUrl) {
    throw new Error('STUDENT_SHEET_CSV_URL belum diatur. Tambahkan URL CSV spreadsheet ke .env atau environment.')
  }

  console.log('Mengambil roster dari spreadsheet...')
  const csv = await fetchCsv(csvUrl)
  const rows = parseCsv(csv)

  if (!rows.length) {
    throw new Error('Spreadsheet kosong atau tidak bisa diparse.')
  }

  const headerRowIndex = rows.findIndex((row) => normalizeHeader(row[0]) === 'nim')
  const effectiveHeaderIndex = headerRowIndex >= 0 ? headerRowIndex : 1
  const headers = rows[effectiveHeaderIndex] || []
  const columns = buildColumnMap(headers)

  const students = []
  const errors = []
  const warnings = []
  const seenNim = new Set()
  const seenHandles = new Map()

  for (let rowIndex = effectiveHeaderIndex + 1; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex]
    if (!row || row.every((value) => normalizeText(value) === '')) continue

    const nim = normalizeNim(cell(row, columns.nim))
    const nama = cell(row, columns.nama)
    const kelasHuruf = cell(row, columns.kelasHuruf)
    const kelas = cell(row, columns.kelas)

    if (!nim && !nama) continue

    if (!/^\d{6,}$/.test(nim)) {
      errors.push(`Baris ${rowIndex + 1}: NIM tidak valid "${nim || '(kosong)'}"`)
      continue
    }
    if (!nama) {
      errors.push(`Baris ${rowIndex + 1}: nama kosong untuk NIM ${nim}`)
      continue
    }
    if (!kelasHuruf || !kelas) {
      errors.push(`Baris ${rowIndex + 1}: kelas kosong untuk NIM ${nim}`)
      continue
    }
    if (seenNim.has(nim)) {
      errors.push(`Baris ${rowIndex + 1}: NIM duplikat ${nim}`)
      continue
    }
    seenNim.add(nim)

    const platforms = {
      tlx: normalizeHandle(cell(row, columns.tlx), 'tlx'),
      leetcode: normalizeHandle(cell(row, columns.leetcode), 'leetcode'),
      codeforces: normalizeHandle(cell(row, columns.codeforces), 'codeforces'),
    }

    for (const key of PLATFORM_KEYS) {
      const handle = platforms[key]
      if (!handle) continue
      const keyLower = `${key}:${handle.toLowerCase()}`
      if (seenHandles.has(keyLower)) {
        warnings.push(`Handle ${key} "${handle}" dipakai oleh NIM ${seenHandles.get(keyLower)} dan ${nim}`)
      } else {
        seenHandles.set(keyLower, nim)
      }
    }

    students.push({
      nim,
      nama,
      kelasHuruf,
      kelas,
      aktif: true,
      platforms,
    })
  }

  if (errors.length) {
    console.error('Roster tidak valid:')
    errors.forEach((error) => console.error(`- ${error}`))
    process.exit(1)
  }

  if (!students.length) {
    throw new Error('Tidak ada baris mahasiswa yang valid di spreadsheet.')
  }

  warnings.forEach((warning) => console.warn(`Peringatan: ${warning}`))

  fs.mkdirSync(ROSTER_DIR, { recursive: true })

  const keep = new Set()
  let written = 0
  for (const student of students) {
    const fileName = `${student.nim}.json`
    const filePath = path.join(ROSTER_DIR, fileName)
    const next = toJson(student)
    keep.add(fileName)

    const previous = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : null
    if (previous === next) continue
    fs.writeFileSync(filePath, next)
    written++
  }

  let removed = 0
  for (const fileName of fs.readdirSync(ROSTER_DIR)) {
    if (!/^\d+\.json$/.test(fileName) || keep.has(fileName)) continue
    fs.unlinkSync(path.join(ROSTER_DIR, fileName))
    removed++
  }

  console.log(`Roster OK: ${students.length} mahasiswa (${written} diperbarui, ${removed} dihapus).`)
  console.log(`Folder: ${path.relative(ROOT, ROSTER_DIR)}`)
}

main().catch((error) => {
  console.error(error.message || error)
  process.exit(1)
})
