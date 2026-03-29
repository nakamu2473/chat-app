import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ref as dbRef, onValue, set, remove } from 'firebase/database'
import { db, useFirebase } from '@/firebase'
import { uid } from '@/utils/helpers'
import { useAppStore } from './app'
import type { MemoItem } from '@/types'

export const useMemoStore = defineStore('memo', () => {
  const items = ref<MemoItem[]>([])
  const memoType = ref<'memo' | 'todo'>('memo')

  function startListener() {
    if (!useFirebase || !db) return
    onValue(dbRef(db, 'memo'), (snap) => {
      const val = snap.val()
      items.value = val
        ? Object.values(val as Record<string, MemoItem>).sort(
            (a, b) => (b.ts ?? 0) - (a.ts ?? 0),
          )
        : []
    })
  }

  async function addItem(text: string): Promise<void> {
    const appStore = useAppStore()
    const item: MemoItem = {
      id: uid(),
      type: memoType.value,
      text,
      who: appStore.currentUser,
      done: false,
      ts: Date.now(),
    }
    if (useFirebase && db) {
      await set(dbRef(db, `memo/${item.id}`), item)
    } else {
      items.value = [item, ...items.value]
    }
  }

  async function toggleDone(id: string): Promise<void> {
    const item = items.value.find((i) => i.id === id)
    if (!item) return
    if (useFirebase && db) {
      await set(dbRef(db, `memo/${id}/done`), !item.done)
    } else {
      item.done = !item.done
    }
  }

  async function del(id: string): Promise<void> {
    if (useFirebase && db) {
      await remove(dbRef(db, `memo/${id}`))
    } else {
      items.value = items.value.filter((i) => i.id !== id)
    }
  }

  return { items, memoType, startListener, addItem, toggleDone, del }
})
