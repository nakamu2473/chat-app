import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { TabName, UserName, SyncStatus } from '@/types'

export const useAppStore = defineStore('app', () => {
  const currentUser = ref<UserName>('ゆき')
  const currentTab = ref<TabName>('chat')
  const isLoggedIn = ref(false)
  const syncStatus = ref<SyncStatus>('ok')

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

  return { currentUser, currentTab, isLoggedIn, syncStatus, setUser, setTab, setLoggedIn, setSyncStatus }
})
