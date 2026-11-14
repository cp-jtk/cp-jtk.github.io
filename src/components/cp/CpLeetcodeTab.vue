<template>
  <CpPlatformTab
    platform="leetcode"
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
    totalLcSolved?: number
    isId?: boolean
  }>(),
  {
    totalLcSolved: 0,
    isId: true,
  }
)

const columns: CpColumn[] = [{ key: 'category', labelEn: 'Kategori', labelId: 'Kategori' }]

const platformCopy = computed<CpPlatformCopy>(() => ({
  solvedTitle: { en: 'Soal LeetCode yang Diselesaikan', id: 'Soal LeetCode yang Diselesaikan' },
  openTitle: { en: 'Buka di LeetCode', id: 'Buka di LeetCode' },
}))

const metrics = computed<CpMetric[]>(() => [
  {
    label: 'Easy Solved',
    value: props.cpData?.platforms?.leetcode?.easySolved ?? 0,
    sub: 'Fondasi & dasar DSA',
  },
  {
    label: 'Medium Solved',
    value: props.cpData?.platforms?.leetcode?.mediumSolved ?? 0,
    sub: 'Problem solving inti',
  },
  {
    label: 'Hard Solved',
    value: props.cpData?.platforms?.leetcode?.hardSolved ?? 0,
    sub: 'Kompleksitas lanjutan',
  },
])
</script>
