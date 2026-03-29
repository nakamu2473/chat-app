<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCalendarStore } from '@/stores/calendar'
import { useAppStore } from '@/stores/app'

const calStore = useCalendarStore()
const appStore = useAppStore()

const inputTitle = ref('')
const inputDate = ref('')

const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
const DOW = ['日', '月', '火', '水', '木', '金', '土']

// カレンダーグリッド生成
const calDays = computed(() => {
  const year = calStore.year
  const month = calStore.month
  const firstDow = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()

  const cells: Array<{
    day: number | null
    dateStr: string | null
    isToday: boolean
    appDots: string[]
    gcalDots: number
  }> = []

  for (let i = 0; i < firstDow; i++) {
    cells.push({ day: null, dateStr: null, isToday: false, appDots: [], gcalDots: 0 })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr =
      year +
      '-' +
      String(month + 1).padStart(2, '0') +
      '-' +
      String(d).padStart(2, '0')
    const isToday =
      today.getFullYear() === year &&
      today.getMonth() === month &&
      today.getDate() === d
    const appEvs = calStore.events.filter((e) => e.date === dateStr)
    const gcalEvs = calStore.gcalEvents.filter((e) => e.date === dateStr)
    cells.push({
      day: d,
      dateStr,
      isToday,
      appDots: appEvs.map((e) => (e.who === appStore.currentUser ? 'me' : 'other')),
      gcalDots: gcalEvs.length,
    })
  }
  return cells
})

const monthLabel = computed(() => `${calStore.year}年 ${MONTHS[calStore.month]}`)

const gcalStatusText = computed(() => {
  if (calStore.gcalStatus === 'loading') return '読み込み中…'
  if (calStore.gcalStatus === 'ok') return `${calStore.gcalEvents.length}件取得`
  if (calStore.gcalStatus === 'error') return 'エラー'
  return ''
})

async function addEvent() {
  const title = inputTitle.value.trim()
  const date = inputDate.value
  if (!title || !date) return
  inputTitle.value = ''
  await calStore.addEvent(title, date)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.isComposing) addEvent()
}

function onDayClick(dateStr: string | null) {
  if (!dateStr) return
  calStore.selectDate(dateStr)
  inputDate.value = dateStr
}

onMounted(() => {
  // 今日の日付をデフォルト入力値に
  const t = new Date()
  inputDate.value =
    t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0') + '-' + String(t.getDate()).padStart(2, '0')
})
</script>

<template>
  <div class="calendar-view">
    <!-- 月ナビゲーション -->
    <div class="cal-header">
      <button class="cal-nav" @click="calStore.prevMonth">‹</button>
      <span class="cal-month-label">{{ monthLabel }}</span>
      <button class="cal-nav" @click="calStore.nextMonth">›</button>
    </div>

    <!-- Google Calendar バー -->
    <div v-if="calStore.hasCalendars" class="gcal-bar">
      <span>📅 Googleカレンダー連携中</span>
      <button @click="calStore.loadGcalEvents">🔄 更新</button>
      <span class="gcal-status">{{ gcalStatusText }}</span>
    </div>

    <!-- カレンダーグリッド -->
    <div class="cal-grid">
      <div v-for="dow in DOW" :key="dow" class="cal-dow">{{ dow }}</div>
      <div
        v-for="(cell, i) in calDays"
        :key="i"
        class="cal-day"
        :class="{
          'other-month': !cell.day,
          today: cell.isToday,
          selected: cell.dateStr === calStore.selectedDate,
        }"
        @click="onDayClick(cell.dateStr)"
      >
        <span v-if="cell.day">{{ cell.day }}</span>
        <div v-if="cell.appDots.length || cell.gcalDots" class="dot-row">
          <div v-for="(dot, di) in cell.appDots" :key="'a' + di" class="cal-dot" :class="dot" />
          <div v-for="gi in cell.gcalDots" :key="'g' + gi" class="cal-dot gcal" />
        </div>
      </div>
    </div>

    <!-- イベントリスト -->
    <div class="cal-events">
      <!-- 未選択時：空の案内（バグ修正: 全件表示しない） -->
      <div v-if="!calStore.selectedDate" class="empty">
        <div class="empty-icon">📅</div>
        日付を選択してね
      </div>
      <!-- 選択日のイベントなし -->
      <div
        v-else-if="!calStore.selectedAppEvents.length && !calStore.selectedGcalEvents.length"
        class="empty"
      >
        <div class="empty-icon">📅</div>
        この日の予定はないよ
      </div>
      <!-- イベント一覧 -->
      <template v-else>
        <div
          v-for="ev in calStore.selectedAppEvents"
          :key="ev.id"
          class="cal-event-item"
          :class="{ 'other-user': ev.who !== appStore.currentUser }"
        >
          <div class="event-date-badge">
            <div class="eday">{{ Number(ev.date.split('-')[2]) }}</div>
            <div class="emon">{{ Number(ev.date.split('-')[1]) }}月</div>
          </div>
          <div class="event-info">
            <div class="event-title">{{ ev.title }}</div>
            <div class="event-meta">{{ ev.who }}</div>
          </div>
          <button class="event-del" @click="calStore.delEvent(ev.id)">✕</button>
        </div>
        <div
          v-for="ev in calStore.selectedGcalEvents"
          :key="ev.id"
          class="cal-event-item gcal-event"
        >
          <div class="event-date-badge">
            <div class="eday">{{ Number(ev.date.split('-')[2]) }}</div>
            <div class="emon">{{ Number(ev.date.split('-')[1]) }}月</div>
          </div>
          <div class="event-info">
            <div class="event-title">{{ ev.title }}</div>
            <div class="event-meta">📅 {{ ev.who }}</div>
          </div>
        </div>
      </template>
    </div>

    <!-- 入力バー -->
    <div class="input-bar">
      <div class="input-wrap">
        <input
          v-model="inputDate"
          type="date"
          class="date-input"
        />
        <input
          v-model="inputTitle"
          type="text"
          placeholder="予定を入力…"
          autocomplete="off"
          @keydown="onKeydown"
        />
        <button class="btn-send" @click="addEvent">追加</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.calendar-view {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

/* ヘッダー */
.cal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px 10px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.cal-month-label {
  font-size: 16px;
  font-weight: 700;
}
.cal-nav {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: var(--text-muted);
  padding: 4px 10px;
  border-radius: 6px;
  transition: background 0.15s;
}
.cal-nav:hover {
  background: var(--bg);
}

/* Google Calendar バー */
.gcal-bar {
  padding: 7px 16px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-muted);
  flex-shrink: 0;
}
.gcal-bar button {
  padding: 3px 10px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: transparent;
  font-size: 11px;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s;
}
.gcal-bar button:hover {
  background: var(--accent-light);
}
.gcal-status {
  margin-left: auto;
}

