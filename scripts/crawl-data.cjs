#!/usr/bin/env node
// Crawler competitive programming per mahasiswa.
//
// Membaca roster dari src/content/students/<nim>.json, mengambil data dari TLX,
// Codeforces, dan LeetCode, lalu menulis:
//   src/data/students/<nim>.json       snapshot lengkap per mahasiswa
//   src/data/student-summaries.json    index ringkas untuk landing cohort
//
// Standalone dengan Node 18+ (global fetch), tanpa dependency. Snapshot lama
// dipertahankan ketika API gagal atau data baru terlihat menurun.

const fs = require('node:fs')
const path = require('node:path')
const { loadEnv } = require('./lib/env.cjs')

loadEnv()

const ROOT = path.resolve(__dirname, '..')
const ROSTER_DIR = path.join(ROOT, 'src', 'content', 'students')
const SNAPSHOT_DIR = path.join(ROOT, 'src', 'data', 'students')
const SUMMARIES_FILE = path.join(ROOT, 'src', 'data', 'student-summaries.json')

const PLATFORM_KEYS = ['tlx', 'codeforces', 'leetcode']
const VERSION = '1'
const USER_AGENT = 'Mozilla/5.0 (CP JTK Dashboard)'
const REQUEST_TIMEOUT_MS = 45_000
const MAX_TLX_PAGES = 20

const crawlWarnings = []

function recordWarning({ nim, nama, platform, handle, error }) {
  const message = String(error?.message || error || 'Gagal mengambil data')
  crawlWarnings.push({ nim, nama, platform, handle, error: message })
  console.warn(`[WARN] ${nim} (${nama}) - ${platform} (${handle}): ${message}`)
  if (process.env.GITHUB_ACTIONS) {
    console.log(`::warning title=${platform.toUpperCase()} Issue (${nim})::Mahasiswa ${nama} (${nim}) - ${platform} handle '${handle}': ${message}`)
  }
}

const nowIso = () => new Date().toISOString()

const fetchWithTimeout = (url, init = {}, ms = REQUEST_TIMEOUT_MS) => globalThis.fetch(url, { ...init, signal: AbortSignal.timeout(ms) })

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return null
  }
}

function readJsonDir(dir) {
  const map = new Map()
  try {
    for (const file of fs.readdirSync(dir)) {
      if (!/^\d+\.json$/.test(file)) continue
      const data = readJson(path.join(dir, file))
      if (data) map.set(file.replace(/\.json$/, ''), data)
    }
  } catch {
    // ignore missing directory
  }
  return map
}

async function formatJson(file, payload) {
  const raw = `${JSON.stringify(payload, null, 2)}\n`
  try {
    const prettier = await import('prettier')
    const config = (await prettier.resolveConfig(file)) || {}
    return await prettier.format(raw, { ...config, filepath: file })
  } catch {
    return raw
  }
}

async function writeJson(file, payload) {
  const next = await formatJson(file, payload)
  const previous = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null
  if (previous === next) {
    console.log(`  unchanged: ${path.relative(ROOT, file)}`)
    return false
  }
  fs.writeFileSync(file, next)
  console.log(`  updated:   ${path.relative(ROOT, file)}`)
  return true
}

async function mapLimit(items, limit, mapper) {
  const results = new Array(items.length)
  let nextIndex = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const index = nextIndex++
      if (index >= items.length) return
      results[index] = await mapper(items[index], index)
    }
  })
  await Promise.all(workers)
  return results
}

function normalizeLanguage(raw) {
  const value = String(raw || '').trim()
  if (!value) return ''
  const lower = value.toLowerCase()

  if (lower.includes('c++') || lower.includes('cpp') || lower === 'cpp') {
    if (lower.includes('23')) return 'C++23'
    if (lower.includes('20')) return 'C++20'
    if (lower.includes('17')) return 'C++17'
    if (lower.includes('14')) return 'C++14'
    if (lower.includes('11')) return 'C++11'
    return 'C++'
  }
  if (lower.includes('rust')) return 'Rust'
  if (lower.includes('python')) return 'Python'
  if (lower.includes('javascript')) return 'JavaScript'
  if (lower.includes('typescript')) return 'TypeScript'
  if (lower.includes('java')) return 'Java'
  if (lower.includes('kotlin')) return 'Kotlin'
  if (lower.includes('pascal')) return 'Pascal'
  if (lower.includes('postgres')) return 'PostgreSQL'
  if (lower.includes('mysql')) return 'MySQL'
  if (lower.includes('sql')) return 'SQL'
  if (lower.includes('go') && !lower.includes('mongodb')) return 'Go'
  if (lower === 'c') return 'C'
  return value
}

