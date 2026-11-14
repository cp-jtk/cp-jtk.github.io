<template>
  <div class="cp-dashboard">
    <DashboardTopbar :lastUpdated="lastUpdated" :isId="true" />

    <div class="stats-grid">
      <StatCard
        label="Total Soal Selesai"
        :value="totalSolved"
        variant="emerald"
        helper="Gabungan TLX, Codeforces, dan LeetCode" />

      <StatCard
        label="Total Submisi"
        :value="totalSubmissions"
        variant="sky"
        helper="Riwayat percobaan di semua platform" />

      <StatCard
        label="Platform Aktif"
        :value="activePlatforms"
        variant="amber"
        helper="TLX · Codeforces · LeetCode" />

      <StatCard
        label="Bahasa Utama"
        :value="primaryLanguage.name"
        variant="purple"
        :helper="languageHelper" />
    </div>

    <ActivityHeatmap
      v-model="heatmapPeriod"
      :weeks="heatmapWeeks"
      :months="heatmapMonths"
      :periods="heatmapPeriods"
      title="Submission Activity"
      :countBadge="heatmapSummary"
      :getMetrics="cpHeatmapMetrics"
      :isId="false" />

    <section class="overview-section">
      <CpOverviewTab
        :cpData="cpData"
        :totalTlxSolved="totalTlxSolved"
        :totalCfSolved="totalCfSolved"
        :totalLcSolved="totalLcSolved"
        :isId="true"
        locale="id" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCpStats } from '../../composables/useCpStats'
import ActivityHeatmap from '../shared/ActivityHeatmap.vue'
import CpOverviewTab from './CpOverviewTab.vue'
import StatCard from '../shared/StatCard.vue'
import DashboardTopbar from '../shared/DashboardTopbar.vue'
import { cpHeatmapMetrics } from '../../utils/cp/stats'
import { CP_PLATFORM_KEYS } from '../../utils/cp/platforms'
import type { CpData } from '../../types/cp.types'

const props = defineProps<{
  initialData?: CpData
}>()

const cpData = computed<CpData | null>(() => props.initialData || null)
const lastUpdated = props.initialData?.meta?.updatedAt || ''

const heatmapPeriod = ref('last-12-months')

const {
  totalSolved,
  totalSubmissions,
  totalTlxSolved,
  totalCfSolved,
  totalLcSolved,
  primaryLanguage,
  heatmapWeeks,
  heatmapMonths,
  heatmapYears,
  totalSubmissionsInHeatmap,
} = useCpStats(cpData, heatmapPeriod)

const heatmapPeriods = computed(() => [
  { value: 'last-12-months', label: 'Past year' },
  ...heatmapYears.value.map((year) => ({ value: String(year), label: String(year) })),
])

const activePlatforms = computed(() => {
  const platforms = props.initialData?.platforms
  if (!platforms) return 0
  return CP_PLATFORM_KEYS.filter((key) => {
    const platform = platforms[key]
    return Boolean(platform?.handle || (platform?.totalSolved ?? 0) > 0)
  }).length
})

const languageHelper = computed(() =>
  primaryLanguage.value.count > 0 ?
    `${primaryLanguage.value.formattedCount} submisi ${primaryLanguage.value.name}`
  : 'Belum ada data bahasa'
)

const heatmapSummary = computed(() => {
  const period =
    heatmapPeriod.value === 'last-12-months' ? 'in the past one year' : `in ${heatmapPeriod.value}`
  return `${totalSubmissionsInHeatmap.value} Submission ${period}`
})
</script>

<style scoped>
.cp-dashboard {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 100%;
  --type-2xl: 1.75rem;
  --type-lg: 1.125rem;
  --type-base: 0.875rem;
  --type-sm: 0.75rem;
  --type-xs: 0.7rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  width: 100%;
}

@media (min-width: 640px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
  }
}

@media (min-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 1.25rem;
  }
}

.overview-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-top: 0.5rem;
}
</style>
