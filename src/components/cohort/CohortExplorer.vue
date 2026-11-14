<template>
  <div class="cohort-explorer">
    <div class="cohort-controls">
      <SearchInput
        v-model="search"
        placeholder="Cari mahasiswa, NIM, atau handle..."
        aria-label="Cari mahasiswa"
        clearable />

      <div class="cohort-filter-wrap">
        <button
          type="button"
          class="cohort-filter-trigger"
          :class="{ 'is-active': activeFilterCount > 0 }"
          :aria-expanded="isFilterOpen"
          aria-label="Filter dan urutkan daftar mahasiswa"
          @click="isFilterOpen = !isFilterOpen">
          <svg
            class="filter-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round">
            <path d="M3 6h18M7 12h10M10 18h4" />
          </svg>
          <span>Filter</span>
          <span v-if="activeFilterCount > 0" class="filter-badge">{{ activeFilterCount }}</span>
        </button>

        <div v-if="isFilterOpen" class="cohort-filter-overlay" @click="isFilterOpen = false"></div>

        <div
          v-if="isFilterOpen"
          class="cohort-filter-popover"
          role="dialog"
          aria-label="Menu Filter dan Pengurutan">
          <div class="popover-header">
            <span class="popover-title">Filter & Urutkan</span>
            <button v-if="isFiltered" type="button" class="popover-reset" @click="reset">
              Reset
            </button>
          </div>

          <div class="popover-section">
            <span class="popover-section-label">Urutkan</span>
            <div class="popover-list">
              <button
                v-for="opt in sortOptions"
                :key="opt.key"
                type="button"
                class="popover-item"
                :class="{ 'is-selected': sortKey === opt.key && sortDir === opt.dir }"
                @click="applyPopoverSort(opt)">
                <span class="item-check" aria-hidden="true">{{
                  sortKey === opt.key && sortDir === opt.dir ? '✓' : ''
                }}</span>
                <span class="item-label">{{ opt.label }}</span>
              </button>
            </div>
          </div>

          <div class="popover-divider"></div>

          <div class="popover-section">
            <span class="popover-section-label">Program Studi</span>
            <div class="popover-list">
              <label class="popover-checkbox-item">
                <input
                  type="checkbox"
                  class="cohort-checkbox"
                  :checked="isAllProdiSelected"
                  .indeterminate="!isAllProdiSelected && selectedProdi.length > 0"
                  @change="toggleSelectAllProdi" />
                <span class="item-label">Semua prodi</span>
              </label>

              <label v-for="p in availableProdi" :key="p" class="popover-checkbox-item">
                <input
                  type="checkbox"
                  class="cohort-checkbox"
                  :checked="selectedProdi.includes(p)"
                  @change="toggleProdi(p)" />
                <span class="item-label">{{ prodiLabels[p] || p }}</span>
              </label>
            </div>
          </div>

          <div class="popover-divider"></div>

          <div class="popover-section">
            <span class="popover-section-label">Tingkat</span>
            <div class="popover-list">
              <label class="popover-checkbox-item">
                <input
                  type="checkbox"
                  class="cohort-checkbox"
                  :checked="isAllTingkatSelected"
                  .indeterminate="!isAllTingkatSelected && selectedTingkat.length > 0"
                  @change="toggleSelectAllTingkat" />
                <span class="item-label">Semua tingkat</span>
              </label>

              <label v-for="t in availableTingkat" :key="t" class="popover-checkbox-item">
                <input
                  type="checkbox"
                  class="cohort-checkbox"
                  :checked="selectedTingkat.includes(t)"
                  @change="toggleTingkat(t)" />
                <span class="item-label">{{ tingkatLabels[t] || t }}</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>

    <p class="cohort-count">
      Menampilkan {{ filtered.length }} dari {{ students.length }} mahasiswa
    </p>

    <div v-if="filtered.length > 0" class="cohort-table-wrap">
      <table class="cohort-table">
        <thead>
          <tr>
            <th
              class="col-student col-sortable"
              :class="{ 'is-sorted': sortKey === 'nama' }"
              :aria-sort="
                sortKey === 'nama' ?
                  sortDir === 'asc' ?
                    'ascending'
                  : 'descending'
                : 'none'
              "
              tabindex="0"
              role="columnheader"
              @click="handleSort('nama')"
              @keydown.enter="handleSort('nama')"
              @keydown.space.prevent="handleSort('nama')">
              <div class="th-sort-content">
                <span>Mahasiswa</span>
                <span class="sort-icon-wrap" aria-hidden="true">
                  <svg
                    v-if="sortKey === 'nama' && sortDir === 'asc'"
                    class="sort-icon is-active"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5">
                    <path d="M18 15l-6-6-6 6" />
                  </svg>
                  <svg
                    v-else-if="sortKey === 'nama' && sortDir === 'desc'"
                    class="sort-icon is-active"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                  <svg
                    v-else
                    class="sort-icon is-inactive"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2">
                    <path d="M8 9l4-4 4 4M16 15l-4 4-4-4" />
                  </svg>
                </span>
              </div>
            </th>

            <th
              class="col-kelas col-sortable"
              :class="{ 'is-sorted': sortKey === 'kelas' }"
              :aria-sort="
                sortKey === 'kelas' ?
                  sortDir === 'asc' ?
                    'ascending'
                  : 'descending'
                : 'none'
              "
              tabindex="0"
              role="columnheader"
              @click="handleSort('kelas')"
              @keydown.enter="handleSort('kelas')"
              @keydown.space.prevent="handleSort('kelas')">
              <div class="th-sort-content">
                <span>Kelas</span>
                <span class="sort-icon-wrap" aria-hidden="true">
                  <svg
                    v-if="sortKey === 'kelas' && sortDir === 'asc'"
                    class="sort-icon is-active"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5">
                    <path d="M18 15l-6-6-6 6" />
                  </svg>
                  <svg
                    v-else-if="sortKey === 'kelas' && sortDir === 'desc'"
                    class="sort-icon is-active"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                  <svg
                    v-else
                    class="sort-icon is-inactive"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2">
                    <path d="M8 9l4-4 4 4M16 15l-4 4-4-4" />
                  </svg>
                </span>
              </div>
            </th>

            <th
              v-for="key in platformKeys"
              :key="key"
              class="col-platform col-sortable"
              :class="{ 'is-sorted': sortKey === key }"
              :aria-sort="
                sortKey === key ?
                  sortDir === 'asc' ?
                    'ascending'
                  : 'descending'
                : 'none'
              "
              tabindex="0"
              role="columnheader"
              @click="handleSort(key)"
              @keydown.enter="handleSort(key)"
              @keydown.space.prevent="handleSort(key)">
              <div class="th-sort-content">
                <span class="platform-head">
                  <template v-if="CP_PLATFORMS[key].logoLight">
                    <img
                      :src="CP_PLATFORMS[key].logo"
                      alt=""
                      class="platform-logo logo-variant-dark" />
                    <img
                      :src="CP_PLATFORMS[key].logoLight"
                      alt=""
                      class="platform-logo logo-variant-light" />
                  </template>
                  <img v-else :src="CP_PLATFORMS[key].logo" alt="" class="platform-logo" />
                  {{ CP_PLATFORMS[key].short }}
                </span>
                <span class="sort-icon-wrap" aria-hidden="true">
                  <svg
                    v-if="sortKey === key && sortDir === 'asc'"
                    class="sort-icon is-active"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5">
                    <path d="M18 15l-6-6-6 6" />
                  </svg>
                  <svg
                    v-else-if="sortKey === key && sortDir === 'desc'"
                    class="sort-icon is-active"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                  <svg
                    v-else
                    class="sort-icon is-inactive"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2">
                    <path d="M8 9l4-4 4 4M16 15l-4 4-4-4" />
                  </svg>
                </span>
              </div>
            </th>

            <th
              class="col-total col-sortable"
              :class="{ 'is-sorted': sortKey === 'totalSolved' }"
              :aria-sort="
                sortKey === 'totalSolved' ?
                  sortDir === 'asc' ?
                    'ascending'
                  : 'descending'
                : 'none'
              "
              tabindex="0"
              role="columnheader"
              @click="handleSort('totalSolved')"
              @keydown.enter="handleSort('totalSolved')"
              @keydown.space.prevent="handleSort('totalSolved')">
              <div class="th-sort-content">
                <span>Total Solved</span>
                <span class="sort-icon-wrap" aria-hidden="true">
                  <svg
                    v-if="sortKey === 'totalSolved' && sortDir === 'asc'"
                    class="sort-icon is-active"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5">
                    <path d="M18 15l-6-6-6 6" />
                  </svg>
                  <svg
                    v-else-if="sortKey === 'totalSolved' && sortDir === 'desc'"
                    class="sort-icon is-active"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                  <svg
                    v-else
                    class="sort-icon is-inactive"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2">
                    <path d="M8 9l4-4 4 4M16 15l-4 4-4-4" />
                  </svg>
                </span>
              </div>
            </th>

            <th
              class="col-last-submission col-sortable"
              :class="{ 'is-sorted': sortKey === 'lastSolvedAt' }"
              :aria-sort="
                sortKey === 'lastSolvedAt' ?
                  sortDir === 'asc' ?
                    'ascending'
                  : 'descending'
                : 'none'
              "
              tabindex="0"
              role="columnheader"
              @click="handleSort('lastSolvedAt')"
              @keydown.enter="handleSort('lastSolvedAt')"
              @keydown.space.prevent="handleSort('lastSolvedAt')">
              <div class="th-sort-content">
                <span>Last Submission</span>
                <span class="sort-icon-wrap" aria-hidden="true">
                  <svg
                    v-if="sortKey === 'lastSolvedAt' && sortDir === 'asc'"
                    class="sort-icon is-active"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5">
                    <path d="M18 15l-6-6-6 6" />
                  </svg>
                  <svg
                    v-else-if="sortKey === 'lastSolvedAt' && sortDir === 'desc'"
                    class="sort-icon is-active"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                  <svg
                    v-else
                    class="sort-icon is-inactive"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2">
                    <path d="M8 9l4-4 4 4M16 15l-4 4-4-4" />
                  </svg>
                </span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="student in filtered" :key="student.nim">
            <td class="cell-student">
              <a :href="`/students/${student.nim}/`" class="student-link" :title="student.nama">
                <span class="student-name-row">
                  <ExternalLinkIcon class="student-link-icon" />
                  <span class="student-name">{{ student.nama }}</span>
                </span>
              </a>
            </td>

            <td class="cell-kelas">
              <span class="student-meta">{{ getStudentKelas(student) }}</span>
            </td>

            <td v-for="key in platformKeys" :key="key" class="cell-platform">
              <template v-if="student.platforms[key].handle">
                <span class="platform-solved">
                  {{ formatNumber(student.platforms[key].solved) }}
                </span>
                <span class="platform-handle">@{{ student.platforms[key].handle }}</span>
              </template>
              <span v-else class="platform-empty">—</span>
            </td>

            <td class="cell-total">{{ formatNumber(student.totalSolved) }}</td>

            <td class="cell-last-submission">
              {{ formatDate(student.lastSolvedAt) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="filtered.length > 0" class="cohort-swipe-hint">
      <svg
        class="swipe-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round">
        <path d="M15 6l-6 6 6 6" />
      </svg>
      <span>Geser untuk melihat seluruh tabel</span>
    </div>

    <div v-else class="cohort-empty">
      <p>Tidak ada mahasiswa yang cocok dengan pencarian.</p>
      <button type="button" class="cohort-reset" @click="reset">Reset filter</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import SearchInput from '../shared/SearchInput.vue'
import ExternalLinkIcon from '../shared/ExternalLinkIcon.vue'
import { CP_PLATFORMS, CP_PLATFORM_KEYS } from '../../utils/cp/platforms'
import type { StudentSummary } from '../../types/student.types'

const props = defineProps<{
  students: StudentSummary[]
}>()

const platformKeys = [...CP_PLATFORM_KEYS]
const search = ref('')

type SortKey = 'nama' | 'kelas' | 'tlx' | 'codeforces' | 'leetcode' | 'totalSolved' | 'lastSolvedAt'
type SortDir = 'asc' | 'desc'

const sortKey = ref<SortKey>('nama')
const sortDir = ref<SortDir>('asc')
const isFilterOpen = ref(false)

const sortOptions = [
  { key: 'nama' as const, dir: 'asc' as const, label: 'Nama (A-Z)' },
  { key: 'kelas' as const, dir: 'asc' as const, label: 'Kelas (Rombel)' },
  { key: 'totalSolved' as const, dir: 'desc' as const, label: 'Solved terbanyak' },
  { key: 'lastSolvedAt' as const, dir: 'desc' as const, label: 'Submisi terbaru' },
]

function handleSort(key: SortKey) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = key === 'nama' || key === 'kelas' ? 'asc' : 'desc'
  }
}