/* グリッド */
.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  padding: 8px 10px;
  flex-shrink: 0;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}
.cal-dow {
  text-align: center;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-muted);
  padding: 4px 0;
}
.cal-day {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding-top: 5px;
  font-size: 13px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.12s;
  gap: 2px;
}
.cal-day:hover:not(.other-month) {
  background: var(--accent-light);
}
.cal-day.today {
  background: var(--accent);
  color: #fff;
  font-weight: 700;
}
.cal-day.selected:not(.today) {
  background: var(--accent-light);
  outline: 2px solid var(--accent);
}
.cal-day.other-month {
  cursor: default;
  color: var(--border);
}

/* ドット */
.dot-row {
  display: flex;
  gap: 2px;
  flex-wrap: wrap;
  justify-content: center;
}
.cal-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--accent2);
  flex-shrink: 0;
}
.cal-dot.me {
  background: var(--accent);
}
.cal-dot.gcal {
  background: #4285f4;
}

/* イベントリスト */
.cal-events {
  flex: 1;
  overflow-y: auto;
  padding: 12px 14px;
  -webkit-overflow-scrolling: touch;
}
.empty {
  text-align: center;
  padding: 40px 0;
  color: var(--text-muted);
  font-size: 14px;
}
.empty-icon {
  font-size: 36px;
  margin-bottom: 8px;
}

.cal-event-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-left: 3px solid var(--accent);
  border-radius: 8px;
  margin-bottom: 6px;
}
.cal-event-item.other-user {
  border-left-color: var(--accent2);
}
.cal-event-item.gcal-event {
  border-left-color: #4285f4;
}

.event-date-badge {
  text-align: center;
  min-width: 36px;
}
.eday {
  font-size: 18px;
  font-weight: 700;
  line-height: 1;
  color: var(--accent);
  font-family: 'DM Mono', monospace;
}
.cal-event-item.other-user .eday {
  color: var(--accent2);
}
.cal-event-item.gcal-event .eday {
  color: #4285f4;
}
.emon {
  font-size: 10px;
  color: var(--text-muted);
  font-weight: 600;
}
.event-info {
  flex: 1;
}
.event-title {
  font-size: 14px;
  font-weight: 500;
}
.event-meta {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
}
.event-del {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  font-size: 14px;
  transition: color 0.15s;
  padding: 0;
}
.event-del:hover {
  color: var(--danger);
}

/* 入力バー */
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
.date-input {
  flex: 0 0 auto;
  padding: 8px 6px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 12px;
  font-family: inherit;
  background: var(--bg);
  outline: none;
  color: var(--text);
  max-width: 120px;
}
.date-input:focus {
  border-color: var(--accent);
}
.input-wrap input[type='text'] {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 99px;
  font-size: 14px;
  background: var(--bg);
  outline: none;
  font-family: inherit;
}
.input-wrap input[type='text']:focus {
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