function emptyPlatform(key, handle = '') {
  const base = {
    handle: handle || '',
    url: '',
    totalSolved: 0,
    totalSubmissions: 0,
    recentSolved: [],
    dailyCalendar: {},
  }

  if (key === 'tlx') {
    return { ...base, totalAcSubmissions: 0, uniqueProblemsSolved: 0, languages: {} }
  }

  if (key === 'codeforces') {
    return {
      ...base,
      rating: 0,
      maxRating: 0,
      rank: 'unrated',
      maxRank: 'unrated',
      contestsCount: 0,
      tagsCount: {},
      ratingDistribution: {},
      languages: {},
    }
  }

  return {
    ...base,
    ranking: 0,
    easySolved: 0,
    mediumSolved: 0,
    hardSolved: 0,
  }
}

function emptySnapshot(nim) {
  return {
    meta: { updatedAt: '', version: VERSION, studentNim: nim },
    overview: {
      totalSolved: 0,
      totalSubmissions: 0,
      activePlatforms: 0,
      heatmap: {},
      topLanguage: { name: '-', count: 0 },
    },
    platforms: {
      tlx: emptyPlatform('tlx'),
      codeforces: emptyPlatform('codeforces'),
      leetcode: emptyPlatform('leetcode'),
    },
    recentGlobalFeed: [],
  }
}

function mergeRecentSolved(freshList = [], previousList = []) {
  const map = new Map()

  for (const item of previousList || []) {
    const key = item.id || item.url || `${item.platform}:${item.title}:${item.solvedAt}`
    map.set(key, item)
  }

  for (const item of freshList || []) {
    const key = item.id || item.url || `${item.platform}:${item.title}:${item.solvedAt}`
    map.set(key, { ...(map.get(key) || {}), ...item })
  }

  return Array.from(map.values())
    .filter((item) => item.solvedAt)
    .sort((a, b) => new Date(b.solvedAt).getTime() - new Date(a.solvedAt).getTime())
}

function mergeDailyCalendar(freshCalendar = {}, previousCalendar = {}) {
  const merged = { ...(previousCalendar || {}) }
  for (const [day, freshEntry] of Object.entries(freshCalendar || {})) {
    if (!merged[day]) {
      merged[day] = { ...freshEntry }
    } else {
      merged[day] = {
        tries: Math.max(Number(merged[day].tries || 0), Number(freshEntry.tries || 0)),
        ac: Math.max(Number(merged[day].ac || 0), Number(freshEntry.ac || 0)),
      }
    }
  }
  return merged
}

function mergePlatform(fresh, previous, key, handle) {
  if (!fresh) return previous || emptyPlatform(key, handle)
  if (!previous) return fresh

  const freshRecent = fresh.recentSolved?.length || 0
  const previousRecent = previous.recentSolved?.length || 0
  const freshSolved = Number(fresh.totalSolved || 0)
  const previousSolved = Number(previous.totalSolved || 0)

  // Keep the older snapshot when the fresh crawl looks degraded.
  if ((freshRecent === 0 && previousRecent > 0) || (freshSolved > 0 && freshSolved < previousSolved)) {
    return {
      ...previous,
      handle: fresh.handle || previous.handle || handle,
      url: fresh.url || previous.url,
    }
  }

  const merged = { ...previous, ...fresh, handle: fresh.handle || previous.handle || handle }

  // Appending kumulatif untuk riwayat soal & kalender aktivitas
  merged.recentSolved = mergeRecentSolved(fresh.recentSolved, previous.recentSolved)
  merged.dailyCalendar = mergeDailyCalendar(fresh.dailyCalendar, previous.dailyCalendar)

  if (!Object.keys(fresh.languages || {}).length) merged.languages = previous.languages
  if (!Object.keys(fresh.tagsCount || {}).length) merged.tagsCount = previous.tagsCount
  if (!Object.keys(fresh.ratingDistribution || {}).length) {
    merged.ratingDistribution = previous.ratingDistribution
  }

  merged.totalSolved = Math.max(freshSolved, previousSolved)
  merged.totalSubmissions = Math.max(Number(fresh.totalSubmissions || 0), Number(previous.totalSubmissions || 0))
  if (key === 'tlx') {
    merged.totalAcSubmissions = Math.max(Number(fresh.totalAcSubmissions || 0), Number(previous.totalAcSubmissions || 0))
  }

  return merged
}

