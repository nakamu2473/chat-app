import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ref as dbRef, onValue, set, remove } from 'firebase/database'
import { db, useFirebase, appConfig } from '@/firebase'
import { uid } from '@/utils/helpers'
import { useAppStore } from './app'
import type { CalEvent, GcalEvent } from '@/types'

// ---- iCal 取得・パース ----
const CORS_PROXIES = [
  (url: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
]

async function fetchIcal(url: string): Promise<string> {
  for (const proxy of CORS_PROXIES) {
    try {
      const res = await Promise.race([
        fetch(proxy(url)),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000)),
      ])
      if (!res.ok) continue
      const data = await res.json().catch(() => null)
      const text: string = data?.contents ?? (await (res as Response).text())
      if (text.includes('VCALENDAR')) return text
    } catch {
      continue
    }
  }
  throw new Error('iCal fetch failed')
}

function parseIcal(text: string, calName: string): GcalEvent[] {
  const events: GcalEvent[] = []
  const blocks = text.split('BEGIN:VEVENT')
  for (const block of blocks.slice(1)) {
    const dtstart = block.match(/DTSTART(?:;[^:]+)?:(\d{8})/)?.[1]
    const summary = block.match(/SUMMARY:(.+)/)?.[1]?.trim()
    if (!dtstart || !summary) continue
    const date = `${dtstart.slice(0, 4)}-${dtstart.slice(4, 6)}-${dtstart.slice(6, 8)}`
    events.push({ id: `gcal_${uid()}`, date, title: summary, who: calName })
  }
  return events
}

// ---- Store ----
export const useCalendarStore = defineStore('calendar', () => {
  const today = new Date()
  const year = ref(today.getFullYear())
  const month = ref(today.getMonth()) // 0-indexed
  const events = ref<CalEvent[]>([])
  const gcalEvents = ref<GcalEvent[]>([])
  const selectedDate = ref<string | null>(null) // null = 未選択（バグ修正: 全件表示しない）
  const gcalStatus = ref<'idle' | 'loading' | 'ok' | 'error'>('idle')

  const hasCalendars = computed(
    () => appConfig?.calendars && Object.keys(appConfig.calendars).length > 0,
  )

  const selectedAppEvents = computed(() =>
    selectedDate.value ? events.value.filter((e) => e.date === selectedDate.value) : [],
  )

  const selectedGcalEvents = computed(() =>
    selectedDate.value ? gcalEvents.value.filter((e) => e.date === selectedDate.value) : [],
  )

  function startListener() {
    if (!useFirebase || !db) return
    onValue(dbRef(db, 'events'), (snap) => {
      const val = snap.val()
      events.value = val ? Object.values(val as Record<string, CalEvent>) : []
    })
  }

  function prevMonth() {
    if (month.value === 0) {
      month.value = 11
      year.value--
    } else {
      month.value--
    }
    // 月を跨いだら選択をリセット
    selectedDate.value = null
  }

  function nextMonth() {
    if (month.value === 11) {
      month.value = 0
      year.value++
    } else {
      month.value++
    }
    selectedDate.value = null
  }

  function selectDate(date: string) {
    selectedDate.value = selectedDate.value === date ? null : date
  }

  async function addEvent(title: string, date: string): Promise<void> {
    const appStore = useAppStore()
    const ev: CalEvent = { id: uid(), date, title, who: appStore.currentUser, ts: Date.now() }
    if (useFirebase && db) {
      await set(dbRef(db, `events/${ev.id}`), ev)
    } else {
      events.value = [...events.value, ev]
    }
  }

  async function delEvent(id: string): Promise<void> {
    if (useFirebase && db) {
      await remove(dbRef(db, `events/${id}`))
    } else {
      events.value = events.value.filter((e) => e.id !== id)
    }
  }

  async function loadGcalEvents(): Promise<void> {
    if (!appConfig?.calendars) return
    gcalStatus.value = 'loading'
    gcalEvents.value = []
    const cals = Object.values(appConfig.calendars)
    let ok = 0
    for (const cal of cals) {
      if (!cal.icalUrl || cal.icalUrl.includes('XXXXXXXX')) continue
      try {
        const text = await fetchIcal(cal.icalUrl)
        gcalEvents.value = [...gcalEvents.value, ...parseIcal(text, cal.name)]
        ok++
      } catch (e) {
        console.warn('Gcal fetch error:', cal.name, e)
      }
    }
    gcalStatus.value = ok > 0 ? 'ok' : 'error'
  }

  return {
    year,
    month,
    events,
    gcalEvents,
    selectedDate,
    gcalStatus,
    hasCalendars,
    selectedAppEvents,
    selectedGcalEvents,
    startListener,
    prevMonth,
    nextMonth,
    selectDate,
    addEvent,
    delEvent,
    loadGcalEvents,
  }
})
