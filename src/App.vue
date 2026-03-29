<script setup lang="ts">
// Phase 1: Vite + Vue 3 + TypeScript セットアップ確認用
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <span class="app-title">ふたりのアプリ</span>
    </header>
    <main class="app-main">
      <div class="notice">
        <p class="label">移行中</p>
        <p class="sub">Vite + Vue 3 + TypeScript のセットアップが完了しました</p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  background: #f7f6f3;
  font-family: 'Noto Sans JP', sans-serif;
  color: #1a1a1a;
}

.app-header {
  background: #ffffff;
  border-bottom: 1px solid #e8e5e0;
  padding: 0 16px;
  height: 56px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.app-title {
  font-size: 15px;
  font-weight: 700;
  color: #3d6b5e;
  letter-spacing: 0.04em;
}

.app-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notice {
  text-align: center;
  padding: 32px;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e8e5e0;
}

.label {
  font-size: 24px;
  font-weight: 700;
  color: #3d6b5e;
  margin-bottom: 8px;
}

.sub {
  font-size: 13px;
  color: #888880;
}
</style>
