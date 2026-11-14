import { computed, ref, type Ref } from 'vue'
import { buildCpHeatmap, getPrimaryLanguage } from '../utils/cp/stats'
import { CP_PLATFORMS, isPlatformLinked } from '../utils/cp/platforms'
import { buildMonths, toWeeks } from '../utils/heatmap'
import { useCpSummary } from './useCpSummary'
import { OVERVIEW_ICON } from '../utils/icons'
import type { CpData } from '../types/cp.types'
import type { TabItem } from '../types/ui.types'

export const useCpStats = (cpData: Ref<CpData | null>, period?: Ref<string>) => {
  const heatmapPeriod = period ?? ref('last-12-months')
  const summary = useCpSummary(cpData)
  const { totalSolved, totalTlxSolved, totalCfSolved, totalLcSolved } = summary

  const primaryLanguage = computed(() => getPrimaryLanguage(cpData.value))

  const tabs = computed<TabItem[]>(() => {
    const list: TabItem[] = [
      {
        key: 'overview',
        labelEn: 'Ringkasan Utama',
        labelId: 'Ringkasan Utama',
        icon: OVERVIEW_ICON,
        count: totalSolved.value,
      },
    ]

    if (isPlatformLinked(cpData.value, 'tlx')) {
      list.push({
        key: 'tlx',
        labelEn: 'TLX (TOKI)',
        labelId: 'TLX (TOKI)',
        logo: CP_PLATFORMS.tlx.logo,
        count: totalTlxSolved.value,
      })
    }

    if (isPlatformLinked(cpData.value, 'codeforces')) {
      list.push({
        key: 'codeforces',
        labelEn: 'Codeforces',
        labelId: 'Codeforces',
        logo: CP_PLATFORMS.codeforces.logo,
        count: totalCfSolved.value,
      })
    }

    if (isPlatformLinked(cpData.value, 'leetcode')) {
      list.push({
        key: 'leetcode',
        labelEn: 'LeetCode',
        labelId: 'LeetCode',
        logo: CP_PLATFORMS.leetcode.logo,
        logoLight: CP_PLATFORMS.leetcode.logoLight,
        count: totalLcSolved.value,
      })
    }

    return list
  })

  const heatmapData = computed(() => buildCpHeatmap(cpData.value?.overview?.heatmap || {}, heatmapPeriod.value))
  const heatmapWeeks = computed(() => toWeeks(heatmapData.value))
  const heatmapMonths = computed(() => buildMonths(heatmapWeeks.value))
  const totalSubmissionsInHeatmap = computed(() => heatmapData.value.reduce((acc, day) => acc + day.tries, 0))
  const heatmapYears = computed(() => {
    const years = new Set<number>()
    Object.keys(cpData.value?.overview?.heatmap || {}).forEach((date) => {
      const year = Number(date.slice(0, 4))
      if (Number.isInteger(year) && year >= 2000) years.add(year)
    })
    return [...years].sort((a, b) => b - a)
  })

  return {
    ...summary,
    primaryLanguage,
    tabs,
    heatmapWeeks,
    heatmapMonths,
    heatmapYears,
    totalSubmissionsInHeatmap,
  }
}
