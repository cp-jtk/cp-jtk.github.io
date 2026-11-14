<template>
  <div class="overview-tab">
    <div class="platform-cards-grid">
      <PlatformCard
        v-if="isLinked('tlx')"
        name="TLX (TOKI)"
        :handle="platformHandle('tlx')"
        :logo="CP_PLATFORMS.tlx.logo"
        :solvedNum="totalTlxSolved"
        solvedLabel="solved"
        footerText="Buka profil TLX ↗"
        :url="platformProfileUrl('tlx')">
        <MetaRow label="Total Submissions:">
          <strong>{{ cpData?.platforms?.tlx?.totalSubmissions ?? 0 }}</strong>
        </MetaRow>
        <MetaRow label="Accepted Submissions:">
          <strong>{{ cpData?.platforms?.tlx?.totalAcSubmissions ?? 0 }}</strong>
        </MetaRow>
      </PlatformCard>

      <PlatformCard
        v-if="isLinked('codeforces')"
        name="Codeforces"
        :handle="platformHandle('codeforces')"
        :logo="CP_PLATFORMS.codeforces.logo"
        :solvedNum="cpData?.platforms?.codeforces?.rating ?? 0"
        solvedLabel="rating"
        footerText="Buka profil Codeforces ↗"
        :url="platformProfileUrl('codeforces')">
        <MetaRow label="Problems Solved:">
          <strong>{{ totalCfSolved }}</strong>
        </MetaRow>
        <MetaRow label="Rank:">
          <strong class="cf-rank-text capitalize">{{
            cpData?.platforms?.codeforces?.rank || 'unrated'
          }}</strong>
        </MetaRow>
      </PlatformCard>

      <PlatformCard
        v-if="isLinked('leetcode')"
        name="LeetCode"
        :handle="platformHandle('leetcode')"
        :logo="CP_PLATFORMS.leetcode.logo"
        :logoLight="CP_PLATFORMS.leetcode.logoLight"
        :solvedNum="totalLcSolved"
        solvedLabel="solved"
        footerText="Buka profil LeetCode ↗"
        :url="platformProfileUrl('leetcode')">
        <MetaRow label="Difficulty Breakdown:">
          <span class="diff-split">
            <span class="diff-cnt easy">{{ cpData?.platforms?.leetcode?.easySolved ?? 0 }}E</span>
            ·
            <span class="diff-cnt medium"
              >{{ cpData?.platforms?.leetcode?.mediumSolved ?? 0 }}M</span
            >
            ·
            <span class="diff-cnt hard">{{ cpData?.platforms?.leetcode?.hardSolved ?? 0 }}H</span>
          </span>
        </MetaRow>
        <MetaRow label="Global Ranking:">
          <strong>{{ leetcodeRanking }}</strong>
        </MetaRow>
      </PlatformCard>
    </div>

    <div class="feed-section">
      <div class="feed-header">
        <div>
          <h3>Soal yang diselesaikan</h3>
          <p class="feed-subtitle">
            Aktivitas penyelesaian soal lintas platform secara kronologis.
          </p>
        </div>

        <div class="feed-controls">
          <SearchInput
            v-model="searchTerm"
            placeholder="Cari judul soal, topik, atau bahasa..."
            surface="soft"
            clearable
            @input="currentPage = 1" />

          <FilterDropdown
            v-model="selectedCategories"
            :categories="platformCategories"
            locale="id"
            itemType="platform"
            @update:modelValue="currentPage = 1" />
        </div>
      </div>

      <div v-if="filteredFeed.length > 0" class="feed-table-card">
        <CpProblemsTable
          :problems="paginatedFeed"
          :currentPage="currentPage"
          :pageSize="pageSize"
          :isId="true" />

        <CpTablePagination
          v-model:currentPage="currentPage"
          :totalPages="totalPages"
          :pageSize="pageSize"
          :totalItems="filteredFeed.length"
          :isId="true" />
      </div>

      <div v-else class="empty-feed">
        <p>Belum ada soal yang cocok dengan filter pencarian.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import FilterDropdown from '../shared/FilterDropdown.vue'
import SearchInput from '../shared/SearchInput.vue'
import CpTablePagination from './CpTablePagination.vue'
import CpProblemsTable from './CpProblemsTable.vue'
import PlatformCard from '../shared/PlatformCard.vue'
import MetaRow from '../shared/MetaRow.vue'
import { useListFilter } from '../../composables/useListFilter'
import { usePagination } from '../../composables/usePagination'
import {
  CP_PLATFORMS,
  CP_PLATFORM_KEYS,
  buildPlatformCategories,
  isPlatformLinked,
  getPlatformHandle,
} from '../../utils/cp/platforms'
import { matchesProblemSearch } from '../../utils/cp/search'
import type { CpData, CpPlatformKey, SubmissionItem } from '../../types/cp.types'

