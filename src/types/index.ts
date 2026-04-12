export type UserName = 'ゆき' | 'たけ'
export type TabName = 'chat' | 'shop' | 'memo' | 'cal' | 'album' | 'cats'
export type SyncStatus = 'ok' | 'error' | 'syncing'

export interface ShopItem {
  id: string
  text: string
  who: string
  checked: boolean
  ts: number
}

export interface MemoItem {
  id: string
  type: 'memo' | 'todo'
  text: string
  who: string
  done: boolean
  ts: number
}

export interface CalEvent {
  id: string
  date: string // YYYY-MM-DD
  title: string
  who: string
  ts: number
}

export interface GcalEvent {
  id: string
  date: string // YYYY-MM-DD
  title: string
  who: string // calendar name
}

export interface ChatMessage {
  id: string
  user: string
  text: string
  time: string
  ts: number
}

export interface PhotoItem {
  id: string
  url: string
  caption: string
  who: string
  ts: number
  dateStr: string
  fav: boolean
  tags: string[]
}

export interface CatProfile {
  name?: string
  birthday?: string
  gender?: string
  breed?: string
  weight_min?: number | null
  weight_max?: number | null
  hospital_name?: string
  hospital_tel?: string
  hospital_url?: string
  memo?: string
  icon_url?: string | null
}

export interface WeightRecord {
  id: string
  value: number
  date: string
  ts: number
  who: string
}

export interface FoodType {
  id: string
  name: string
  maker?: string
  type?: string
  kcal?: string | null
}

export interface MedicineItem {
  id: string
  name: string
  dose?: string
  freq?: string
  next_date?: string
}

export interface MedLog {
  id: string
  med_id: string
  med_name: string
  date: string
  ts: number
  who: string
}

export interface VisitRecord {
  id: string
  date: string
  hospital?: string
  diagnosis?: string
  cost?: string | null
  photos?: string[]
  ts: number
  who: string
}

export interface SymptomRecord {
  id: string
  date: string
  level: 'low' | 'mid' | 'high'
  text: string
  ts: number
  who: string
}

export interface QuickLog {
  id: string
  type: 'food' | 'med'
  ts: number
  who: string
}

export interface TodayNote {
  id: string
  date: string
  time: string
  text: string
  ts: number
  who: string
}

export interface CatData {
  profile?: CatProfile
  weight?: Record<string, WeightRecord>
  food_types?: Record<string, FoodType>
  medicine?: Record<string, MedicineItem>
  med_log?: Record<string, MedLog>
  visits?: Record<string, VisitRecord>
  symptoms?: Record<string, SymptomRecord>
  quick_log?: Record<string, QuickLog>
  today_notes?: Record<string, TodayNote>
}

export interface WaterLog {
  id: string
  type: 'water'
  location: '1F' | '2F'
  ts: number
  who: string
}

export interface AppConfig {
  firebase: {
    apiKey: string
    authDomain: string
    databaseURL: string
    projectId: string
    storageBucket: string
    messagingSenderId: string
    appId: string
  }
  fcm?: { vapidKey: string }
  calendars?: {
    yuki?: { name: string; icalUrl: string }
    take?: { name: string; icalUrl: string }
  }
}