// ---------------------------------------------------------------------------
// TLX
// ---------------------------------------------------------------------------
async function cpTlx(username, previous = {}) {
  const allSubmissions = []
  let beforeId = null
  let pageCount = 0
  let requestSucceeded = false

  while (pageCount < MAX_TLX_PAGES) {
    pageCount++
    const url = `https://api.tlx.toki.id/v2/submissions/programming?username=${encodeURIComponent(username)}${
      beforeId ? `&beforeId=${beforeId}` : ''
    }`

    try {
      const res = await fetchWithTimeout(url, { headers: { 'User-Agent': USER_AGENT } }, 30_000)
      if (!res.ok) break
      requestSucceeded = true
      const json = await res.json()
      const page = json?.data?.page || []
      if (!page.length) break

      for (const item of page) {
        allSubmissions.push({
          id: item.id,
          problemJid: item.problemJid,
          containerName: json?.containerNamesMap?.[item.containerJid] || 'Latihan',
          problemName: json?.problemNamesMap?.[item.problemJid] || 'Soal TLX',
          problemAlias: json?.problemAliasesMap?.[`${item.containerJid}-${item.problemJid}`] || '-',
          language: item.gradingLanguage || 'Cpp20',
          verdict: item?.latestGrading?.verdict?.code || 'N/A',
          score: item?.latestGrading?.score || 0,
          submittedAt: new Date(item.time).toISOString(),
        })
      }

      const lastId = page[page.length - 1].id
      beforeId = lastId - 1
      if (page.length < 20) break
    } catch (error) {
      console.error(`TLX ${username}: ${error.message || error}`)
      break
    }
  }

  if (!requestSucceeded && !previous?.totalSolved) return null

  const acSubmissions = allSubmissions.filter((submission) => submission.verdict === 'AC' || submission.score === 100)
  const uniqueProblems = new Map()
  acSubmissions.forEach((submission) => {
    const key = submission.problemJid || submission.problemName
    if (!uniqueProblems.has(key)) uniqueProblems.set(key, submission)
  })

  const languages = {}
  allSubmissions.forEach((submission) => {
    const language = normalizeLanguage(submission.language)
    if (!language) return
    languages[language] = (languages[language] || 0) + 1
  })

  const dailyCalendar = {}
  allSubmissions.forEach((submission) => {
    const day = submission.submittedAt.slice(0, 10)
    if (!dailyCalendar[day]) dailyCalendar[day] = { tries: 0, ac: 0 }
    dailyCalendar[day].tries += 1
    if (submission.verdict === 'AC' || submission.score === 100) dailyCalendar[day].ac += 1
  })

  const recentSolved = Array.from(uniqueProblems.values()).map((submission) => ({
    id: `tlx-${submission.id}`,
    platform: 'tlx',
    title: submission.problemName,
    category: submission.containerName,
    language: normalizeLanguage(submission.language) || submission.language,
    difficulty: '-',
    url: `https://tlx.toki.id/submissions/${submission.id}`,
    solvedAt: submission.submittedAt,
  }))

  let totalSolved = uniqueProblems.size || previous?.totalSolved || 0
  let totalAcSubmissions = acSubmissions.length || previous?.totalAcSubmissions || 0

  try {
    const statsRes = await fetchWithTimeout(
      `https://api.tlx.toki.id/v2/stats/users/?username=${encodeURIComponent(username)}`,
      { headers: { 'User-Agent': USER_AGENT } },
      30_000
    )
    if (statsRes.ok) {
      requestSucceeded = true
      const stats = await statsRes.json()
      if (stats.totalProblemsTried) totalSolved = stats.totalProblemsTried
      if (stats?.totalProblemVerdictsMap?.AC) {
        totalAcSubmissions = stats.totalProblemVerdictsMap.AC
      }
    }
  } catch (error) {
    console.error(`TLX stats ${username}: ${error.message || error}`)
  }

  if (!requestSucceeded && !previous?.totalSolved) return null

  return {
    handle: username,
    url: `https://tlx.toki.id/profiles/${username}`,
    totalSolved,
    totalSubmissions: Math.max(allSubmissions.length, Number(previous?.totalSubmissions || 0)),
    totalAcSubmissions,
    uniqueProblemsSolved: uniqueProblems.size,
    languages,
    dailyCalendar,
    recentSolved,
  }
}

