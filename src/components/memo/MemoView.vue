<script setup lang="ts">
import { ref } from 'vue'
import { useMemoStore } from '@/stores/memo'

const memoStore = useMemoStore()
const inputText = ref('')

async function add() {
  const text = inputText.value.trim()
  if (!text) return
  inputText.value = ''
  await memoStore.addItem(text)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.isComposing) add()
}
</script>

<template>
  <div class="memo-view">
    <div class="section-inner">
      <div v-if="!memoStore.items.length" class="empty">
        <div class="empty-icon">📝</div>
        まだ何もないよ
      </div>
      <div
        v-for="item in memoStore.items"
        :key="item.id"
        class="memo-item"
        :class="{ done: item.done }"
      >
        <div class="memo-header">
          <button
            v-if="item.type === 'todo'"
            class="memo-done-check"
            :class="{ checked: item.done }"
            @click="memoStore.toggleDone(item.id)"
          >{{ item.done ? '✓' : '' }}</button>
          <span class="memo-tag" :class="item.type">{{ item.type === 'todo' ? 'TODO' : 'メモ' }}</span>
          <span class="memo-who">{{ item.who }}</span>
          <button class="memo-del" @click="memoStore.del(item.id)">✕</button>
        </div>
        <div class="memo-text">{{ item.text }}</div>
      </div>
    </div>

    <div class="input-bar">
      <div class="memo-type-toggle">
        <button
          class="type-btn"
          :class="{ active: memoStore.memoType === 'memo' }"
          @click="memoStore.memoType = 'memo'"
        >📝 メモ</button>
        <button
          class="type-btn"
          :class="{ active: memoStore.memoType === 'todo' }"
          @click="memoStore.memoType = 'todo'"
        >✅ TODO</button>
      </div>
      <div class="input-wrap">
        <input
          v-model="inputText"
          type="text"
          placeholder="内容を入力…"
          autocomplete="off"
          @keydown="onKeydown"
        />
        <button class="btn-send" @click="add">追加</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.memo-view {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.section-inner {
  flex: 1;
  overflow-y: auto;
  padding: 14px;
  -webkit-overflow-scrolling: touch;
}

.empty {
  text-align: center;
  padding: 60px 0;
  color: var(--text-muted);
  font-size: 14px;
}
.empty-icon {
  font-size: 40px;
  margin-bottom: 10px;
}

.memo-item {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 8px;
}

.memo-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.memo-done-check {
  width: 18px;
  height: 18px;
  border-radius: 5px;
  border: 2px solid var(--border);
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  background: transparent;
  transition: all 0.15s;
  padding: 0;
  color: transparent;
}
.memo-done-check.checked {
  background: var(--accent2);
  border-color: var(--accent2);
  color: #fff;
}

.memo-tag {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.06em;
  padding: 2px 7px;
  border-radius: 8px;
}
.memo-tag.todo {
  background: var(--accent2-light);
  color: var(--accent2);
}
.memo-tag.memo {
  background: var(--accent-light);
  color: var(--accent);
}

.memo-who {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  margin-left: auto;
}

.memo-del {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  font-size: 14px;
  transition: color 0.15s;
  padding: 0;
}
.memo-del:hover {
  color: var(--danger);
}

.memo-text {
  font-size: 14px;
  line-height: 1.5;
}
.memo-item.done .memo-text {
  text-decoration: line-through;
  opacity: 0.5;
}

.input-bar {
  padding: 10px 14px;
  background: var(--surface);
  border-top: 1px solid var(--border);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.memo-type-toggle {
  display: flex;
  gap: 6px;
}

.type-btn {
  padding: 5px 14px;
  border-radius: 20px;
  border: 1.5px solid var(--border);
  background: transparent;
  font-size: 12px;
  cursor: pointer;
  font-family: inherit;
  color: var(--text-muted);
  transition: all 0.15s;
}
.type-btn.active {
  background: var(--accent2);
  border-color: var(--accent2);
  color: #fff;
  font-weight: 600;
}

.input-wrap {
  display: flex;
  gap: 8px;
  align-items: center;
}

.input-wrap input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 99px;
  font-size: 14px;
  background: var(--bg);
  outline: none;
  font-family: inherit;
}
.input-wrap input:focus {
  border-color: var(--accent);
}

.btn-send {
  padding: 10px 18px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 99px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.15s;
}
.btn-send:active {
  opacity: 0.8;
}
</style>
