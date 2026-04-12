import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ref as dbRef, onValue, set, remove } from 'firebase/database'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage, useFirebase } from '@/firebase'
import { uid } from '@/utils/helpers'
import { useAppStore } from './app'
import type { PhotoItem } from '@/types'

export const PRESET_TAGS = ['おでかけ', 'ごはん', 'おうち', '旅行', '記念日', 'ネコ氏', 'メイ', 'カル']

export const useAlbumStore = defineStore('album', () => {
  const photos = ref<PhotoItem[]>([])
  const sort = ref<'new' | 'old' | 'fav'>('new')
  const filterTag = ref<string | null>(null)

  const sortedPhotos = computed(() => {
    let list = [...photos.value]
    if (sort.value === 'new') list.sort((a, b) => b.ts - a.ts)
    if (sort.value === 'old') list.sort((a, b) => a.ts - b.ts)
    if (sort.value === 'fav') list = list.filter((p) => p.fav).sort((a, b) => b.ts - a.ts)
    if (filterTag.value) list = list.filter((p) => p.tags?.includes(filterTag.value!))
    return list
  })

  const usedTags = computed(() => {
    const set = new Set<string>()
    photos.value.forEach((p) => (p.tags || []).forEach((t) => set.add(t)))
    return [...new Set([...PRESET_TAGS, ...set])].filter((t) => set.has(t))
  })

  function startListener() {
    if (!useFirebase || !db) return
    onValue(dbRef(db, 'photos'), (snap) => {
      const val = snap.val()
      photos.value = val ? Object.values(val as Record<string, PhotoItem>) : []
    })
  }

  async function uploadPhoto(file: File, caption: string, tags: string[]): Promise<void> {
    if (!storage) throw new Error('Firebase Storage not configured')
    const appStore = useAppStore()
    const photoId = uid()
    const ext = file.name.split('.').pop()
    const sRef = storageRef(storage, `photos/${photoId}.${ext}`)
    await uploadBytes(sRef, file)
    const url = await getDownloadURL(sRef)
    const now = new Date()
    const dateStr = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`
    const photo: PhotoItem = {
      id: photoId,
      url,
      caption,
      who: appStore.currentUser,
      ts: Date.now(),
      dateStr,
      fav: false,
      tags,
    }
    if (useFirebase && db) {
      await set(dbRef(db, `photos/${photoId}`), photo)
    } else {
      photos.value = [...photos.value, photo]
    }
  }

  async function toggleFav(id: string): Promise<void> {
    const photo = photos.value.find((p) => p.id === id)
    if (!photo) return
    const newFav = !photo.fav
    if (useFirebase && db) {
      await set(dbRef(db, `photos/${id}/fav`), newFav)
    } else {
      photo.fav = newFav
    }
  }

  async function delPhoto(id: string): Promise<void> {
    if (useFirebase && db) {
      await remove(dbRef(db, `photos/${id}`))
    } else {
      photos.value = photos.value.filter((p) => p.id !== id)
    }
  }

  return {
    photos,
    sort,
    filterTag,
    sortedPhotos,
    usedTags,
    startListener,
    uploadPhoto,
    toggleFav,
    delPhoto,
  }
})
