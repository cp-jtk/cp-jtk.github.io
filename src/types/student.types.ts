import type { CpData, CpPlatformKey } from './cp.types'

export type StudentPlatformKey = CpPlatformKey

export interface StudentRoster {
  nim: string
  nama: string
  kelasHuruf: string
  kelas: string
  aktif: boolean
  platforms: Record<StudentPlatformKey, string | null>
}

export interface StudentPlatformSummary {
  handle: string | null
  solved: number
  submissions: number
  rating?: number
  rank?: string
  ranking?: number
}

export type StudentSyncStatus = 'ok' | 'empty' | 'unlinked'

export interface StudentSummary {
  nim: string
  nama: string
  kelasHuruf: string
  kelas: string
  aktif: boolean
  totalSolved: number
  totalSubmissions: number
  lastSolvedAt: string | null
  updatedAt: string | null
  sync: StudentSyncStatus
  platforms: Record<StudentPlatformKey, StudentPlatformSummary>
}

export interface StudentSummariesFile {
  updatedAt: string
  students: StudentSummary[]
}

export type StudentSnapshot = CpData
