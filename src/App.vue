<script setup lang="ts">
import { onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'
import { useShopStore } from '@/stores/shop'
import { useMemoStore } from '@/stores/memo'
import { initFirebase } from '@/firebase'
import LoginScreen from '@/components/LoginScreen.vue'
import AppHeader from '@/components/AppHeader.vue'
import TabNav from '@/components/TabNav.vue'
import ChatView from '@/components/chat/ChatView.vue'
import ShopView from '@/components/shop/ShopView.vue'
import MemoView from '@/components/memo/MemoView.vue'
import PlaceholderView from '@/components/PlaceholderView.vue'

const appStore = useAppStore()
const authStore = useAuthStore()
const chatStore = useChatStore()
const shopStore = useShopStore()
const memoStore = useMemoStore()

onMounted(() => {
  initFirebase()
  authStore.init()
  chatStore.startListener()
  shopStore.startListener()
  memoStore.startListener()
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
      <PlaceholderView v-show="appStore.currentTab === 'cal'"   label="カレンダー" />
      <PlaceholderView v-show="appStore.currentTab === 'album'" label="アルバム" />
      <PlaceholderView v-show="appStore.currentTab === 'cats'"  label="ねこ" />
    </main>
    <TabNav />
  </template>
</template>

<style scoped>
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
