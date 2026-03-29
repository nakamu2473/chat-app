<script setup lang="ts">
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { useFirebase } from '@/firebase'
import type { UserName } from '@/types'

const appStore = useAppStore()
const authStore = useAuthStore()

const USERS: UserName[] = ['ゆき', 'たけ']
</script>

<template>
  <header class="app-header">
    <span class="sync-dot" :class="appStore.syncStatus" />
    <span class="header-title">ふたりのアプリ</span>
    <div class="header-right">
      <template v-if="useFirebase">
        <span class="current-user-label">{{ appStore.currentUser }}</span>
        <button class="logout-btn" @click="authStore.signOut">ログアウト</button>
      </template>
      <template v-else>
        <button
          v-for="u in USERS"
          :key="u"
          class="user-btn"
          :class="{ active: appStore.currentUser === u }"
          @click="appStore.setUser(u)"
        >{{ u }}</button>
      </template>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  height: 56px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  padding: 0 14px;
  gap: 8px;
  flex-shrink: 0;
  z-index: 10;
}

.sync-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.sync-dot.ok { background: #4caf50; }
.sync-dot.syncing { background: #ff9800; }
.sync-dot.error { background: var(--danger); }

.header-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--accent);
  letter-spacing: 0.04em;
  flex: 1;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.current-user-label {
  font-size: 13px;
  color: var(--text-muted);
}

.logout-btn {
  font-size: 12px;
  padding: 4px 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--surface);
  color: var(--text-muted);
  cursor: pointer;
}

.user-btn {
  font-size: 13px;
  padding: 4px 12px;
  border: 1px solid var(--border);
  border-radius: 99px;
  background: var(--surface);
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s;
}
.user-btn.active {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
}
</style>