// ---------------------------------------------------------------------------
// Codeforces
// ---------------------------------------------------------------------------
async function cpCodeforces(handle, previous = {}) {
  const [infoRes, statusRes, ratingRes] = await Promise.allSettled([
    fetchWithTimeout(`https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`),
    fetchWithTimeout(`https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}&from=1&count=10000`),
    fetchWithTimeout(`https://codeforces.com/api/user.rating?handle=${encodeURIComponent(handle)}`),
  ])

  let infoOk = false
  let userInfo = {
    rating: previous?.rating || 0,
    maxRating: previous?.maxRating || previous?.rating || 0,
    rank: previous?.rank || 'unrated',
    maxRank: previous?.maxRank || previous?.rank || 'unrated',
  }

  if (infoRes.status === 'fulfilled' && infoRes.value.ok) {
    try {
      const data = await infoRes.value.json()
      if (data.status === 'OK' && data.result?.[0]) {
        userInfo = data.result[0]
        infoOk = true
      }
    } catch {
      // ignore malformed response
    }
  }

  let contestsCount = previous?.contestsCount || 0
  if (ratingRes.status === 'fulfilled' && ratingRes.value.ok) {
    try {
      const data = await ratingRes.value.json()
      if (data.status === 'OK') contestsCount = data.result?.length || 0
    } catch {
      // ignore malformed response
    }
  }

  let allSubs = []
  let statusOk = false
  if (statusRes.status === 'fulfilled' && statusRes.value.ok) {
    try {
      const data = await statusRes.value.json()
      if (data.status === 'OK') {
        allSubs = data.result || []
        statusOk = true
      }
    } catch {
      // ignore malformed response
    }
  }

  if (!infoOk && !statusOk && !previous?.totalSolved) return null

  const acSubs = allSubs.filter((submission) => submission.verdict === 'OK')
  const uniqueProblems = new Map()
  const tagsCount = {}
  const ratingDistribution = {}
  const dailyCalendar = {}

  allSubs.forEach((submission) => {
    const day = new Date(submission.creationTimeSeconds * 1000).toISOString().slice(0, 10)
    if (!dailyCalendar[day]) dailyCalendar[day] = { tries: 0, ac: 0 }
    dailyCalendar[day].tries += 1
    if (submission.verdict === 'OK') dailyCalendar[day].ac += 1
  })

  acSubs.forEach((submission) => {
    const key = `${submission.problem.contestId || 'gym'}-${submission.problem.index}`
    if (uniqueProblems.has(key)) return
    uniqueProblems.set(key, submission)
    ;(submission.problem.tags || []).forEach((tag) => {
      tagsCount[tag] = (tagsCount[tag] || 0) + 1
    })
    if (submission.problem.rating) {
      ratingDistribution[submission.problem.rating] = (ratingDistribution[submission.problem.rating] || 0) + 1
    }
  })

  const recentSolved = Array.from(uniqueProblems.values()).map((submission) => {
    const problem = submission.problem
    const url =
      problem.contestId ? `https://codeforces.com/contest/${problem.contestId}/problem/${problem.index}` : 'https://codeforces.com/problemset'

    return {
      id: `cf-${submission.id}`,
      platform: 'codeforces',
      title: `${problem.name} (${problem.contestId}${problem.index})`,
      category: problem.tags?.[0] || 'Problem Solving',
      tags: problem.tags || [],
      language: normalizeLanguage(submission.programmingLanguage),
      difficulty: problem.rating ? `${problem.rating}` : '800',
      url,
      solvedAt: new Date(submission.creationTimeSeconds * 1000).toISOString(),
    }
  })

  const languages = {}
  allSubs.forEach((submission) => {
    const language = normalizeLanguage(submission.programmingLanguage)
    if (!language) return
    languages[language] = (languages[language] || 0) + 1
  })

  return {
    handle,
    url: `https://codeforces.com/profile/${handle}`,
    rating: userInfo.rating || previous?.rating || 0,
    maxRating: userInfo.maxRating || previous?.maxRating || 0,
    rank: userInfo.rank || previous?.rank || 'unrated',
    maxRank: userInfo.maxRank || previous?.maxRank || 'unrated',
    contestsCount,
    totalSubmissions: Math.max(allSubs.length, Number(previous?.totalSubmissions || 0)),
    totalSolved: Math.max(uniqueProblems.size, Number(previous?.totalSolved || 0)),
    totalAcSubmissions: Math.max(acSubs.length, Number(previous?.totalAcSubmissions || 0)),
    tagsCount,
    ratingDistribution,
    languages,
    dailyCalendar,
    recentSolved,
  }
}