function applyPopoverSort(opt: (typeof sortOptions)[number]) {
  sortKey.value = opt.key
  sortDir.value = opt.dir
}

const prodiLabels: Record<string, string> = {
  D4: 'D4 Teknik Informatika',
  D3: 'D3 Teknik Informatika',
}

const tingkatLabels: Record<string, string> = {
  '1': 'Tingkat 1',
  '2': 'Tingkat 2',
  '3': 'Tingkat 3',
  '4': 'Tingkat 4',
  alumni: 'Alumni',
}

function parseStudentAcademic(student: { nim: string; kelas: string; aktif: boolean }) {
  const isD3 = student.kelas.toUpperCase().includes('D3') || student.nim.slice(4, 6) === '11'
  const prodi = isD3 ? 'D3' : 'D4'

  if (student.aktif === false || student.kelas.toLowerCase().includes('alumni')) {
    return { prodi, tingkat: 'alumni' }
  }

  const match = student.kelas.match(/^(\d+)/)
  if (match) {
    const num = match[1]
    if (['1', '2', '3', '4'].includes(num)) {
      return { prodi, tingkat: num }
    }
  }

  return { prodi, tingkat: 'alumni' }
}

const availableProdi = computed(() => {
  const prodis = new Set(props.students.map((s) => parseStudentAcademic(s).prodi))
  return (['D4', 'D3'] as const).filter((p) => prodis.has(p))
})

