<template>
  <div class="cp-table-container">
    <div class="table-swipe-hint">
      <svg
        class="swipe-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round">
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
      <span>{{ isId ? 'Geser untuk melihat seluruh tabel' : 'Swipe to see the full table' }}</span>
    </div>

    <div class="cp-table-wrapper" :class="{ 'is-bare': bare }">
      <table class="cp-table">
        <thead>
          <tr>
            <th class="col-num">#</th>
            <th v-if="showPlatform" class="col-platform">{{ text(tableCopy.platformColumn) }}</th>
            <th class="col-title">{{ text(tableCopy.titleColumn) }}</th>
            <th v-for="col in displayColumns" :key="col.key" :class="`col-${columnClass(col.key)}`">
              {{ isId ? col.labelId : col.labelEn }}
            </th>
            <th class="col-status">{{ text(tableCopy.statusColumn) }}</th>
            <th class="col-time">{{ text(tableCopy.timeColumn) }}</th>
            <th class="col-action"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, idx) in problems" :key="item.id || idx" class="cp-table-row">
            <td class="cell-num">
              {{ startIndex + idx + 1 }}
            </td>

            <!-- Platform Column -->
            <td v-if="showPlatform" class="cell-platform">
              <div class="platform-badge-cell" :class="item.platform">
                <template v-if="getPlatformLogoLight(item.platform)">
                  <img
                    :src="getPlatformLogo(item.platform)"
                    alt=""
                    class="table-logo-img logo-variant-dark" />
                  <img
                    :src="getPlatformLogoLight(item.platform)"
                    alt=""
                    class="table-logo-img logo-variant-light" />
                </template>
                <img v-else :src="getPlatformLogo(item.platform)" alt="" class="table-logo-img" />
                <span class="platform-text-name">{{ getPlatformName(item.platform) }}</span>
              </div>
            </td>

            <!-- Title -->
            <td class="cell-title">
              <a
                :href="item.url || '#'"
                target="_blank"
                rel="noopener noreferrer"
                class="problem-title-link"
                :title="item.title">
                <span class="title-text">{{ item.title }}</span>
                <ExternalLinkIcon class="w-3.5 h-3.5 link-arrow-icon" />
              </a>
            </td>

            <!-- Dynamic Columns (Topic / Difficulty / Language) -->
            <td
              v-for="col in displayColumns"
              :key="col.key"
              :class="`cell-${columnClass(col.key)}`">
              <template v-if="col.key === 'category'">
                <div
                  v-if="getItemTags(item).length > 0"
                  class="topic-cell-group"
                  :title="getItemTags(item).join(', ')">
                  <span class="topic-pill">
                    <span>{{ getItemTags(item)[0] }}</span>
                  </span>
                  <span
                    v-if="getItemTags(item).length > 1"
                    class="topic-more-badge"
                    :title="getItemTags(item).slice(1).join(', ')">
                    +{{ getItemTags(item).length - 1 }}
                  </span>
                </div>
                <span v-else class="text-xs text-gray-500 font-mono">-</span>
              </template>
              <template v-else-if="col.key === 'difficulty'">
                <span
                  v-if="item.difficulty && item.difficulty !== '-'"
                  class="diff-badge"
                  :class="getDiffClass(item.difficulty)">
                  {{ item.difficulty }}
                </span>
                <span v-else class="text-xs text-gray-500 font-mono">-</span>
              </template>
              <template v-else-if="col.key === 'language'">
                <span v-if="item.language" class="lang-tag">{{
                  cleanLanguage(item.language)
                }}</span>
                <span v-else class="text-xs text-gray-500 font-mono">-</span>
              </template>
            </td>

            <!-- Status / Verdict -->
            <td class="cell-status">
              <span class="status-badge ac">{{ text(tableCopy.accepted) }}</span>
            </td>

            <!-- Solved Time -->
            <td class="cell-time" :title="item.solvedAt">
              {{ formatExactDate(item.solvedAt, isId) }}
            </td>

            <!-- Action External Link -->
            <td class="cell-action">
              <a
                :href="item.url || '#'"
                target="_blank"
                rel="noopener noreferrer"
                class="open-btn"
                :title="text(tableCopy.openTitle)">
                <ExternalLinkIcon class="w-4 h-4" />
              </a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ExternalLinkIcon from '../shared/ExternalLinkIcon.vue'
