export type UserName = 'ゆき' | 'たけ'
export type TabName = 'chat' | 'shop' | 'memo' | 'cal' | 'album' | 'cats'
export type SyncStatus = 'ok' | 'error' | 'syncing'

export interface ChatMessage {
  id: string
  user: string
  text: string
  time: string
  ts: number
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