const availableTingkat = computed(() => {
  const tingkats = new Set(props.students.map((s) => parseStudentAcademic(s).tingkat))
  const order = ['1', '2', '3', '4', 'alumni'] as const
  return order.filter((t) => tingkats.has(t))
})

const selectedProdi = ref<string[]>([...availableProdi.value])
const selectedTingkat = ref<string[]>([...availableTingkat.value])

const isAllProdiSelected = computed(
  () => selectedProdi.value.length === availableProdi.value.length
)

const isAllTingkatSelected = computed(
  () => selectedTingkat.value.length === availableTingkat.value.length
)

const toggleSelectAllProdi = () => {
  if (isAllProdiSelected.value) {
    selectedProdi.value = []
  } else {
    selectedProdi.value = [...availableProdi.value]
  }
}

const toggleProdi = (p: string) => {
  const idx = selectedProdi.value.indexOf(p)
  if (idx === -1) {
    selectedProdi.value.push(p)
  } else {
    selectedProdi.value.splice(idx, 1)
  }
}

const toggleSelectAllTingkat = () => {
  if (isAllTingkatSelected.value) {
    selectedTingkat.value = []
  } else {
    selectedTingkat.value = [...availableTingkat.value]
  }
}

const toggleTingkat = (t: string) => {
  const idx = selectedTingkat.value.indexOf(t)
  if (idx === -1) {
    selectedTingkat.value.push(t)
  } else {
    selectedTingkat.value.splice(idx, 1)
  }
}

