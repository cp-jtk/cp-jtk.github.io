/**
 * Rating style conventions for CP platforms (Codeforces & TLX TOKI).
 */

export function getCodeforcesRatingClass(rating?: number | null): string {
  const r = Number(rating || 0)
  if (r <= 0) return 'cf-unrated'
  if (r < 1200) return 'cf-newbie'
  if (r < 1400) return 'cf-pupil'
  if (r < 1600) return 'cf-specialist'
  if (r < 1900) return 'cf-expert'
  if (r < 2200) return 'cf-candidate-master'
  if (r < 2400) return 'cf-master'
  return 'cf-grandmaster'
}

export function getTlxRatingClass(rating?: number | null): string {
  const r = Number(rating || 0)
  if (r <= 0) return 'tlx-unrated'
  if (r < 1650) return 'tlx-gray'
  if (r < 1750) return 'tlx-green'
  if (r < 2000) return 'tlx-blue'
  if (r < 2200) return 'tlx-purple'
  if (r < 2500) return 'tlx-orange'
  if (r < 3000) return 'tlx-red'
  return 'tlx-legend'
}

export function getTlxDivision(rating?: number | null): 'Division 1' | 'Division 2' {
  const r = Number(rating || 0)
  return r >= 2000 ? 'Division 1' : 'Division 2'
}
