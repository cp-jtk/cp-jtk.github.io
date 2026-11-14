<template>
  <div class="platform-spotlight">
    <CpPlatformHeader
      :name="meta.name"
      :logo="meta.logo"
      :logoLight="meta.logoLight"
      :description="meta.description"
      :profile-href="profileHref"
      :profile-label="meta.profileLabel" />

    <slot />

    <div class="mt-8">
      <CpSolvedProblemsPanel
        :problems="recentSolved"
        :columns="columns"
        :copy="copy"
        :isId="isId" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import CpPlatformHeader from './CpPlatformHeader.vue'
import CpSolvedProblemsPanel from './CpSolvedProblemsPanel.vue'
import { CP_PLATFORMS } from '../../utils/cp/platforms'
import type { CpColumn, CpData, CpPlatformCopy, CpPlatformKey } from '../../types/cp.types'

const props = withDefaults(
  defineProps<{
    platform: CpPlatformKey
    cpData: CpData
    columns: CpColumn[]
    copy: CpPlatformCopy
    isId?: boolean
  }>(),
  {
    isId: true,
  }
)

const meta = computed(() => CP_PLATFORMS[props.platform])

const profileHref = computed(() => {
  const handle = props.cpData?.platforms?.[props.platform]?.handle
  return handle ? meta.value.profileUrl(handle) : ''
})

const recentSolved = computed(() => props.cpData?.platforms?.[props.platform]?.recentSolved || [])
</script>