// ---------------------------------------------------------------------------
// LeetCode
// ---------------------------------------------------------------------------
async function fetchLeetCodeQuestionMetadata(slug) {
  try {
    const res = await fetchWithTimeout(
      'https://leetcode.com/graphql',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': USER_AGENT,
        },
        body: JSON.stringify({
          query: `query questionData($titleSlug: String!) {
            question(titleSlug: $titleSlug) {
              difficulty
              topicTags {
                name
              }
            }
          }`,
          variables: { titleSlug: slug },
        }),
      },
      20_000
    )
    if (!res.ok) return null
    const json = await res.json()
    const question = json?.data?.question
    if (!question) return null
    return {
      difficulty: question.difficulty || null,
      category: question.topicTags?.[0]?.name || null,
    }
  } catch {
    return null
  }
}

const LEETCODE_LANGUAGE_MAP = {
  cpp: 'C++20',
  c: 'C',
  csharp: 'C#',
  golang: 'Go',
  python: 'Python',
  python3: 'Python',
  java: 'Java',
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  rust: 'Rust',
  kotlin: 'Kotlin',
  swift: 'Swift',
  ruby: 'Ruby',
  scala: 'Scala',
  php: 'PHP',
  postgresql: 'PostgreSQL',
  mysql: 'MySQL',
  mssql: 'MS SQL',
  oraclesql: 'Oracle SQL',
  pythondata: 'Pandas',
}

