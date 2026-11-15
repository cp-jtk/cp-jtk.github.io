let initialized = false

const setExpanded = (toggle: HTMLElement | null, expanded: boolean): void => {
  toggle?.setAttribute('aria-expanded', expanded ? 'true' : 'false')
}

export const initSidebar = (): void => {
  if (initialized || typeof document === 'undefined') return
  initialized = true

  const root = document.documentElement
  const toggle = document.querySelector<HTMLElement>('[data-sidebar-toggle]')
  const overlay = document.querySelector<HTMLElement>('[data-sidebar-overlay]')
  const closeButtons = Array.from(document.querySelectorAll<HTMLElement>('[data-sidebar-close]'))
  const navLinks = Array.from(document.querySelectorAll<HTMLElement>('[data-nav-link]'))

  const closeSidebar = (): void => {
    root.classList.remove('sidebar-open')
    setExpanded(toggle, false)
  }

  const openSidebar = (): void => {
    root.classList.add('sidebar-open')
    setExpanded(toggle, true)
  }

  toggle?.addEventListener('click', () => {
    if (root.classList.contains('sidebar-open')) closeSidebar()
    else openSidebar()
  })

  overlay?.addEventListener('click', closeSidebar)
  closeButtons.forEach((button) => button.addEventListener('click', closeSidebar))
  navLinks.forEach((link) => link.addEventListener('click', closeSidebar))

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && root.classList.contains('sidebar-open')) closeSidebar()
  })

  const setActiveNav = (id: string): void => {
    navLinks.forEach((link) => {
      const isActive = link.getAttribute('data-target') === id
      link.classList.toggle('active', isActive)
      if (isActive) link.setAttribute('aria-current', 'true')
      else link.removeAttribute('aria-current')
    })
  }

  const path = window.location.pathname.replace(/\/$/, '') || '/'
  const hashTarget = window.location.hash.replace('#', '')

  let pageTarget = ''
  if (path.startsWith('/students')) pageTarget = 'roster'
  else if (path === '/learn/references') pageTarget = 'references'
  else if (path === '/learn/platforms') pageTarget = 'platforms'

  const activeTarget = hashTarget || pageTarget
  if (activeTarget) setActiveNav(activeTarget)

  const sectionEntries = navLinks
    .map((link) => {
      const id = link.getAttribute('data-target')
      const element = id ? document.getElementById(id) : null
      return id && element ? { id, element } : null
    })
    .filter((entry): entry is { id: string; element: HTMLElement } => entry !== null)

  if (!sectionEntries.length) return

  if (!activeTarget) setActiveNav(sectionEntries[0].id)

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)

      const id = visible[0]?.target.getAttribute('id')
      if (id) setActiveNav(id)
    },
    { rootMargin: '-30% 0px -50% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
  )

  sectionEntries.forEach(({ element }) => observer.observe(element))
}
