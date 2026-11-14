import { describe, expect, it } from 'vitest'
import { getNextTheme, getThemeLabel } from './header-controls'

describe('header theme helpers', () => {
  it('toggles between light and dark', () => {
    expect(getNextTheme('light')).toBe('dark')
    expect(getNextTheme('dark')).toBe('light')
  })

  it('labels the next action for each theme', () => {
    expect(getThemeLabel('light')).toBe('Ganti ke mode gelap')
    expect(getThemeLabel('dark')).toBe('Ganti ke mode terang')
  })
})
