import type { CpData, CpPlatformKey } from '../../types/cp.types'

const emptyOverview = () => ({
  totalSolved: 0,
  totalSubmissions: 0,
  activePlatforms: 0,
  topLanguage: { name: '-', count: 0 },
  heatmap: {},
})

const emptyPlatform = (key: CpPlatformKey) => {
  const base = {
    handle: '',
    url: '',
    totalSolved: 0,
    totalSubmissions: 0,
    recentSolved: [],
    dailyCalendar: {},
  }

  if (key === 'tlx') {
    return { ...base, totalAcSubmissions: 0, uniqueProblemsSolved: 0, languages: {} }
  }

  if (key === 'codeforces') {
    return {
      ...base,
      rating: 0,
      maxRating: 0,
      rank: 'unrated',
      maxRank: 'unrated',
      contestsCount: 0,
      tagsCount: {},
      ratingDistribution: {},
      languages: {},
    }
  }

  return {
    ...base,
    ranking: 0,
    easySolved: 0,
    mediumSolved: 0,
    hardSolved: 0,
  }
}

export const createEmptyCpData = (nim?: string): CpData => ({
  meta: { updatedAt: '', version: '1', studentNim: nim },
  overview: emptyOverview(),
  platforms: {
    tlx: emptyPlatform('tlx'),
    codeforces: emptyPlatform('codeforces'),
    leetcode: emptyPlatform('leetcode'),
  },
  recentGlobalFeed: [],
})
