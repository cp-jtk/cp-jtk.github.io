<template>
  <div class="dashboard-topbar">
    <div class="live-indicator">
      <span class="pulse-dot"></span>
      <span class="live-text">{{ liveLabel }}</span>
      <span class="updated-time" v-if="relativeTime">• {{ relativeTime }}</span>
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { formatRelativeTime } from '../../utils/dateFormat'

const props = withDefaults(
  defineProps<{
    lastUpdated?: string
    isId?: boolean
  }>(),
  {
    isId: false,
  }
)

const liveLabel = computed(() => (props.isId ? 'Terakhir Disinkronkan' : 'Last Synced'))

// Relative time depends on the current clock, so it is only rendered after
// hydration. Rendering it during SSR makes the text drift between build time
// and hydration, which triggers a Vue hydration mismatch.
const relativeTime = ref('')
let timer: ReturnType<typeof setInterval> | undefined

const updateRelativeTime = () => {
  relativeTime.value = props.lastUpdated ? formatRelativeTime(props.lastUpdated, props.isId) : ''
}

onMounted(() => {
  updateRelativeTime()
  timer = setInterval(updateRelativeTime, 60_000)
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.dashboard-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.25rem;
}

.live-indicator {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: var(--type-sm);
  color: var(--muted);
}

.pulse-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
  animation: pulse-glow 2s infinite ease-in-out;
}

@keyframes pulse-glow {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(0.85);
  }
}

.live-text {
  font-weight: 600;
  color: var(--text);
}

.updated-time {
  color: var(--muted);
}

@media (max-width: 480px) {
  .dashboard-topbar {
    flex-direction: column;
    gap: 0.75rem;
    align-items: stretch;
    text-align: center;
  }

  .live-indicator {
    justify-content: center;
  }
}
</style>