function getStudentKelas(student: StudentSummary): string {
  const { prodi, tingkat } = parseStudentAcademic(student)
  if (tingkat === 'alumni') {
    const angkatan = student.nim.slice(0, 2)
    const rombel = student.kelasHuruf || student.kelas.replace(/[^A-Za-z]/g, '') || 'A'
    return `Alumni ${angkatan}, Kelas ${rombel}-${prodi}`
  }
  return student.kelas
}

const activeFilterCount = computed(() => {
  let count = 0
  if (!isAllProdiSelected.value) count++
  if (!isAllTingkatSelected.value) count++
  if (sortKey.value !== 'nama' || sortDir.value !== 'asc') count++
  return count
})

const isFiltered = computed(
  () =>
    search.value.trim().length > 0 ||
    !isAllProdiSelected.value ||
    !isAllTingkatSelected.value ||
    sortKey.value !== 'nama' ||
    sortDir.value !== 'asc'
)

const filtered = computed(() => {
  const term = search.value.trim().toLowerCase()

  return props.students
    .filter((student) => {
      const { prodi, tingkat } = parseStudentAcademic(student)
      if (!selectedProdi.value.includes(prodi)) return false
      if (!selectedTingkat.value.includes(tingkat)) return false
      if (!term) return true

      const haystack = [
        student.nama,
        student.nim,
        student.kelas,
        student.kelasHuruf,
        getStudentKelas(student),
        prodi,
        prodiLabels[prodi] || '',
        tingkatLabels[tingkat] || '',
        ...platformKeys.map((key) => student.platforms[key].handle || ''),
      ]
        .join(' ')
        .toLowerCase()

      return haystack.includes(term)
    })
    .sort((a, b) => {
      let diff = 0
      if (sortKey.value === 'nama') {
        diff = a.nama.localeCompare(b.nama, 'id')
      } else if (sortKey.value === 'kelas') {
        const aMeta = getStudentKelas(a)
        const bMeta = getStudentKelas(b)
        diff = aMeta.localeCompare(bMeta, 'id') || a.nama.localeCompare(b.nama, 'id')
      } else if (sortKey.value === 'tlx') {
        const aVal = a.platforms.tlx?.handle ? (a.platforms.tlx?.solved ?? 0) : -1
        const bVal = b.platforms.tlx?.handle ? (b.platforms.tlx?.solved ?? 0) : -1
        diff = aVal - bVal
      } else if (sortKey.value === 'codeforces') {
        const aVal = a.platforms.codeforces?.handle ? (a.platforms.codeforces?.solved ?? 0) : -1
        const bVal = b.platforms.codeforces?.handle ? (b.platforms.codeforces?.solved ?? 0) : -1
        diff = aVal - bVal
      } else if (sortKey.value === 'leetcode') {
        const aVal = a.platforms.leetcode?.handle ? (a.platforms.leetcode?.solved ?? 0) : -1
        const bVal = b.platforms.leetcode?.handle ? (b.platforms.leetcode?.solved ?? 0) : -1
        diff = aVal - bVal
      } else if (sortKey.value === 'totalSolved') {
        diff = a.totalSolved - b.totalSolved
      } else if (sortKey.value === 'lastSolvedAt') {
        const aTime = a.lastSolvedAt ? new Date(a.lastSolvedAt).getTime() : 0
        const bTime = b.lastSolvedAt ? new Date(b.lastSolvedAt).getTime() : 0
        diff = aTime - bTime
      }

      if (sortDir.value === 'desc') {
        diff = -diff
      }

      return diff || a.nama.localeCompare(b.nama, 'id')
    })
})