import { cleanLanguage, getDiffClass } from '../../utils/cp/formatting'
import { getPlatformLogo, getPlatformLogoLight, getPlatformName } from '../../utils/cp/platforms'
import type { CpColumn, CpColumnKey, CpTableCopy, SubmissionItem } from '../../types/cp.types'
import { resolveLocaleText, type LocaleText } from '../../utils/i18n'
import { formatExactDate } from '../../utils/dateFormat'
import { DEFAULT_PAGE_SIZE } from '../../utils/pagination'

const props = withDefaults(
  defineProps<{
    problems: SubmissionItem[]
    columns?: CpColumn[]
    currentPage?: number
    pageSize?: number
    showPlatform?: boolean
    showDifficulty?: boolean
    copy?: Partial<CpTableCopy>
    bare?: boolean
    isId?: boolean
  }>(),
  {
    columns: () => [],
    currentPage: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    showPlatform: true,
    showDifficulty: true,
    copy: () => ({}),
    bare: false,
    isId: false,
  }
)

const text = (value: LocaleText) => resolveLocaleText(value, props.isId)

const tableCopy = computed<Required<CpTableCopy>>(() => ({
  titleColumn: props.copy.titleColumn || { en: 'Problem Name', id: 'Judul Soal' },
  timeColumn: props.copy.timeColumn || { en: 'Solved Date', id: 'Waktu Selesai' },
  openTitle: props.copy.openTitle || {
    en: 'Open problem on platform',
    id: 'Buka soal di platform',
  },
  platformColumn: props.copy.platformColumn || { en: 'Platform', id: 'Platform' },
  statusColumn: props.copy.statusColumn || { en: 'Status', id: 'Status' },
  accepted: props.copy.accepted || { en: 'AC', id: 'AC' },
}))

const startIndex = computed(() => (props.currentPage - 1) * props.pageSize)

const defaultColumns = computed<CpColumn[]>(() => {
  const cols: CpColumn[] = [
    { key: 'category', labelEn: 'Topic / Module', labelId: 'Topik / Modul' },
  ]
  if (props.showDifficulty) {
    cols.push({ key: 'difficulty', labelEn: 'Difficulty', labelId: 'Kesulitan' })
  }
  cols.push({ key: 'language', labelEn: 'Language', labelId: 'Bahasa' })
  return cols
})

const displayColumns = computed(() => (props.columns.length ? props.columns : defaultColumns.value))

const columnClass = (key: CpColumnKey) => {
  if (key === 'difficulty') return 'diff'
  if (key === 'language') return 'lang'
  return key
}

const getItemTags = (item: SubmissionItem): string[] => {
  if (Array.isArray(item.tags) && item.tags.length > 0) {
    return item.tags
  }
  if (item.category) {
    if (item.category.includes(',')) {
      return item.category
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    }
    return [item.category.trim()]
  }
  return []
}
</script>

<style scoped>
.cp-table-wrapper.is-bare {
  background: transparent;
  border-radius: 0;
  overflow: visible;
  display: block;
}

.table-swipe-hint {
  display: none;
}

@media (max-width: 768px) {
  .table-swipe-hint {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    margin-bottom: 0.45rem;
    font-size: var(--type-xs, 0.72rem);
    color: var(--accent);
    font-weight: 600;
  }

  .swipe-icon {
    width: 0.95rem;
    height: 0.95rem;
    flex-shrink: 0;
  }
}
</style>
