import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ref as dbRef, onValue, set } from 'firebase/database'
import { db, useFirebase } from '@/firebase'
import { uid, fmtTime } from '@/utils/helpers'
import { useAppStore } from './app'
import type { ChatMessage } from '@/types'

export const useChatStore = defineStore('chat', () => {
  const messages = ref<ChatMessage[]>([])

  function startListener() {
    if (!useFirebase || !db) return
    const appStore = useAppStore()
    appStore.setSyncStatus('syncing')
    onValue(dbRef(db, 'chat'), (snap) => {
      const val = snap.val()
      messages.value = val
        ? Object.values(val as Record<string, ChatMessage>).sort(
            (a, b) => (a.ts ?? 0) - (b.ts ?? 0),
          )
        : []
      appStore.setSyncStatus('ok')
    })
  }

  async function sendMessage(text: string): Promise<void> {
    const appStore = useAppStore()
    const msg: ChatMessage = {
      id: uid(),
      user: appStore.currentUser,
      text,
      time: fmtTime(new Date()),
      ts: Date.now(),
    }
    if (useFirebase && db) {
      await set(dbRef(db, `chat/${msg.id}`), msg)
    } else {
      messages.value = [...messages.value, msg]
    }
  }

  return { messages, startListener, sendMessage }
})
