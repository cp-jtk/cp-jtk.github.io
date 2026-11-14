import { site } from '../data/site'
import type { Locale } from './routing'

export type JsonLd = Record<string, unknown>

export const normalizeSiteUrl = (value?: URL | string | null): string => {
  const resolved = value?.toString() || site.defaultSiteUrl
  return resolved.endsWith('/') ? resolved.slice(0, -1) : resolved
}

const absoluteUrl = (siteUrl: string, path: string): string => new URL(path, `${siteUrl}/`).toString()

export const buildWebSiteSchema = (siteUrl: string): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: site.name,
  url: `${siteUrl}/`,
  description: site.description,
  inLanguage: site.locale,
})

export const buildCollectionPageSchema = (siteUrl: string, path: string, name: string, description: string, locale: Locale = 'id'): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name,
  description,
  url: absoluteUrl(siteUrl, path),
  inLanguage: locale,
  isPartOf: {
    '@type': 'WebSite',
    name: site.name,
    url: `${siteUrl}/`,
  },
})

export const buildBreadcrumbSchema = (siteUrl: string, items: Array<{ name: string; path: string }>): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: absoluteUrl(siteUrl, item.path),
  })),
})
