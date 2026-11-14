import { setTheme, theme, THEME_STORAGE_KEY, type Theme } from '../stores/uiStore'

export const getNextTheme = (current: Theme): Theme => (current === 'dark' ? 'light' : 'dark')

export const getThemeLabel = (current: Theme): string => (current === 'dark' ? 'Ganti ke mode terang' : 'Ganti ke mode gelap')

const getCurrentTheme = (root: HTMLElement): Theme => (root.classList.contains('dark') ? 'dark' : 'light')

const syncThemeClasses = (root: HTMLElement, next: Theme): void => {
  root.classList.toggle('dark', next === 'dark')
  root.classList.toggle('light', next === 'light')
}

const renderThemeControls = (buttons: HTMLButtonElement[], current: Theme): void => {
  buttons.forEach((button) => {
    button.setAttribute('aria-label', getThemeLabel(current))
    button.querySelectorAll<HTMLElement>('[data-theme-value]').forEach((segment) => {
      segment.classList.toggle('active', segment.dataset.themeValue === current)
    })
  })
}

const initThemeToggle = (): void => {
  const root = document.documentElement
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]'))
  if (!buttons.length) return

  renderThemeControls(buttons, getCurrentTheme(root))

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const next = getNextTheme(getCurrentTheme(root))
      syncThemeClasses(root, next)
      setTheme(next)
      renderThemeControls(buttons, next)
    })
  })

  window.addEventListener('storage', (event) => {
    if (event.key !== THEME_STORAGE_KEY || !event.newValue) return
    const next: Theme = event.newValue === 'dark' ? 'dark' : 'light'
    syncThemeClasses(root, next)
    theme.set(next)
    renderThemeControls(buttons, next)
  })
}

let initialized = false

export const initHeaderControls = (): void => {
  if (initialized || typeof document === 'undefined') return
  initialized = true
  initThemeToggle()
}