const formatNumber = (value: number): string => new Intl.NumberFormat('id-ID').format(value)

const formatDate = (value?: string | null): string => {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  })
}

const reset = () => {
  search.value = ''
  selectedProdi.value = [...availableProdi.value]
  selectedTingkat.value = [...availableTingkat.value]
  sortKey.value = 'nama'
  sortDir.value = 'asc'
}
</script>

<style scoped>
.cohort-explorer {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

.cohort-controls {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0.75rem;
}

.cohort-controls :deep(.search-input-wrap) {
  flex: 1 1 260px;
  min-width: 220px;
}

.cohort-filter-wrap {
  position: relative;
  display: inline-flex;
}

.cohort-filter-trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  height: 2.5rem;
  padding: 0 0.95rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-elevated);
  color: var(--text);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease;
}

.cohort-filter-trigger:hover {
  background: var(--bg-soft);
  border-color: var(--muted);
}

.cohort-filter-trigger:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.filter-icon {
  width: 1.05rem;
  height: 1.05rem;
  flex-shrink: 0;
}

.filter-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.15rem;
  height: 1.15rem;
  border-radius: 9999px;
  background: var(--accent);
  color: var(--accent-contrast, var(--bg));
  font-size: 0.65rem;
  font-weight: 700;
  line-height: 1;
}

