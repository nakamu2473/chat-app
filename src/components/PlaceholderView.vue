<script setup lang="ts">
defineProps<{ label: string }>()
</script>

<template>
  <div class="placeholder">
    <p class="placeholder-label">{{ label }}</p>
    <p class="placeholder-sub">移行作業中です</p>
  </div>
</template>

<style scoped>
.placeholder {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  gap: 8px;
}
.placeholder-label {
  font-size: 18px;
  font-weight: 600;
}
.placeholder-sub {
  font-size: 13px;
}
</style>
