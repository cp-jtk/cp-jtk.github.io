<template>
  <div class="spotlight-header">
    <div class="flex items-center gap-3.5">
      <div class="spotlight-logo-box">
        <template v-if="logoLight">
          <img :src="logo" :alt="name" class="spotlight-img-logo logo-variant-dark" />
          <img :src="logoLight" :alt="name" class="spotlight-img-logo logo-variant-light" />
        </template>
        <img v-else :src="logo" :alt="name" class="spotlight-img-logo" />
      </div>
      <div>
        <h2>{{ name }}</h2>
        <p>{{ description }}</p>
      </div>
    </div>
    <div v-if="profileHref" class="flex items-center gap-2 flex-wrap">
      <a :href="profileHref" target="_blank" rel="noopener noreferrer" class="external-profile-btn">
        {{ profileLabel }}
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    name: string
    logo: string
    logoLight?: string
    description: string
    profileHref?: string
    profileLabel?: string
  }>(),
  {
    profileHref: '',
    profileLabel: 'Profil ↗',
  }
)
</script>
