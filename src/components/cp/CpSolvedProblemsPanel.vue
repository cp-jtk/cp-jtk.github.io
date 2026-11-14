<template>
  <div>
    <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
      <h4 class="text-lg font-semibold platform-subtitle">{{ text(copy.solvedTitle) }}</h4>
      <span class="text-xs platform-count-text">
        Total {{ problems.length }} {{ text(itemNoun) }} tercatat
      </span>
    </div>

    <div class="cp-table-wrapper">
      <CpProblemsTable
        :problems="paginatedList"
        :columns="columns"
        :currentPage="currentPage"
        :pageSize="pageSize"
        :showPlatform="false"
        :showDifficulty="false"
        :copy="tableCopy"
        bare
        :isId="isId" />

      <CpTablePagination
        v-model:currentPage="currentPage"
        :totalPages="totalPages"
        :pageSize="pageSize"
        :totalItems="problems.length"
        :isId="isId" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import CpProblemsTable from './CpProblemsTable.vue'
import CpTablePagination from './CpTablePagination.vue'
import { usePagination } from '../../composables/usePagination'
import { DEFAULT_PAGE_SIZE } from '../../utils/pagination'
import { resolveLocaleText, type LocaleText } from '../../utils/i18n'
import type { CpColumn, CpPlatformCopy, CpTableCopy, SubmissionItem } from '../../types/cp.types'

const props = withDefaults(
  defineProps<{
    problems: SubmissionItem[]
    columns?: CpColumn[]
    copy: CpPlatformCopy
    isId?: boolean
    pageSize?: number
  }>(),
  {
    columns: () => [],
    isId: true,
    pageSize: DEFAULT_PAGE_SIZE,
  }
)

const text = (value: LocaleText) => resolveLocaleText(value, props.isId)

const itemNoun = computed<LocaleText>(() => props.copy.itemNoun || { en: 'soal', id: 'soal' })

const tableCopy = computed<CpTableCopy>(() => ({
  titleColumn: props.copy.titleColumn || { en: 'Judul Soal', id: 'Judul Soal' },
  timeColumn: { en: 'Waktu Selesai', id: 'Waktu Selesai' },
  openTitle: props.copy.openTitle || { en: 'Buka submisi', id: 'Buka submisi' },
}))

const { currentPage, pageSize, totalPages, paginatedList } = usePagination(
  () => props.problems,
  props.pageSize
)
</script>
