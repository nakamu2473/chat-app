<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import { useChatStore } from '@/stores/chat'
import { useAppStore } from '@/stores/app'
import { linkify } from '@/utils/helpers'

const chatStore = useChatStore()
const appStore = useAppStore()
const inputText = ref('')
const scrollEl = ref<HTMLElement | null>(null)

function scrollToBottom() {
  nextTick(() => {
    if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight
  })
}

async function send() {
  const text = inputText.value.trim()
  if (!text) return
  inputText.value = ''
  await chatStore.sendMessage(text)
  scrollToBottom()
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.isComposing) send()
}

watch(() => chatStore.messages.length, scrollToBottom)
</script>

<template>
  <div class="chat-view">
    <div class="section-inner" ref="scrollEl">
      <div v-if="!chatStore.messages.length" class="empty">
        <div class="empty-icon">💬</div>
        まだメッセージがないよ
      </div>
      <div v-else class="chat-messages">
        <div
          v-for="msg in chatStore.messages"
          :key="msg.id"
          class="msg-wrap"
          :class="msg.user === appStore.currentUser ? 'me' : 'other'"
        >
          <div class="msg-bubble" v-html="linkify(msg.text)" />
          <div class="msg-time">{{ msg.time }}</div>
        </div>
      </div>
    </div>
    <div class="input-bar">
      <div class="input-wrap">
        <input
          v-model="inputText"
          type="text"
          placeholder="メッセージを入力…"
          autocomplete="off"
          @keydown="onKeydown"
        />
        <button class="btn-send" @click="send">送信</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-view {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.section-inner {
  flex: 1;
  overflow-y: auto;
  padding: 12px 14px;
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

.chat-messages {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.msg-wrap {
  display: flex;
  flex-direction: column;
  max-width: 80%;
}
.msg-wrap.me {
  align-self: flex-end;
  align-items: flex-end;
}
.msg-wrap.other {
  align-self: flex-start;
  align-items: flex-start;
}

.msg-bubble {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 8px 12px;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
}
.msg-wrap.me .msg-bubble {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
  border-bottom-right-radius: 3px;
}
.msg-wrap.other .msg-bubble {
  border-bottom-left-radius: 3px;
}

.msg-bubble :deep(a) {
  color: inherit;
  text-decoration: underline;
  opacity: 0.85;
}

.msg-time {
  font-size: 10px;
  color: var(--text-muted);
  margin-top: 2px;
  padding: 0 2px;
  font-family: 'DM Mono', monospace;
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
