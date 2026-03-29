import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  onAuthStateChanged,
  signOut as fbSignOut,
} from 'firebase/auth'
import { auth, useFirebase } from '@/firebase'
import { useAppStore } from './app'
import type { UserName } from '@/types'

const EMAIL_TO_USER: Record<string, UserName> = {
  'yka06398@gmail.com': 'たけ',
  'oyukita56@gmail.com': 'ゆき',
}

export const useAuthStore = defineStore('auth', () => {
  const loginError = ref('')

  function init() {
    const appStore = useAppStore()
    if (!useFirebase || !auth) {
      // デモモード：そのままログイン済みにする
      appStore.setLoggedIn(true)
      return
    }
    onAuthStateChanged(auth, (user) => {
      if (user) {
        const mappedUser = EMAIL_TO_USER[user.email ?? '']
        if (mappedUser) {
          appStore.setUser(mappedUser)
          appStore.setLoggedIn(true)
          loginError.value = ''
        } else {
          auth!.signOut()
          appStore.setLoggedIn(false)
          loginError.value = 'このアカウントは登録されていません'
        }
      } else {
        appStore.setLoggedIn(false)
      }
    })
  }

  async function signIn() {
    if (!auth) return
    loginError.value = ''
    const provider = new GoogleAuthProvider()
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
    try {
      if (isIOS || isSafari) {
        await signInWithPopup(auth, provider)
      } else {
        await signInWithRedirect(auth, provider)
      }
    } catch (e) {
      console.error('sign-in error:', e)
      loginError.value = 'ログインに失敗しました'
    }
  }

  async function signOut() {
    if (auth) await fbSignOut(auth)
  }

  return { loginError, init, signIn, signOut }
})
