<script setup lang="ts">
import { onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'
import { useShopStore } from '@/stores/shop'
import { useMemoStore } from '@/stores/memo'
import { useCalendarStore } from '@/stores/calendar'
import { useAlbumStore } from '@/stores/album'
import { useCatsStore } from '@/stores/cats'
import { initFirebase } from '@/firebase'
import LoginScreen from '@/components/LoginScreen.vue'
import AppHeader from '@/components/AppHeader.vue'
import TabNav from '@/components/TabNav.vue'
import ChatView from '@/components/chat/ChatView.vue'
import ShopView from '@/components/shop/ShopView.vue'
import MemoView from '@/components/memo/MemoView.vue'
import CalendarView from '@/components/calendar/CalendarView.vue'
import AlbumView from '@/components/album/AlbumView.vue'
import CatsView from '@/components/cats/CatsView.vue'

const appStore = useAppStore()
const authStore = useAuthStore()
const chatStore = useChatStore()
const shopStore = useShopStore()
const memoStore = useMemoStore()
const calendarStore = useCalendarStore()
const albumStore = useAlbumStore()
const catsStore = useCatsStore()

onMounted(() => {
  initFirebase()
  authStore.init()
  chatStore.startListener()
  shopStore.startListener()
  memoStore.startListener()
  calendarStore.startListener()
  albumStore.startListener()
  catsStore.startListener()
})
</script>

<template>
  <LoginScreen v-if="!appStore.isLoggedIn" />
  <template v-else>
    <AppHeader />
    <main class="main-content">
      <ChatView v-show="appStore.currentTab === 'chat'" />
      <ShopView v-show="appStore.currentTab === 'shop'" />
      <MemoView v-show="appStore.currentTab === 'memo'" />
      <CalendarView v-show="appStore.currentTab === 'cal'" />
      <AlbumView v-show="appStore.currentTab === 'album'" />
      <CatsView v-show="appStore.currentTab === 'cats'" />
    </main>
    <TabNav />
    <!-- Toast -->
    <Transition name="toast">
      <div v-if="appStore.toastMessage" class="toast">{{ appStore.toastMessage }}</div>
    </Transition>
  </template>
</template>

<style scoped>
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.toast {
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(30, 30, 30, 0.9);
  color: #fff;
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 14px;
  z-index: 9999;
  pointer-events: none;
  white-space: nowrap;
  max-width: 80vw;
  text-align: center;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(10px);
}
</style>
