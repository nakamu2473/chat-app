<script setup lang="ts">
import { ref, computed } from 'vue'
import { useShopStore } from '@/stores/shop'

const shopStore = useShopStore()
const inputText = ref('')

const pending = computed(() => shopStore.items.filter((i) => !i.checked))
const done = computed(() => shopStore.items.filter((i) => i.checked))

async function add() {
  const text = inputText.value.trim()
  if (!text) return
  inputText.value = ''
  await shopStore.addItem(text)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.isComposing) add()
}
</script>

<template>
  <div class="shop-view">
    <div class="section-inner">
      <div class="shop-section">
        <h3 class="section-label">未購入</h3>
        <div v-if="!pending.length" class="empty-inline">✓ 全部揃ってる！</div>
        <div
          v-for="item in pending"
          :key="item.id"
          class="shop-item"
        >
          <button class="shop-check" @click="shopStore.toggle(item.id)" />
          <span class="item-text">{{ item.text }}</span>
          <span class="item-who">{{ item.who }}</span>
          <button class="item-del" @click="shopStore.del(item.id)">✕</button>
        </div>
      </div>

      <div v-if="done.length" class="shop-section">
        <h3 class="section-label">購入済み</h3>
        <div
          v-for="item in done"
          :key="item.id"
          class="shop-item checked"
        >
          <button class="shop-check checked" @click="shopStore.toggle(item.id)">✓</button>
          <span class="item-text">{{ item.text }}</span>
          <span class="item-who">{{ item.who }}</span>
          <button class="item-del" @click="shopStore.del(item.id)">✕</button>
        </div>
      </div>
    </div>

    <div class="input-bar">
      <div class="input-wrap">
        <input
          v-model="inputText"
          type="text"
          placeholder="商品名を入力…"
          autocomplete="off"
          @keydown="onKeydown"
        />
        <button class="btn-send" @click="add">追加</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.shop-view {
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

.shop-section {
  margin-bottom: 20px;
}

.section-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 10px;
}

.empty-inline {
  font-size: 13px;
  color: var(--text-muted);
  padding: 12px 0;
}

.shop-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  margin-bottom: 6px;
  transition: opacity 0.2s;
}
.shop-item.checked {
  opacity: 0.45;
}
.shop-item.checked .item-text {
  text-decoration: line-through;
}

.shop-check {
  width: 20px;
  height: 20px;
  border-radius: 6px;
  border: 2px solid var(--border);
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  font-size: 12px;
  transition: all 0.15s;
  padding: 0;
  color: transparent;
}
.shop-check.checked {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.item-text {
  flex: 1;
  font-size: 14px;
}

.item-who {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 10px;
  background: var(--accent-light);
  color: var(--accent);
}

.item-del {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  font-size: 16px;
  padding: 0 2px;
  transition: color 0.15s;
}
.item-del:hover {
  color: var(--danger);
}

.input-bar {
  padding: 10px 14px;
  background: var(--surface);
  border-top: 1px solid var(--border);
  flex-shrink: 0;
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
