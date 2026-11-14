import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'

const students = defineCollection({
  loader: glob({
    pattern: '*.json',
    base: './src/content/students',
    generateId: ({ entry }) => entry.replace(/\.json$/, ''),
  }),
  schema: z.object({
    nim: z.string().regex(/^\d{6,}$/),
    nama: z.string().min(1),
    kelasHuruf: z.string().min(1),
    kelas: z.string().min(1),
    aktif: z.boolean().default(true),
    platforms: z.object({
      tlx: z.string().min(1).nullable(),
      leetcode: z.string().min(1).nullable(),
      codeforces: z.string().min(1).nullable(),
    }),
  }),
})

export const collections = { students }
