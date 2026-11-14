import type { CpData, CpHeatmapDay, CpRecentSolved } from '../../types/cp.types'
import { buildHeatmapDaysInRange, getHeatmapLevel, getHeatmapRange, type HeatmapMap, type HeatmapTooltipMetric } from '../heatmap'
import { cleanLanguage } from './formatting'

export const cpHeatmapMetrics = (day: CpHeatmapDay, isId: boolean): HeatmapTooltipMetric[] => {
  const tries = day?.tries ?? 0
  const ac = day?.ac ?? 0

  if (tries === 0 && ac === 0) {
    return [{ value: isId ? 'Tidak ada aktivitas' : 'No activity', color: 'slate' }]
  }

  return [
    { value: tries, label: isId ? 'Percobaan' : 'Tries', color: 'sky' },
    { value: ac, label: 'AC', color: 'emerald' },
  ]
}

export const buildCpHeatmap = (map: HeatmapMap = {}, period = 'last-12-months'): CpHeatmapDay[] => {
  const days = buildHeatmapDaysInRange(
    map,
    getHeatmapRange(period),
    (entry) => {
      let tries = 0
      let ac = 0
      if (typeof entry === 'number') {
        tries = entry
      } else if (entry && typeof entry === 'object') {
        tries = Number(entry.tries || entry.count || 0)
        ac = Number(entry.ac || 0)
      }
      return { count: tries, tries, ac }
    },
    getHeatmapLevel
  )

  return days.map(({ date, count, tries, ac, level }) => ({
    date,
    count,
    tries: tries ?? 0,
    ac: ac ?? 0,
    level,
  }))
}

const formatCompactCount = (count: number): string => {
  if (!count) return '0'
  return count >= 1000 ? `${Math.floor(count / 1000)}K+` : `${count}`
}

export const getPrimaryLanguage = (cpData: CpData | null | undefined) => {
  const overviewTop = cpData?.overview?.topLanguage
  if (overviewTop?.name && overviewTop?.count) {
    const name = overviewTop.name
    const count = Number(overviewTop.count)
    const formattedCount = formatCompactCount(count)
    return { name, count, formattedCount }
  }

  const counts: Record<string, number> = {}

  Object.entries(cpData?.platforms?.tlx?.languages || {}).forEach(([language, count]) => {
    const cleaned = cleanLanguage(language)
    counts[cleaned] = (counts[cleaned] || 0) + Number(count || 0)
  })

  Object.entries(cpData?.platforms?.codeforces?.languages || {}).forEach(([language, count]) => {
    const cleaned = cleanLanguage(language)
    counts[cleaned] = (counts[cleaned] || 0) + Number(count || 0)
  })

  ;(cpData?.platforms?.leetcode?.recentSolved || []).forEach((submission: CpRecentSolved) => {
    if (submission.language) {
      const cleaned = cleanLanguage(submission.language)
      counts[cleaned] = (counts[cleaned] || 0) + 1
    }
  })

  let topLanguage = '-'
  let topCount = 0
  Object.entries(counts).forEach(([language, count]) => {
    if (count > topCount) {
      topCount = count
      topLanguage = language
    }
  })

  return {
    name: topCount > 0 ? topLanguage : '-',
    count: topCount,
    formattedCount: formatCompactCount(topCount),
  }
}
