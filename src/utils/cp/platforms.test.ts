import { describe, expect, it } from 'vitest'
import { getPlatformHandle, isPlatformLinked } from './platforms'
import type { CpData } from '../../types/cp.types'

describe('getPlatformHandle', () => {
  it('reads handle from platforms record', () => {
    const cpData = {
      platforms: {
        tlx: { handle: 'tourist' },
      },
    } as unknown as CpData

    expect(getPlatformHandle(cpData, 'tlx')).toBe('tourist')
  })

  it('falls back to meta.handles if platform handle is empty', () => {
    const cpData = {
      meta: {
        handles: {
          codeforces: 'tourist',
        },
      },
      platforms: {
        codeforces: { handle: '' },
      },
    } as unknown as CpData

    expect(getPlatformHandle(cpData, 'codeforces')).toBe('tourist')
  })

  it('returns empty string when handle is not present', () => {
    expect(getPlatformHandle(null, 'leetcode')).toBe('')
    expect(getPlatformHandle({} as CpData, 'leetcode')).toBe('')
  })
})

describe('isPlatformLinked', () => {
  it('returns true for valid handles', () => {
    const cpData = {
      platforms: {
        tlx: { handle: 'aycaaa' },
      },
    } as unknown as CpData

    expect(isPlatformLinked(cpData, 'tlx')).toBe(true)
  })

  it('returns false for unset or placeholder values', () => {
    const testCases = ['', '   ', '-', '–', '—', 'unset', 'null', 'undefined', 'none', 'n/a', 'Belum terhubung']

    for (const val of testCases) {
      const cpData = {
        platforms: {
          tlx: { handle: val },
        },
      } as unknown as CpData

      expect(isPlatformLinked(cpData, 'tlx')).toBe(false)
    }
  })
})
