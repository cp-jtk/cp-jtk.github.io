import type { HeatmapDay } from '../utils/heatmap'
import type { LocaleText } from '../utils/i18n'

export type CpPlatformKey = 'tlx' | 'codeforces' | 'leetcode'

export type CpPlatformCopy = {
  solvedTitle: LocaleText
  titleColumn?: LocaleText
  itemNoun?: LocaleText
  openTitle?: LocaleText
}

export type CpTableCopy = {
  titleColumn: LocaleText
  timeColumn: LocaleText
  openTitle: LocaleText
  platformColumn?: LocaleText
  statusColumn?: LocaleText
  accepted?: LocaleText
}

export type CpColumnKey = 'category' | 'difficulty' | 'language'

export interface CpColumn {
  key: CpColumnKey
  labelEn: string
  labelId: string
}

export interface CpMetric {
  label: string
  value: string | number
  sub?: string
  subPrefix?: string
  subHighlight?: string
}

export interface CpOverview {
  totalSolved?: number
  totalSubmissions?: number
  activePlatforms?: number
  topLanguage?: { name: string; count: number }
  primaryLanguage?: { name: string; count: number }
  lastSynced?: string
  heatmap?: Record<string, { count?: number; tries?: number; ac?: number } | number>
}

export interface CpRecentSolved {
  id?: string | number
  title?: string
  url?: string
  platform?: CpPlatformKey | string
  category?: string
  difficulty?: string | number
  language?: string
  solvedAt?: string
}

export interface CpPlatformProfile {
  handle?: string
  url?: string
  totalSolved?: number
  totalSubmissions?: number
  totalAcSubmissions?: number
  uniqueProblemsSolved?: number
  rating?: number
  maxRating?: number
  rank?: string
  maxRank?: string
  ranking?: number
  contestsCount?: number
  easySolved?: number
  mediumSolved?: number
  hardSolved?: number
  languages?: Record<string, number>
  tagsCount?: Record<string, number>
  ratingDistribution?: Record<string, number>
  dailyCalendar?: Record<string, { tries?: number; ac?: number }>
  recentSolved?: CpRecentSolved[]
}

export interface SubmissionItem {
  id?: string | number
  title: string
  url?: string
  platform?: CpPlatformKey | string
  category?: string
  tags?: string[]
  difficulty?: string | number
  language?: string
  status?: string
  solvedAt?: string
}

export interface CpHeatmapDay extends HeatmapDay {
  tries: number
  ac: number
}

export interface CpDataMeta {
  updatedAt?: string
  version?: string
  studentNim?: string
  handles?: Partial<Record<CpPlatformKey, string | null>>
}

export interface CpData {
  meta?: CpDataMeta
  overview?: CpOverview
  platforms?: Partial<Record<CpPlatformKey, CpPlatformProfile>>
  recentGlobalFeed?: SubmissionItem[]
  totalSubmissionsInHeatmap?: number
}
