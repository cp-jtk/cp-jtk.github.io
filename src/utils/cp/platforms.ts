import type { CpData, CpPlatformKey } from '../../types/cp.types'

export interface CpPlatformMeta {
  key: CpPlatformKey
  name: string
  overviewName: string
  short: string
  logo: string
  logoLight?: string
  profileUrl: (handle: string) => string
  description: string
  profileLabel: string
}

export const CP_PLATFORM_KEYS: CpPlatformKey[] = ['tlx', 'codeforces', 'leetcode']

export const CP_PLATFORMS: Record<CpPlatformKey, CpPlatformMeta> = {
  tlx: {
    key: 'tlx',
    name: 'TLX (TOKI Learning Center)',
    overviewName: 'TOKI Learning Center',
    short: 'TLX',
    logo: '/img/tlx/tlx.webp',
    profileUrl: (handle) => `https://tlx.toki.id/profiles/${handle}`,
    description: 'Platform resmi Ikatan Alumni Tim Olimpiade Komputer Indonesia (IA-TOKI) untuk latihan soal.',
    profileLabel: 'Profil TLX ↗',
  },
  codeforces: {
    key: 'codeforces',
    name: 'Codeforces',
    overviewName: 'Codeforces',
    short: 'Codeforces',
    logo: '/img/codeforces/codeforces.webp',
    profileUrl: (handle) => `https://codeforces.com/profile/${handle}`,
    description: 'Platform kompetisi algoritma global dengan kontes rutin dan rating.',
    profileLabel: 'Profil Codeforces ↗',
  },
  leetcode: {
    key: 'leetcode',
    name: 'LeetCode',
    overviewName: 'LeetCode',
    short: 'LeetCode',
    logo: '/img/leetcode/leetcode_dark.svg',
    logoLight: '/img/leetcode/leetcode.svg',
    profileUrl: (handle) => `https://leetcode.com/u/${handle}`,
    description: 'Platform latihan struktur data dan algoritma untuk persiapan teknis.',
    profileLabel: 'Profil LeetCode ↗',
  },
}

export const getPlatformLogo = (platform: string): string => CP_PLATFORMS[platform as CpPlatformKey]?.logo ?? CP_PLATFORMS.tlx.logo

export const getPlatformLogoLight = (platform: string): string | undefined => CP_PLATFORMS[platform as CpPlatformKey]?.logoLight

export const getPlatformName = (platform: string): string => CP_PLATFORMS[platform as CpPlatformKey]?.short ?? platform?.toUpperCase() ?? ''

export type PlatformCategory = {
  key: string
  label: string
  icon?: string
  iconLight?: string
}

export const buildPlatformCategories = (counts: Partial<Record<CpPlatformKey, number>> & { all?: number }, isId = true): PlatformCategory[] => [
  {
    key: 'all',
    label: `${isId ? 'Semua Platform' : 'All Platforms'} (${counts.all ?? 0})`,
  },
  ...CP_PLATFORM_KEYS.map((key) => ({
    key,
    label: `${CP_PLATFORMS[key].short} (${counts[key] ?? 0})`,
    icon: CP_PLATFORMS[key].logo,
    iconLight: CP_PLATFORMS[key].logoLight,
  })),
]

export const getPlatformHandle = (cpData: CpData | null | undefined, key: CpPlatformKey): string => {
  const platHandle = cpData?.platforms?.[key]?.handle
  if (typeof platHandle === 'string' && platHandle.trim() !== '') {
    return platHandle.trim()
  }
  const metaHandle = cpData?.meta?.handles?.[key]
  if (typeof metaHandle === 'string' && metaHandle.trim() !== '') {
    return metaHandle.trim()
  }
  return ''
}

export const isPlatformLinked = (cpData: CpData | null | undefined, key: CpPlatformKey): boolean => {
  const handle = getPlatformHandle(cpData, key)
  if (!handle) return false
  const lower = handle.toLowerCase()
  return (
    lower !== '-' &&
    lower !== '–' &&
    lower !== '—' &&
    lower !== 'unset' &&
    lower !== 'null' &&
    lower !== 'undefined' &&
    lower !== 'none' &&
    lower !== 'n/a' &&
    lower !== 'belum terhubung'
  )
}
