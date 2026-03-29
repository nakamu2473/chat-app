<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
</script>

<template>
  <div class="login-screen">
    <div class="login-box">
      <h1 class="login-title">ふたりのアプリ</h1>
      <p v-if="authStore.loginError" class="login-error">{{ authStore.loginError }}</p>
      <button class="google-btn" @click="authStore.signIn">
        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
          <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
          <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"/>
          <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
        </svg>
        Googleでログイン
      </button>
    </div>
  </div>
</template>

<style scoped>
.login-screen {
  height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
}

.login-box {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 40px 32px;
  text-align: center;
  width: min(320px, 90vw);
}

.login-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--accent);
  margin-bottom: 24px;
  letter-spacing: 0.04em;
}

.login-error {
  font-size: 12px;
  color: var(--danger);
  margin-bottom: 12px;
}

.google-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
  cursor: pointer;
  transition: background 0.15s;
}

.google-btn:hover {
  background: var(--bg);
}
</style>
