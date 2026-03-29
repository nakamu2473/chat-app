import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ref as dbRef, onValue, set, remove } from 'firebase/database'
import { db, useFirebase } from '@/firebase'
import { uid } from '@/utils/helpers'
import { useAppStore } from './app'
import type { ShopItem } from '@/types'

export const useShopStore = defineStore('shop', () => {
  const items = ref<ShopItem[]>([])

  function startListener() {
    if (!useFirebase || !db) return
    onValue(dbRef(db, 'shop'), (snap) => {
      const val = snap.val()
      items.value = val ? Object.values(val as Record<string, ShopItem>) : []
    })
  }

  async function addItem(text: string): Promise<void> {
    const appStore = useAppStore()
    const item: ShopItem = {
      id: uid(),
      text,
      who: appStore.currentUser,
      checked: false,
      ts: Date.now(),
    }
    if (useFirebase && db) {
      await set(dbRef(db, `shop/${item.id}`), item)
    } else {
      items.value = [...items.value, item]
    }
  }

  async function toggle(id: string): Promise<void> {
    const item = items.value.find((i) => i.id === id)
    if (!item) return
    if (useFirebase && db) {
      await set(dbRef(db, `shop/${id}/checked`), !item.checked)
    } else {
      item.checked = !item.checked
    }
  }

  async function del(id: string): Promise<void> {
    if (useFirebase && db) {
      await remove(dbRef(db, `shop/${id}`))
    } else {
      items.value = items.value.filter((i) => i.id !== id)
    }
  }

  return { items, startListener, addItem, toggle, del }
})
