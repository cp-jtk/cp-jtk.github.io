import { describe, expect, it } from 'vitest'
import { getCodeforcesRatingClass, getTlxDivision, getTlxRatingClass } from './ratings'

describe('getCodeforcesRatingClass', () => {
  it('handles unrated / zero / null', () => {
    expect(getCodeforcesRatingClass(0)).toBe('cf-unrated')
    expect(getCodeforcesRatingClass(null)).toBe('cf-unrated')
    expect(getCodeforcesRatingClass(undefined)).toBe('cf-unrated')
  })

  it('classifies correct codeforces rating brackets', () => {
    expect(getCodeforcesRatingClass(1100)).toBe('cf-newbie')
    expect(getCodeforcesRatingClass(1300)).toBe('cf-pupil')
    expect(getCodeforcesRatingClass(1500)).toBe('cf-specialist')
    expect(getCodeforcesRatingClass(1874)).toBe('cf-expert')
    expect(getCodeforcesRatingClass(2050)).toBe('cf-candidate-master')
    expect(getCodeforcesRatingClass(2300)).toBe('cf-master')
    expect(getCodeforcesRatingClass(2600)).toBe('cf-grandmaster')
  })
})

describe('getTlxRatingClass', () => {
  it('handles unrated / zero / null', () => {
    expect(getTlxRatingClass(0)).toBe('tlx-unrated')
    expect(getTlxRatingClass(null)).toBe('tlx-unrated')
    expect(getTlxRatingClass(undefined)).toBe('tlx-unrated')
  })

  it('classifies correct tlx rating divisions and tiers', () => {
    expect(getTlxRatingClass(1500)).toBe('tlx-gray')
    expect(getTlxRatingClass(1700)).toBe('tlx-green')
    expect(getTlxRatingClass(1850)).toBe('tlx-blue')
    expect(getTlxRatingClass(2150)).toBe('tlx-purple')
    expect(getTlxRatingClass(2350)).toBe('tlx-orange')
    expect(getTlxRatingClass(2600)).toBe('tlx-red')
    expect(getTlxRatingClass(3100)).toBe('tlx-legend')
  })
})

describe('getTlxDivision', () => {
  it('identifies Division 1 and Division 2', () => {
    expect(getTlxDivision(0)).toBe('Division 2')
    expect(getTlxDivision(null)).toBe('Division 2')
    expect(getTlxDivision(1500)).toBe('Division 2')
    expect(getTlxDivision(1999)).toBe('Division 2')
    expect(getTlxDivision(2000)).toBe('Division 1')
    expect(getTlxDivision(2150)).toBe('Division 1')
    expect(getTlxDivision(3200)).toBe('Division 1')
  })
})
