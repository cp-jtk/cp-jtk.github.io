import { computed, type Ref } from 'vue'
import type { CpData } from '../types/cp.types'

/**
 * Lightweight CP totals for components that do not need the heatmap or tabs.
 * Missing values default to zero; snapshots are the source of truth.
 */
export const useCpSummary = (cpData: Ref<CpData | null>) => {
  const totalSolved = computed(() => cpData.value?.overview?.totalSolved ?? 0)
  const totalSubmissions = computed(() => cpData.value?.overview?.totalSubmissions ?? 0)
  const totalTlxSolved = computed(() => cpData.value?.platforms?.tlx?.totalSolved ?? 0)
  const totalCfSolved = computed(() => cpData.value?.platforms?.codeforces?.totalSolved ?? 0)
  const totalLcSolved = computed(() => cpData.value?.platforms?.leetcode?.totalSolved ?? 0)

  return {
    totalSolved,
    totalSubmissions,
    totalTlxSolved,
    totalCfSolved,
    totalLcSolved,
  }
}
