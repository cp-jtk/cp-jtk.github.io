<template>
  <CpPlatformTab
    platform="codeforces"
    :cpData="cpData"
    :columns="columns"
    :copy="platformCopy"
    :isId="isId">
    <CpMetricsGrid :metrics="metrics" />

    <div v-if="tags.length > 0" class="mt-8">
      <h4 class="text-lg font-semibold mb-3 platform-subtitle">Topik & Algoritma di Codeforces</h4>
      <div class="flex flex-wrap gap-2">
        <div
          v-for="(count, tag) in tags"
          :key="tag"
          class="px-3 py-1.5 cf-tag-card text-sm flex items-center gap-2">
          <span class="cf-tag-name">{{ tag }}</span>
          <span class="cf-tag-count">{{ count }}</span>
        </div>
      </div>
    </div>
  </CpPlatformTab>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import CpPlatformTab from './CpPlatformTab.vue'
import CpMetricsGrid from './CpMetricsGrid.vue'
import type { CpColumn, CpData, CpMetric, CpPlatformCopy } from '../../types/cp.types'

const props = withDefaults(
  defineProps<{
    cpData: CpData
    totalCfSolved?: number
    isId?: boolean
  }>(),
  {
    totalCfSolved: 0,
    isId: true,
  }
)

const columns: CpColumn[] = [
  { key: 'category', labelEn: 'Tag', labelId: 'Tag' },
  { key: 'difficulty', labelEn: 'Kesulitan', labelId: 'Kesulitan' },
  { key: 'language', labelEn: 'Bahasa', labelId: 'Bahasa' },
]

const tags = computed(() => props.cpData?.platforms?.codeforces?.tagsCount || {})

const platformCopy = computed<CpPlatformCopy>(() => ({
  solvedTitle: { en: 'Soal Codeforces yang Diselesaikan', id: 'Soal Codeforces yang Diselesaikan' },
  openTitle: { en: 'Buka di Codeforces', id: 'Buka di Codeforces' },
}))

const metrics = computed<CpMetric[]>(() => [
  {
    label: 'Rating Saat Ini',
    value: props.cpData?.platforms?.codeforces?.rating ?? 0,
    subPrefix: 'Peringkat:',
    subHighlight: props.cpData?.platforms?.codeforces?.rank || 'unrated',
  },
  {
    label: 'Soal Selesai',
    value: props.totalCfSolved,
    sub: 'Soal berhasil AC',
  },
  {
    label: 'Total Submisi',
    value: props.cpData?.platforms?.codeforces?.totalSubmissions ?? 0,
    sub: 'Riwayat submisi di Codeforces',
  },
])
</script>

<style scoped>
.cf-tag-card {
  background: var(--bg-soft);
  border: none;
  border-radius: var(--radius-md);
}
:root.light .cf-tag-card {
  background: var(--bg-soft);
  border: none;
}

.cf-tag-name {
  color: var(--text);
  font-weight: 500;
}
:root.light .cf-tag-name {
  color: var(--color-neutral-strong);
}

.cf-tag-count {
  background: rgba(56, 189, 248, 0.15);
  color: var(--color-info);
  padding: 0.15rem 0.45rem;
  border-radius: var(--radius-sm);
  font-size: 0.725rem;
  font-weight: 700;
}
:root.light .cf-tag-count {
  background: color-mix(in srgb, var(--color-info) 15%, transparent);
  color: var(--color-info-strong);
}
</style>