async function cpLeetCode(username, previous = {}) {
  const [profileRes, solvedRes, acRes] = await Promise.allSettled([
    fetchWithTimeout(`https://alfa-leetcode-api.onrender.com/${encodeURIComponent(username)}`),
    fetchWithTimeout(`https://alfa-leetcode-api.onrender.com/${encodeURIComponent(username)}/solved`),
    fetchWithTimeout(`https://alfa-leetcode-api.onrender.com/${encodeURIComponent(username)}/acSubmission?limit=50`),
  ])

  let anyOk = false
  let ranking = previous?.ranking || 0

  if (profileRes.status === 'fulfilled' && profileRes.value.ok) {
    try {
      const profile = await profileRes.value.json()
      if (profile?.ranking) ranking = profile.ranking
      anyOk = true
    } catch {
      // ignore malformed response
    }
  }

  let easySolved = previous?.easySolved || 0
  let mediumSolved = previous?.mediumSolved || 0
  let hardSolved = previous?.hardSolved || 0
  let totalSolved = previous?.totalSolved || 0

  if (solvedRes.status === 'fulfilled' && solvedRes.value.ok) {
    try {
      const solved = await solvedRes.value.json()
      if (solved.solvedProblem) totalSolved = solved.solvedProblem
      if (solved.easySolved) easySolved = solved.easySolved
      if (solved.mediumSolved) mediumSolved = solved.mediumSolved
      if (solved.hardSolved) hardSolved = solved.hardSolved
      anyOk = true
    } catch {
      // ignore malformed response
    }
  }

  if (!anyOk && !previous?.totalSolved) return null

  let recentSolved = []
  const dailyCalendar = {}

  if (acRes.status === 'fulfilled' && acRes.value.ok) {
    try {
      const ac = await acRes.value.json()
      const submissions = ac?.submission || []
      anyOk = true

      const metaCache = new Map()
      if (Array.isArray(previous?.recentSolved)) {
        previous.recentSolved.forEach((item) => {
          const slug = item.url ? item.url.split('/problems/')[1]?.replace('/', '') : null
          if (slug && item.difficulty && item.difficulty !== '-') {
            metaCache.set(slug, { difficulty: item.difficulty, category: item.category })
          }
        })
      }

      const uncachedSlugs = [...new Set(submissions.map((submission) => submission.titleSlug).filter((slug) => slug && !metaCache.has(slug)))]

      await mapLimit(uncachedSlugs, 8, async (slug) => {
        const meta = await fetchLeetCodeQuestionMetadata(slug)
        if (meta) metaCache.set(slug, meta)
      })

      recentSolved = submissions.map((submission) => {
        const rawLanguage = String(submission.lang || '')
        const language = LEETCODE_LANGUAGE_MAP[rawLanguage.toLowerCase()] || normalizeLanguage(rawLanguage) || 'C++20'
        const solvedAt = new Date(parseInt(submission.timestamp, 10) * 1000).toISOString()

        const day = solvedAt.slice(0, 10)
        if (!dailyCalendar[day]) dailyCalendar[day] = { tries: 0, ac: 0 }
        dailyCalendar[day].tries += 1
        dailyCalendar[day].ac += 1

        const meta = metaCache.get(submission.titleSlug) || {}
        const isDatabaseLanguage = ['postgresql', 'mysql', 'mssql', 'oraclesql'].includes(rawLanguage.toLowerCase())
        const isDatabaseTitle = /table|database|query|join|select|department|employee|salary/i.test(submission.title)

        return {
          id: `lc-${submission.timestamp || submission.titleSlug}`,
          platform: 'leetcode',
          title: submission.title,
          category: meta.category || (isDatabaseLanguage || isDatabaseTitle ? 'Database' : 'Algorithms'),
          language,
          difficulty: meta.difficulty || '-',
          url: `https://leetcode.com/problems/${submission.titleSlug}/`,
          solvedAt,
        }
      })
    } catch (error) {
      console.error(`LeetCode submissions ${username}: ${error.message || error}`)
    }
  }

  if (!anyOk && !previous?.totalSolved) return null

  return {
    handle: username,
    url: `https://leetcode.com/u/${username}`,
    ranking,
    totalSolved,
    easySolved,
    mediumSolved,
    hardSolved,
    totalSubmissions: Math.max(Number(previous?.totalSubmissions || 0), recentSolved.length),
    dailyCalendar,
    recentSolved,
  }
}

// ---------------------------------------------------------------------------
// Aggregation
// ---------------------------------------------------------------------------
function combineHeatmap(platforms) {
  const heatmap = {}
  PLATFORM_KEYS.forEach((key) => {
    const calendar = platforms[key]?.dailyCalendar || {}
    Object.entries(calendar).forEach(([day, entry]) => {
      if (!heatmap[day]) heatmap[day] = { tries: 0, ac: 0 }
      heatmap[day].tries += Number(entry?.tries || 0)
      heatmap[day].ac += Number(entry?.ac || 0)
    })
  })
  return heatmap
}

function combineFeed(platforms) {
  const feed = new Map()
  PLATFORM_KEYS.forEach((key) => {
    ;(platforms[key]?.recentSolved || []).forEach((item) => {
      const id = item.id || `${key}:${item.title}:${item.solvedAt}`
      if (!feed.has(id)) feed.set(id, item)
    })
  })
  return Array.from(feed.values())
    .filter((item) => item.solvedAt)
    .sort((a, b) => new Date(b.solvedAt).getTime() - new Date(a.solvedAt).getTime())
}

