import { defineStore } from 'pinia'
import { ref } from 'vue'
import { ref as dbRef, onValue, set, remove, update } from 'firebase/database'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage, useFirebase } from '@/firebase'
import { uid, todayStr, fmtTime } from '@/utils/helpers'
import { useAppStore } from './app'
import type {
  CatData,
  CatProfile,
  WeightRecord,
  FoodType,
  MedicineItem,
  MedLog,
  VisitRecord,
  SymptomRecord,
  QuickLog,
  TodayNote,
  WaterLog,
} from '@/types'

export const CAT_IDS = ['nekoshi', 'mei', 'karu'] as const
export type CatId = (typeof CAT_IDS)[number]

export const CAT_DEFAULTS: Record<CatId, { name: string; emoji: string; color: string }> = {
  nekoshi: { name: 'ネコ氏', emoji: '🐱', color: '#3d6b5e' },
  mei: { name: 'メイ', emoji: '🌸', color: '#e91e8c' },
  karu: { name: 'カル', emoji: '🍊', color: '#c4773b' },
}

export const useCatsStore = defineStore('cats', () => {
  const cats = ref<Record<string, CatData>>({})
  const waterLog = ref<Record<string, WaterLog>>({})

  function getCat(catId: string): CatData {
    return cats.value[catId] || {}
  }
  function getCatProfile(catId: string): CatProfile {
    return getCat(catId).profile || {}
  }

  function startListener() {
    if (!useFirebase || !db) return
    CAT_IDS.forEach((catId) => {
      onValue(dbRef(db!, `cats/${catId}`), (snap) => {
        cats.value = { ...cats.value, [catId]: snap.val() || {} }
      })
    })
    onValue(dbRef(db!, 'water_log'), (snap) => {
      const val = snap.val()
      waterLog.value = val || {}
    })
  }

  // ---- 水 ----
  async function logWater(location: '1F' | '2F'): Promise<void> {
    const appStore = useAppStore()
    const log: WaterLog = { id: uid(), type: 'water', location, ts: Date.now(), who: appStore.currentUser }
    if (useFirebase && db) {
      await set(dbRef(db, `water_log/${log.id}`), log)
    } else {
      waterLog.value = { ...waterLog.value, [log.id]: log }
    }
  }

  async function delWaterLog(id: string): Promise<void> {
    if (useFirebase && db) {
      await remove(dbRef(db, `water_log/${id}`))
    } else {
      const next = { ...waterLog.value }
      delete next[id]
      waterLog.value = next
    }
  }

  // ---- クイックログ ----
  async function quickLog(catId: string, type: 'food' | 'med'): Promise<void> {
    const appStore = useAppStore()
    const log: QuickLog = { id: uid(), type, ts: Date.now(), who: appStore.currentUser }
    if (useFirebase && db) {
      await set(dbRef(db, `cats/${catId}/quick_log/${log.id}`), log)
    } else {
      ensureCat(catId)
      if (!cats.value[catId].quick_log) cats.value[catId].quick_log = {}
      cats.value[catId].quick_log![log.id] = log
      cats.value = { ...cats.value }
    }
  }

  // ---- 今日の様子 ----
  async function addTodayNote(catId: string, text: string): Promise<void> {
    const appStore = useAppStore()
    const note: TodayNote = {
      id: uid(),
      date: todayStr(),
      time: fmtTime(new Date()),
      text,
      ts: Date.now(),
      who: appStore.currentUser,
    }
    if (useFirebase && db) {
      await set(dbRef(db, `cats/${catId}/today_notes/${note.id}`), note)
    } else {
      ensureCat(catId)
      if (!cats.value[catId].today_notes) cats.value[catId].today_notes = {}
      cats.value[catId].today_notes![note.id] = note
      cats.value = { ...cats.value }
    }
  }

  // ---- 体重 ----
  async function addWeight(catId: string, value: number, date: string): Promise<void> {
    const appStore = useAppStore()
    const rec: WeightRecord = { id: uid(), value, date, ts: new Date(date).getTime() || Date.now(), who: appStore.currentUser }
    if (useFirebase && db) {
      await set(dbRef(db, `cats/${catId}/weight/${rec.id}`), rec)
    } else {
      ensureCat(catId)
      if (!cats.value[catId].weight) cats.value[catId].weight = {}
      cats.value[catId].weight![rec.id] = rec
      cats.value = { ...cats.value }
    }
  }

  async function delWeight(catId: string, id: string): Promise<void> {
    if (useFirebase && db) {
      await remove(dbRef(db, `cats/${catId}/weight/${id}`))
    } else {
      delete cats.value[catId]?.weight?.[id]
      cats.value = { ...cats.value }
    }
  }

  // ---- プロフィール ----
  async function saveProfile(catId: string, prof: CatProfile): Promise<void> {
    if (useFirebase && db) {
      await set(dbRef(db, `cats/${catId}/profile`), prof)
    } else {
      ensureCat(catId)
      cats.value[catId].profile = prof
      cats.value = { ...cats.value }
    }
  }

  async function uploadCatIcon(catId: string, file: File): Promise<void> {
    if (!storage) throw new Error('Storage not configured')
    const ext = file.name.split('.').pop()
    const sRef = storageRef(storage, `cats/${catId}/icon.${ext}`)
    await uploadBytes(sRef, file)
    const url = await getDownloadURL(sRef)
    if (useFirebase && db) {
      await update(dbRef(db, `cats/${catId}/profile`), { icon_url: url })
    } else {
      ensureCat(catId)
      cats.value[catId].profile = { ...getCatProfile(catId), icon_url: url }
      cats.value = { ...cats.value }
    }
  }

  // ---- ごはん ----
  async function addFood(catId: string, food: Omit<FoodType, 'id'>): Promise<void> {
    const item: FoodType = { id: uid(), ...food }
    if (useFirebase && db) {
      await set(dbRef(db, `cats/${catId}/food_types/${item.id}`), item)
    } else {
      ensureCat(catId)
      if (!cats.value[catId].food_types) cats.value[catId].food_types = {}
      cats.value[catId].food_types![item.id] = item
      cats.value = { ...cats.value }
    }
  }

  async function delFood(catId: string, id: string): Promise<void> {
    if (useFirebase && db) {
      await remove(dbRef(db, `cats/${catId}/food_types/${id}`))
    } else {
      delete cats.value[catId]?.food_types?.[id]
      cats.value = { ...cats.value }
    }
  }

  // ---- 投薬 ----
  async function addMedicine(catId: string, med: Omit<MedicineItem, 'id'>): Promise<void> {
    const appStore = useAppStore()
    const item: MedicineItem = { id: uid(), ...med }
    if (useFirebase && db) {
      await set(dbRef(db, `cats/${catId}/medicine/${item.id}`), item)
      // カレンダーにも登録
      if (item.next_date) {
        const prof = getCatProfile(catId)
        const name = prof.name || CAT_DEFAULTS[catId as CatId]?.name || catId
        const ev = { id: uid(), date: item.next_date, title: `💊 ${name} ${item.name}`, who: appStore.currentUser, ts: Date.now() }
        await set(dbRef(db, `events/${ev.id}`), ev)
      }
    } else {
      ensureCat(catId)
      if (!cats.value[catId].medicine) cats.value[catId].medicine = {}
      cats.value[catId].medicine![item.id] = item
      cats.value = { ...cats.value }
    }
  }

  async function logMed(catId: string, medId: string, medName: string): Promise<void> {
    const appStore = useAppStore()
    const log: MedLog = { id: uid(), med_id: medId, med_name: medName, date: todayStr(), ts: Date.now(), who: appStore.currentUser }
    if (useFirebase && db) {
      await set(dbRef(db, `cats/${catId}/med_log/${log.id}`), log)
    } else {
      ensureCat(catId)
      if (!cats.value[catId].med_log) cats.value[catId].med_log = {}
      cats.value[catId].med_log![log.id] = log
      cats.value = { ...cats.value }
    }
  }

  async function delMedicine(catId: string, id: string): Promise<void> {
    if (useFirebase && db) {
      await remove(dbRef(db, `cats/${catId}/medicine/${id}`))
    } else {
      delete cats.value[catId]?.medicine?.[id]
      cats.value = { ...cats.value }
    }
  }

  // ---- 受診 ----
  async function addVisit(catId: string, visit: Omit<VisitRecord, 'id' | 'ts' | 'who'>, files: File[]): Promise<void> {
    const appStore = useAppStore()
    const photos: string[] = []
    if (files.length && storage) {
      for (const file of files) {
        try {
          const ext = file.name.split('.').pop()
          const sRef = storageRef(storage, `visits/${catId}/${uid()}.${ext}`)
          await uploadBytes(sRef, file)
          photos.push(await getDownloadURL(sRef))
        } catch (e) {
          console.error('visit photo upload error:', e)
        }
      }
    }
    const rec: VisitRecord = { id: uid(), ...visit, photos, ts: Date.now(), who: appStore.currentUser }
    if (useFirebase && db) {
      await set(dbRef(db, `cats/${catId}/visits/${rec.id}`), rec)
    } else {
      ensureCat(catId)
      if (!cats.value[catId].visits) cats.value[catId].visits = {}
      cats.value[catId].visits![rec.id] = rec
      cats.value = { ...cats.value }
    }
  }

  async function delVisit(catId: string, id: string): Promise<void> {
    if (useFirebase && db) {
      await remove(dbRef(db, `cats/${catId}/visits/${id}`))
    } else {
      delete cats.value[catId]?.visits?.[id]
      cats.value = { ...cats.value }
    }
  }

  // ---- 症状 ----
  async function addSymptom(catId: string, sym: Omit<SymptomRecord, 'id' | 'ts' | 'who'>): Promise<void> {
    const appStore = useAppStore()
    const rec: SymptomRecord = { id: uid(), ...sym, ts: Date.now(), who: appStore.currentUser }
    if (useFirebase && db) {
      await set(dbRef(db, `cats/${catId}/symptoms/${rec.id}`), rec)
    } else {
      ensureCat(catId)
      if (!cats.value[catId].symptoms) cats.value[catId].symptoms = {}
      cats.value[catId].symptoms![rec.id] = rec
      cats.value = { ...cats.value }
    }
  }

  async function delSymptom(catId: string, id: string): Promise<void> {
    if (useFirebase && db) {
      await remove(dbRef(db, `cats/${catId}/symptoms/${id}`))
    } else {
      delete cats.value[catId]?.symptoms?.[id]
      cats.value = { ...cats.value }
    }
  }

  function ensureCat(catId: string) {
    if (!cats.value[catId]) cats.value[catId] = {}
  }

  return {
    cats,
    waterLog,
    getCat,
    getCatProfile,
    startListener,
    logWater,
    delWaterLog,
    quickLog,
    addTodayNote,
    addWeight,
    delWeight,
    saveProfile,
    uploadCatIcon,
    addFood,
    delFood,
    addMedicine,
    logMed,
    delMedicine,
    addVisit,
    delVisit,
    addSymptom,
    delSymptom,
  }
})
