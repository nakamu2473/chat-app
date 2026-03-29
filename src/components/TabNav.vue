<script setup lang="ts">
import { useAppStore } from '@/stores/app'
import type { TabName } from '@/types'

const appStore = useAppStore()

const tabs: { id: TabName; label: string; icon: string }[] = [
  { id: 'chat',  label: 'チャット',    icon: '/chat-icon.svg' },
  { id: 'shop',  label: '買い物',      icon: '/shopping-icon.svg' },
  { id: 'memo',  label: 'メモ',        icon: '/memo-todo-icon.svg' },
  { id: 'cal',   label: 'カレンダー',  icon: '/calendar-icon.svg' },
  { id: 'album', label: 'アルバム',    icon: '/album-icon.svg' },
  { id: 'cats',  label: 'ねこ',        icon: '' },
]
</script>

<template>
  <nav class="tab-nav">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      class="tab"
      :class="{ active: appStore.currentTab === tab.id }"
      @click="appStore.setTab(tab.id)"
    >
      <span class="tab-icon">
        <img v-if="tab.icon" :src="tab.icon" :alt="tab.label" />
        <span v-else class="tab-emoji">🐱</span>
      </span>
      <span class="tab-label">{{ tab.label }}</span>
    </button>
  </nav>
</template>

<style scoped>
.tab-nav {
  display: flex;
  background: var(--surface);
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}

.tab {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 6px 0 8px;
  border: none;
  background: none;
  color: var(--text-muted);
  font-size: 10px;
  cursor: pointer;
  transition: color 0.15s;
  -webkit-tap-highlight-color: transparent;
}
.tab.active {
  color: var(--accent);
}

.tab-icon {
  height: 22px;
  display: flex;
  align-items: center;
}
.tab-icon img {
  width: 22px;
  height: 22px;
  opacity: 0.55;
}
.tab.active .tab-icon img {
  opacity: 1;
}

.tab-emoji {
  font-size: 20px;
  line-height: 1;
}

.tab-label {
  font-size: 10px;
  font-weight: 500;
}
</style>