function topLanguage(platforms) {
  const counts = {}
  PLATFORM_KEYS.forEach((key) => {
    const platform = platforms[key]
    const languages = platform?.languages || {}

    if (Object.keys(languages).length) {
      Object.entries(languages).forEach(([language, count]) => {
        const normalized = normalizeLanguage(language) || language
        counts[normalized] = (counts[normalized] || 0) + Number(count || 0)
      })
      return
    }

    ;(platform?.recentSolved || []).forEach((submission) => {
      const normalized = normalizeLanguage(submission.language)
      if (normalized) counts[normalized] = (counts[normalized] || 0) + 1
    })
  })

  let name = '-'
  let count = 0
  Object.entries(counts).forEach(([language, total]) => {
    if (total > count) {
      name = language
      count = total
    }
  })
  return { name, count }
}

async function crawlStudent(roster, previousSnapshot) {
  const previousPlatforms = previousSnapshot?.platforms || {}
  const handles = {
    tlx: roster.platforms?.tlx || null,
    codeforces: roster.platforms?.codeforces || null,
    leetcode: roster.platforms?.leetcode || null,
  }

  const results = await Promise.all(
    PLATFORM_KEYS.map(async (key) => {
      const handle = handles[key]
      if (!handle) return { key, value: emptyPlatform(key) }

      try {
        const fresh =
          key === 'tlx' ? await cpTlx(handle, previousPlatforms.tlx || {})
          : key === 'codeforces' ? await cpCodeforces(handle, previousPlatforms.codeforces || {})
          : await cpLeetCode(handle, previousPlatforms.leetcode || {})

        return {
          key,
          value: mergePlatform(fresh, previousPlatforms[key], key, handle),
        }
      } catch (error) {
        recordWarning({
          nim: roster.nim,
          nama: roster.nama,
          platform: key,
          handle,
          error,
        })
        return {
          key,
          value: previousPlatforms[key] || emptyPlatform(key, handle),
        }
      }
    })
  )

  const platforms = Object.fromEntries(results.map(({ key, value }) => [key, value]))
  const heatmap = combineHeatmap(platforms)
  const recentGlobalFeed = combineFeed(platforms)
  const language = topLanguage(platforms)

  const totalSolved = PLATFORM_KEYS.reduce((sum, key) => sum + Number(platforms[key]?.totalSolved || 0), 0)
  const totalSubmissions = PLATFORM_KEYS.reduce((sum, key) => sum + Number(platforms[key]?.totalSubmissions || 0), 0)
  const activePlatforms = PLATFORM_KEYS.filter((key) => handles[key] || Number(platforms[key]?.totalSolved || 0) > 0).length

  return {
    meta: {
      updatedAt: nowIso(),
      version: VERSION,
      studentNim: roster.nim,
      handles,
    },
    overview: {
      totalSolved,
      totalSubmissions,
      activePlatforms,
      heatmap,
      topLanguage: language,
    },
    platforms,
    recentGlobalFeed,
  }
}

function buildSummary(roster, snapshot) {
  const platforms = {}
  PLATFORM_KEYS.forEach((key) => {
    const platform = snapshot.platforms?.[key] || {}
    platforms[key] = {
      handle: roster.platforms?.[key] || platform.handle || null,
      solved: Number(platform.totalSolved || 0),
      submissions: Number(platform.totalSubmissions || 0),
      ...(key === 'codeforces' ? { rating: Number(platform.rating || 0), rank: platform.rank || 'unrated' } : {}),
      ...(key === 'leetcode' ? { ranking: Number(platform.ranking || 0) } : {}),
    }
  })

  const totalSolved = PLATFORM_KEYS.reduce((sum, key) => sum + platforms[key].solved, 0)
  const hasHandle = PLATFORM_KEYS.some((key) => Boolean(roster.platforms?.[key]))
  const sync =
    !hasHandle ? 'unlinked'
    : totalSolved > 0 ? 'ok'
    : 'empty'

  return {
    nim: roster.nim,
    nama: roster.nama,
    kelasHuruf: roster.kelasHuruf,
    kelas: roster.kelas,
    aktif: roster.aktif !== false,
    totalSolved,
    totalSubmissions: Number(snapshot.overview?.totalSubmissions || 0),
    lastSolvedAt: snapshot.recentGlobalFeed?.[0]?.solvedAt || null,
    updatedAt: snapshot.meta?.updatedAt || null,
    sync,
    platforms,
  }
}