.cohort-filter-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: transparent;
}

.cohort-filter-popover {
  position: absolute;
  top: calc(100% + 0.4rem);
  right: 0;
  z-index: 101;
  width: 240px;
  padding: 0.65rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  background: var(--bg-soft);
  box-shadow:
    0 12px 30px -4px rgba(0, 0, 0, 0.4),
    0 4px 12px -2px rgba(0, 0, 0, 0.2);
  animation: popoverFadeIn 0.15s ease-out;
}

@keyframes popoverFadeIn {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.popover-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.4rem;
  padding: 0.25rem 0.35rem 0.4rem;
  border-bottom: 1px solid var(--border);
}

.popover-title {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text);
}

.popover-reset {
  background: none;
  border: none;
  color: var(--accent);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}

.popover-reset:hover {
  text-decoration: underline;
}

.popover-section {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.popover-section-label {
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted);
  padding: 0.2rem 0.4rem;
}

.popover-list {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.popover-checkbox-item {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  width: 100%;
  padding: 0.35rem 0.5rem;
  border-radius: var(--radius-md);
  color: var(--text);
  font-size: 0.8rem;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s ease;
}

.popover-checkbox-item:hover {
  background: var(--bg-elevated);
}

.cohort-checkbox {
  appearance: auto;
  accent-color: var(--accent);
  width: 1rem;
  height: 1rem;
  cursor: pointer;
  margin: 0;
  flex-shrink: 0;
}

.popover-item {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  width: 100%;
  padding: 0.4rem 0.5rem;
  border-radius: var(--radius-md);
  background: none;
  border: none;
  color: var(--muted);
  font-size: 0.8rem;
  text-align: left;
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.popover-item:hover {
  background: var(--bg-elevated);
  color: var(--text);
}

.popover-item.is-selected {
  color: var(--text);
  font-weight: 600;
  background: color-mix(in srgb, var(--accent) 12%, transparent);
}

.item-check {
  width: 0.85rem;
  font-weight: 800;
  color: var(--accent);
  font-size: 0.75rem;
  text-align: center;
  flex-shrink: 0;
}

.item-label {
  flex: 1;
}

.popover-divider {
  height: 1px;
  background: var(--border);
  margin: 0.4rem 0;
}

.cohort-reset {
  height: 2.5rem;
  padding: 0 0.85rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg-soft);
  color: var(--text);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease;
}

.cohort-reset:hover {
  background: var(--bg-elevated);
  border-color: var(--muted);
}

.cohort-count {
  margin: 0;
  font-size: 0.78rem;
  color: var(--muted);
}

.cohort-table-wrap {
  width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  background: var(--bg-soft);
  scrollbar-width: thin;
  scrollbar-color: var(--border-strong, #94a3b8) var(--bg-soft);
}

.cohort-table-wrap::-webkit-scrollbar {
  height: 8px;
  display: block;
}

.cohort-table-wrap::-webkit-scrollbar-track {
  background: var(--bg-soft);
  border-radius: 999px;
  margin: 0 0.5rem;
}

.cohort-table-wrap::-webkit-scrollbar-thumb {
  background: var(--border-strong, #94a3b8);
  border-radius: 999px;
  border: 2px solid var(--bg-soft);
}

.cohort-table-wrap::-webkit-scrollbar-thumb:hover {
  background: var(--muted);
}

.cohort-table {
  width: 100%;
  min-width: 960px;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.82rem;
}

.cohort-table th {
  padding: 0.85rem 1rem;
  border-bottom: 1px solid var(--border);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted);
  white-space: nowrap;
}

.col-sortable {
  cursor: pointer;
  user-select: none;
  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.col-sortable:hover {
  background: var(--bg-elevated);
  color: var(--text);
}

.col-sortable:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: -2px;
}

.col-sortable.is-sorted {
  color: var(--text);
}

.th-sort-content {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.sort-icon-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 0.85rem;
  height: 0.85rem;
  flex-shrink: 0;
}

.sort-icon {
  width: 0.85rem;
  height: 0.85rem;
}

.sort-icon.is-active {
  color: var(--accent);
}

.sort-icon.is-inactive {
  opacity: 0.35;
  color: var(--muted);
  transition: opacity 0.15s ease;
}

.col-sortable:hover .sort-icon.is-inactive {
  opacity: 0.75;
}

.cohort-table td {
  padding: 0.9rem 1rem;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}

.cohort-table tbody tr:last-child td {
  border-bottom: none;
}

.cohort-table tbody tr:hover {
  background: var(--bg-elevated);
}

.col-student {
  width: 23%;
}

.col-kelas {
  width: 15%;
}

.col-platform {
  width: 13%;
}

.col-total {
  width: 10%;
}

.col-last-submission {
  width: 13%;
}

.student-link {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  color: var(--text);
  text-decoration: none;
}

.student-name-row {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  min-width: 0;
  max-width: 100%;
}

.student-link-icon {
  width: 0.85rem;
  height: 0.85rem;
  flex-shrink: 0;
  color: var(--muted);
  transition:
    color 0.15s ease,
    transform 0.15s ease;
}

.student-link:hover .student-link-icon {
  color: var(--accent);
  transform: translate(1px, -1px);
}

.student-link:hover .student-name {
  text-decoration: underline;
  color: var(--accent);
}

.student-name {
  font-size: 0.9rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 155px;
  display: inline-block;
  vertical-align: middle;
}

@media (min-width: 1024px) {
  .student-name {
    max-width: 200px;
  }
}

.cell-kelas {
  white-space: nowrap;
}

.cell-kelas .student-meta {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--muted);
}

.platform-head {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.platform-logo {
  width: 0.95rem;
  height: 0.95rem;
  object-fit: contain;
  flex-shrink: 0;
}

.cell-platform {
  white-space: nowrap;
}

.platform-solved {
  display: block;
  font-size: 1.05rem;
  font-weight: 800;
  line-height: 1.2;
  color: var(--text);
}

.platform-handle {
  display: block;
  font-size: 0.7rem;
  color: var(--muted);
}

.platform-empty {
  font-size: 0.85rem;
  color: var(--muted);
}

.cell-total {
  font-size: 1.1rem;
  font-weight: 800;
  color: var(--text);
}

.cell-last-submission {
  white-space: nowrap;
  font-size: 0.8rem;
  color: var(--muted);
}

.cohort-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 3rem 1.5rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  background: var(--bg-soft);
  text-align: center;
  color: var(--muted);
}

.cohort-empty p {
  margin: 0;
}

.cohort-swipe-hint {
  display: none;
}

@media (max-width: 768px) {
  .cohort-table-wrap {
    overflow-x: scroll;
    padding-bottom: 4px;
    box-shadow: inset -12px 0 10px -10px rgba(0, 0, 0, 0.2);
  }

  .cohort-table-wrap::-webkit-scrollbar {
    height: 8px;
    display: block;
  }

  .cohort-table-wrap::-webkit-scrollbar-thumb {
    background: color-mix(in srgb, var(--accent) 65%, var(--muted));
    border-radius: 999px;
  }

  .student-name {
    max-width: 135px;
  }

  .cohort-swipe-hint {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    margin-top: 0.5rem;
    font-size: 0.72rem;
    color: var(--muted);
    opacity: 0.8;
  }

  .swipe-icon {
    width: 0.9rem;
    height: 0.9rem;
    flex-shrink: 0;
  }
}

@media (max-width: 640px) {
  .cohort-controls {
    align-items: stretch;
  }

  .cohort-controls :deep(.search-input-wrap) {
    flex-basis: 100%;
  }

  .cohort-filter-wrap {
    flex: 1;
  }

  .cohort-filter-trigger {
    width: 100%;
    justify-content: center;
  }

  .cohort-filter-popover {
    right: 0;
    left: 0;
    width: auto;
    min-width: unset;
  }
}
</style>
