import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getDatabase, type Database } from 'firebase/database'
import { getStorage, type FirebaseStorage } from 'firebase/storage'
import { getAuth, type Auth } from 'firebase/auth'
import type { AppConfig } from '@/types'

declare global {
  interface Window {
    APP_CONFIG: AppConfig | null | undefined
  }
}

export let app: FirebaseApp | null = null
export let db: Database | null = null
export let storage: FirebaseStorage | null = null
export let auth: Auth | null = null

const config: AppConfig | null = window.APP_CONFIG ?? null

export const useFirebase = !!(
  config?.firebase?.apiKey && config.firebase.apiKey !== 'YOUR_API_KEY'
)

export function initFirebase(): void {
  if (!useFirebase || !config) return
  try {
    app = initializeApp(config.firebase)
    db = getDatabase(app)
    storage = getStorage(app)
    auth = getAuth(app)
  } catch (e) {
    console.error('Firebase init error:', e)
  }
}

export { config as appConfig }
