import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { TabName, UserName, SyncStatus } from '@/types'

export const useAppStore = defineStore('app', () => {
  const currentUser = ref<UserName>('ゆき')
  const currentTab = ref<TabName>('chat')
  const isLoggedIn = ref(false)
  const syncStatus = ref<SyncStatus>('ok')
  const toastMessage = ref<string | null>(null)
  let toastTimer: ReturnType<typeof setTimeout> | null = null

  function setUser(user: UserName) {
    currentUser.value = user
  }

  function setTab(tab: TabName) {
    currentTab.value = tab
  }

  function setLoggedIn(value: boolean) {
    isLoggedIn.value = value
  }

  function setSyncStatus(status: SyncStatus) {
    syncStatus.value = status
  }

  function showToast(msg: string) {
    if (toastTimer) clearTimeout(toastTimer)
    toastMessage.value = msg
    toastTimer = setTimeout(() => {
      toastMessage.value = null
    }, 2500)
  }

  return { currentUser, currentTab, isLoggedIn, syncStatus, toastMessage, setUser, setTab, setLoggedIn, setSyncStatus, showToast }
})