const props = withDefaults(
  defineProps<{
    cpData: CpData
    totalTlxSolved?: number
    totalCfSolved?: number
    totalLcSolved?: number
    isId?: boolean
    locale?: 'en' | 'id'
  }>(),
  {
    totalTlxSolved: 0,
    totalCfSolved: 0,
    totalLcSolved: 0,
    isId: true,
    locale: 'id',
  }
)

defineEmits<{ (e: 'selectPlatform', platform: CpPlatformKey): void }>()

const isLinked = (key: CpPlatformKey): boolean => isPlatformLinked(props.cpData, key)

const platformHandle = (key: CpPlatformKey): string => getPlatformHandle(props.cpData, key)

const platformProfileUrl = (key: CpPlatformKey): string => {
  const handle = platformHandle(key)
  return handle ? CP_PLATFORMS[key].profileUrl(handle) : '#'
}

const leetcodeRanking = computed(() => {
  const ranking = props.cpData?.platforms?.leetcode?.ranking ?? 0
  return ranking > 0 ? `~${ranking.toLocaleString('id-ID')}` : '—'
})

const totalAllSolved = computed(() => {
  return (
    props.cpData?.overview?.totalSolved ??
    props.totalTlxSolved + props.totalCfSolved + props.totalLcSolved
  )
})

const allPlatformKeys = [...CP_PLATFORM_KEYS]

const platformCategories = computed(() =>
  buildPlatformCategories(
    {
      all: totalAllSolved.value,
      tlx: props.totalTlxSolved,
      codeforces: props.totalCfSolved,
      leetcode: props.totalLcSolved,
    },
    true
  )
)

const allRecentFeed = computed<SubmissionItem[]>(() => props.cpData?.recentGlobalFeed || [])

const {
  searchTerm,
  selectedCategories,
  filteredItems: filteredFeed,
} = useListFilter<SubmissionItem>({
  items: () => allRecentFeed.value,
  categories: () => allPlatformKeys.map((key) => ({ key })),
  getCategory: (item) => item.platform as string,
  matchesSearch: matchesProblemSearch,
})

const {
  currentPage,
  pageSize,
  totalPages,
  paginatedList: paginatedFeed,
} = usePagination(() => filteredFeed.value)
</script>

<style scoped>
.overview-tab {
  display: flex;
  flex-direction: column;
}

.diff-split {
  font-weight: 700;
}

.diff-cnt.easy {
  color: var(--color-success);
}
.diff-cnt.medium {
  color: var(--color-warning);
}
.diff-cnt.hard {
  color: var(--color-danger);
}

.cf-rank-text {
  color: var(--color-info);
}

:root.light .diff-cnt.easy {
  color: var(--color-success-strong);
  font-weight: 700;
}
:root.light .diff-cnt.medium {
  color: var(--color-warning-strong);
  font-weight: 700;
}
:root.light .diff-cnt.hard {
  color: var(--color-danger-strong);
  font-weight: 700;
}

.platform-cards-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.25rem;
}

:deep(.platform-detail-card) {
  min-width: 0;
}

@media (max-width: 1023px) {
  .platform-cards-grid {
    gap: 0.75rem;
  }

  :deep(.platform-detail-card) {
    padding: 1.15rem;
  }
}

@media (max-width: 639px) {
  .platform-cards-grid {
    grid-template-columns: minmax(0, 1fr);
    gap: 1rem;
  }
}

.feed-section {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin-top: 3.5rem;
  min-width: 0;
}

.feed-table-card {
  display: flex;
  flex-direction: column;
  background: var(--bg-soft);
  border: none;
  border-radius: var(--radius-2xl);
  overflow: hidden;
}

.feed-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.feed-header h3 {
  font-size: var(--type-lg);
  font-weight: 700;
  margin: 0;
  color: var(--text);
}

.feed-subtitle {
  font-size: var(--type-sm);
  color: var(--muted);
  margin: 0.2rem 0 0 0;
}

.feed-controls {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.75rem;
  width: 100%;
}

.empty-feed {
  padding: 3rem 1.5rem;
  border-radius: var(--radius-2xl);
  background: var(--bg-soft);
  text-align: center;
  color: var(--muted);
  font-size: var(--type-base);
}

@media (max-width: 640px) {
  .feed-section {
    margin-top: 2rem;
  }

  .feed-controls {
    flex-direction: row;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
  }

  .feed-controls .search-input-wrap {
    max-width: none;
    flex: 1;
  }
}
</style>