function readRoster() {
  if (!fs.existsSync(ROSTER_DIR)) return []
  return fs
    .readdirSync(ROSTER_DIR)
    .filter((file) => /^\d+\.json$/.test(file))
    .map((file) => readJson(path.join(ROSTER_DIR, file)))
    .filter(Boolean)
    .sort((a, b) => String(a.nim).localeCompare(String(b.nim)))
}

async function main() {
  console.log('Menyinkronkan snapshot CP per mahasiswa...')

  const roster = readRoster()
  if (!roster.length) {
    throw new Error('Roster kosong. Jalankan "npm run sync:roster" terlebih dahulu untuk mengambil data dari spreadsheet.')
  }

  fs.mkdirSync(SNAPSHOT_DIR, { recursive: true })
  const previousSnapshots = readJsonDir(SNAPSHOT_DIR)

  const results = await mapLimit(roster, 2, async (student) => {
    console.log(`· ${student.nim} ${student.nama}`)
    try {
      const snapshot = await crawlStudent(student, previousSnapshots.get(student.nim))
      await writeJson(path.join(SNAPSHOT_DIR, `${student.nim}.json`), snapshot)
      return { student, snapshot }
    } catch (error) {
      console.error(`Gagal memproses ${student.nim}: ${error.message || error}`)
      const fallback = previousSnapshots.get(student.nim) || emptySnapshot(student.nim)
      await writeJson(path.join(SNAPSHOT_DIR, `${student.nim}.json`), fallback)
      return { student, snapshot: fallback }
    }
  })

  const summaries = results
    .map(({ student, snapshot }) => buildSummary(student, snapshot))
    .sort((a, b) => String(a.kelas).localeCompare(String(b.kelas), 'id') || String(a.nama).localeCompare(String(b.nama), 'id'))

  await writeJson(SUMMARIES_FILE, { updatedAt: nowIso(), students: summaries })

  const keep = new Set(roster.map((student) => `${student.nim}.json`))
  let removed = 0
  for (const file of fs.readdirSync(SNAPSHOT_DIR)) {
    if (!/^\d+\.json$/.test(file) || keep.has(file)) continue
    fs.unlinkSync(path.join(SNAPSHOT_DIR, file))
    removed++
  }

  console.log(
    `Snapshot OK: ${summaries.length} mahasiswa, ${summaries.reduce(
      (sum, student) => sum + student.totalSolved,
      0
    )} soal selesai${removed ? `, ${removed} snapshot lama dihapus` : ''}.`
  )

  if (process.env.GITHUB_STEP_SUMMARY) {
    const summaryLines = [
      '## 📊 Rangkuman Sinkronisasi Data CP Mahasiswa',
      `- **Total Mahasiswa**: ${summaries.length}`,
      `- **Total Soal Selesai**: ${summaries.reduce((sum, student) => sum + student.totalSolved, 0)}`,
      `- **Waktu Update**: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB`,
      '',
    ]
    if (crawlWarnings.length > 0) {
      summaryLines.push(`### ⚠️ Peringatan Handle Bermasalah (${crawlWarnings.length})`)
      summaryLines.push('| NIM | Nama | Platform | Handle | Kendala |')
      summaryLines.push('| :--- | :--- | :--- | :--- | :--- |')
      crawlWarnings.forEach((w) => {
        summaryLines.push(`| ${w.nim} | ${w.nama} | ${w.platform.toUpperCase()} | \`${w.handle}\` | ${w.error} |`)
      })
    } else {
      summaryLines.push('✅ Seluruh data mahasiswa berhasil disinkronkan tanpa kendala.')
    }
    try {
      fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summaryLines.join('\n') + '\n')
    } catch {
      // ignore
    }
  }
}

main().catch((error) => {
  console.error(error.message || error)
  process.exit(1)
})
