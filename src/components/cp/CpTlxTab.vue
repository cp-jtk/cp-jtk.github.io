<template>
  <CpPlatformTab
    platform="tlx"
    :cpData="cpData"
    :columns="columns"
    :copy="platformCopy"
    :isId="isId">
    <CpMetricsGrid :metrics="metrics" />
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
    totalTlxSolved?: number
    isId?: boolean
  }>(),
  {
    totalTlxSolved: 0,
    isId: true,
  }
)

const columns: CpColumn[] = [
  { key: 'category', labelEn: 'Topik / Modul', labelId: 'Topik / Modul' },
  { key: 'language', labelEn: 'Bahasa', labelId: 'Bahasa' },
]

const platformCopy = computed<CpPlatformCopy>(() => ({
  solvedTitle: { en: 'Soal TLX yang Diselesaikan', id: 'Soal TLX yang Diselesaikan' },
  openTitle: { en: 'Buka Submisi di TLX', id: 'Buka Submisi di TLX' },
}))

const metrics = computed<CpMetric[]>(() => [
  {
    label: 'Soal Selesai',
    value: props.totalTlxSolved,
    sub: 'Soal berhasil AC',
  },
  {
    label: 'Total Submisi',
    value: props.cpData?.platforms?.tlx?.totalSubmissions ?? 0,
    sub: 'Riwayat submisi di TLX',
  },
  {
    label: 'Submisi AC',
    value: props.cpData?.platforms?.tlx?.totalAcSubmissions ?? 0,
    sub: 'Submisi berstatus 100/AC',
  },
])
</script>
