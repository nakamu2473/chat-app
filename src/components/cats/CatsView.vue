<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCatsStore, CAT_IDS, CAT_DEFAULTS, type CatId } from '@/stores/cats'
import { useAppStore } from '@/stores/app'
import { fmtTimeAgo, todayStr } from '@/utils/helpers'

const catsStore = useCatsStore()
const appStore = useAppStore()

// ---- ビュー管理 ----
type View = 'top' | 'water-history' | 'detail'
const currentView = ref<View>('top')
const currentCatId = ref<CatId>('nekoshi')
const currentDetailTab = ref<'profile' | 'weight' | 'food' | 'medicine' | 'visit' | 'symptom'>('profile')

// ---- 水履歴フィルター ----
const waterFilter = ref<'all' | '1F' | '2F'>('all')

const filteredWaterLogs = computed(() => {
  const logs = Object.values(catsStore.waterLog)
  const filtered = waterFilter.value === 'all' ? logs : logs.filter((l) => l.location === waterFilter.value)
  return filtered.sort((a, b) => b.ts - a.ts)
})

const waterLogsByDay = computed(() => {
  const byDay: Record<string, typeof filteredWaterLogs.value> = {}
  filteredWaterLogs.value.forEach((l) => {
    const d = new Date(l.ts)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    if (!byDay[key]) byDay[key] = []
    byDay[key].push(l)
  })
  return byDay
})

const waterLogDayKeys = computed(() =>
  Object.keys(waterLogsByDay.value).sort((a, b) => b.localeCompare(a))
)

// ---- 猫情報ヘルパー ----
function catName(catId: string) {
  return catsStore.getCatProfile(catId).name || CAT_DEFAULTS[catId as CatId]?.name || catId
}

function calcAge(birthday?: string) {
  if (!birthday) return ''
  const b = new Date(birthday)
  const now = new Date()
  const totalMonths = (now.getFullYear() - b.getFullYear()) * 12 + (now.getMonth() - b.getMonth())
  if (totalMonths < 12) return totalMonths + 'ヶ月'
  const y = Math.floor(totalMonths / 12)
  const m = totalMonths % 12
  return m > 0 ? y + '歳' + m + 'ヶ月' : y + '歳'
}

function lastWater(location: '1F' | '2F') {
  const logs = Object.values(catsStore.waterLog).filter((l) => l.location === location)
  return logs.sort((a, b) => b.ts - a.ts)[0] || null
}

function lastQuickLog(catId: string, type: 'food' | 'med') {
  const cat = catsStore.getCat(catId)
  const logs = cat.quick_log ? Object.values(cat.quick_log).filter((l) => l.type === type) : []
  return logs.sort((a, b) => b.ts - a.ts)[0] || null
}

function lastWeight(catId: string) {
  const cat = catsStore.getCat(catId)
  const weights = cat.weight ? Object.values(cat.weight) : []
  return weights.sort((a, b) => b.ts - a.ts)[0] || null
}

function lastTodayNote(catId: string) {
  const cat = catsStore.getCat(catId)
  const notes = cat.today_notes ? Object.values(cat.today_notes) : []
  return notes.sort((a, b) => b.ts - a.ts)[0] || null
}

// ---- 今日の様子モーダル ----
const todayNoteModalCatId = ref<string | null>(null)
const todayNoteText = ref('')

function openTodayNoteModal(catId: string) {
  todayNoteModalCatId.value = catId
  todayNoteText.value = ''
}

function closeTodayNoteModal() {
  todayNoteModalCatId.value = null
}

async function submitTodayNote() {
  const catId = todayNoteModalCatId.value
  if (!catId || !todayNoteText.value.trim()) return
  await catsStore.addTodayNote(catId, todayNoteText.value.trim())
  appStore.showToast(`${catName(catId)}の様子を記録したよ📝`)
  closeTodayNoteModal()
}

function todayNotesForCat(catId: string) {
  const cat = catsStore.getCat(catId)
  if (!cat.today_notes) return []
  return Object.values(cat.today_notes)
    .filter((n) => n.date === todayStr())
    .sort((a, b) => b.ts - a.ts)
}

// ---- 体重モーダル ----
const weightModalCatId = ref<string | null>(null)
const weightVal = ref('')
const weightDate = ref(todayStr())

function openWeightModal(catId: string) {
  weightModalCatId.value = catId
  weightVal.value = ''
  weightDate.value = todayStr()
}

async function submitWeight() {
  const catId = weightModalCatId.value
  if (!catId) return
  const val = parseFloat(weightVal.value)
  if (!val || !weightDate.value) return
  await catsStore.addWeight(catId, val, weightDate.value)
  appStore.showToast('体重を記録したよ⚖️')
  weightModalCatId.value = null
  if (currentView.value === 'detail' && currentDetailTab.value === 'weight') {
    // trigger reactivity already done by store
  }
}

// ---- 詳細画面 ----
function openDetail(catId: CatId) {
  currentCatId.value = catId
  currentDetailTab.value = 'profile'
  currentView.value = 'detail'
}

// ---- プロフィール編集 ----
const profileForm = ref({
  name: '',
  birthday: '',
  gender: '',
  breed: '',
  weight_min: '',
  weight_max: '',
  hospital_name: '',
  hospital_tel: '',
  hospital_url: '',
  memo: '',
})

function initProfileForm() {
  const prof = catsStore.getCatProfile(currentCatId.value)
  profileForm.value = {
    name: prof.name || CAT_DEFAULTS[currentCatId.value].name,
    birthday: prof.birthday || '',
    gender: prof.gender || '',
    breed: prof.breed || '',
    weight_min: prof.weight_min != null ? String(prof.weight_min) : '',
    weight_max: prof.weight_max != null ? String(prof.weight_max) : '',
    hospital_name: prof.hospital_name || '',
    hospital_tel: prof.hospital_tel || '',
    hospital_url: prof.hospital_url || '',
    memo: prof.memo || '',
  }
}

async function saveProfile() {
  const prof = catsStore.getCatProfile(currentCatId.value)
  await catsStore.saveProfile(currentCatId.value, {
    ...prof,
    name: profileForm.value.name,
    birthday: profileForm.value.birthday,
    gender: profileForm.value.gender,
    breed: profileForm.value.breed,
    weight_min: profileForm.value.weight_min ? parseFloat(profileForm.value.weight_min) : null,
    weight_max: profileForm.value.weight_max ? parseFloat(profileForm.value.weight_max) : null,
    hospital_name: profileForm.value.hospital_name,
    hospital_tel: profileForm.value.hospital_tel,
    hospital_url: profileForm.value.hospital_url,
    memo: profileForm.value.memo,
  })
  appStore.showToast('プロフィールを保存したよ！')
}

async function onIconChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    await catsStore.uploadCatIcon(currentCatId.value, file)
    appStore.showToast('アイコンを更新したよ！')
  } catch {
    appStore.showToast('アップロードに失敗したよ…')
  }
  input.value = ''
}

// ---- 体重タブ ----
const weightTabVal = ref('')
const weightTabDate = ref(todayStr())

function weightTabWeights(catId: string) {
  const cat = catsStore.getCat(catId)
  const ws = cat.weight ? Object.values(cat.weight) : []
  return ws.sort((a, b) => b.ts - a.ts)
}

async function addWeightFromTab() {
  const val = parseFloat(weightTabVal.value)
  const date = weightTabDate.value
  if (!val || !date) return
  await catsStore.addWeight(currentCatId.value, val, date)
  appStore.showToast('体重を記録したよ⚖️')
  weightTabVal.value = ''
  weightTabDate.value = todayStr()
}

// ---- ごはんタブ ----
const foodModalOpen = ref(false)
const foodForm = ref({ name: '', maker: '', type: '', kcal: '' })

async function submitFood() {
  if (!foodForm.value.name.trim()) return
  await catsStore.addFood(currentCatId.value, {
    name: foodForm.value.name.trim(),
    maker: foodForm.value.maker.trim(),
    type: foodForm.value.type,
    kcal: foodForm.value.kcal || null,
  })
  appStore.showToast('ごはんを登録したよ🍚')
  foodModalOpen.value = false
  foodForm.value = { name: '', maker: '', type: '', kcal: '' }
}

// ---- 投薬タブ ----
const medModalOpen = ref(false)
const medForm = ref({ name: '', dose: '', freq: '', next_date: '' })

async function submitMedicine() {
  if (!medForm.value.name.trim()) return
  await catsStore.addMedicine(currentCatId.value, {
    name: medForm.value.name.trim(),
    dose: medForm.value.dose.trim(),
    freq: medForm.value.freq.trim(),
    next_date: medForm.value.next_date,
  })
  appStore.showToast('薬を登録したよ💊')
  medModalOpen.value = false
  medForm.value = { name: '', dose: '', freq: '', next_date: '' }
}

async function logMedNow(medId: string, medName: string) {
  await catsStore.logMed(currentCatId.value, medId, medName)
  appStore.showToast(`${medName}を記録したよ💊`)
}

// ---- 受診タブ ----
const visitModalOpen = ref(false)
const visitForm = ref({ date: todayStr(), hospital: '', diagnosis: '', cost: '' })
const visitFiles = ref<File[]>([])

function onVisitFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  visitFiles.value = input.files ? [...input.files] : []
}

async function submitVisit() {
  await catsStore.addVisit(
    currentCatId.value,
    {
      date: visitForm.value.date,
      hospital: visitForm.value.hospital.trim(),
      diagnosis: visitForm.value.diagnosis.trim(),
      cost: visitForm.value.cost || null,
    },
    visitFiles.value,
  )
  appStore.showToast('受診記録を追加したよ🏥')
  visitModalOpen.value = false
  visitForm.value = { date: todayStr(), hospital: '', diagnosis: '', cost: '' }
  visitFiles.value = []
}

// ---- 症状タブ ----
const symptomModalOpen = ref(false)
const symptomForm = ref({ date: todayStr(), level: 'low' as 'low' | 'mid' | 'high', text: '' })

async function submitSymptom() {
  if (!symptomForm.value.text.trim()) return
  await catsStore.addSymptom(currentCatId.value, {
    date: symptomForm.value.date,
    level: symptomForm.value.level,
    text: symptomForm.value.text.trim(),
  })
  appStore.showToast('症状を記録したよ📝')
  symptomModalOpen.value = false
  symptomForm.value = { date: todayStr(), level: 'low', text: '' }
}

// ---- 詳細タブ切り替え ----
function switchDetailTab(tab: typeof currentDetailTab.value) {
  currentDetailTab.value = tab
  if (tab === 'profile') initProfileForm()
}

// 初期化
function onOpenDetail(catId: CatId) {
  openDetail(catId)
  initProfileForm()
}

// 写真オーバーレイ
const photoOverlayUrl = ref<string | null>(null)

function fmtTime2(ts: number) {
  const d = new Date(ts)
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
}

function dayLabel(key: string) {
  const [y, m, d] = key.split('-')
  return `${y}年${Number(m)}月${Number(d)}日`
}
</script>

<template>
  <div class="cats-container">

    <!-- ===== トップビュー ===== -->
    <template v-if="currentView === 'top'">
      <div class="cats-scroll">
        <!-- 水セクション -->
        <div class="water-section">
          <div class="water-section-title">💧 お水</div>
          <div class="water-btns">
            <button class="cat-quick-btn" style="flex:1" @click="catsStore.logWater('1F').then(() => appStore.showToast('💧 1Fの水を替えたよ'))">
              <span class="qicon" style="font-size:15px">🏠</span>
              <span style="font-size:12px;font-weight:700">1F</span>
              <span class="quick-meta">{{ lastWater('1F') ? fmtTimeAgo(lastWater('1F')!.ts) + '（' + lastWater('1F')!.who + '）' : '未記録' }}</span>
            </button>
            <button class="cat-quick-btn" style="flex:1" @click="catsStore.logWater('2F').then(() => appStore.showToast('💧 2Fの水を替えたよ'))">
              <span class="qicon" style="font-size:15px">🛏</span>
              <span style="font-size:12px;font-weight:700">2F</span>
              <span class="quick-meta">{{ lastWater('2F') ? fmtTimeAgo(lastWater('2F')!.ts) + '（' + lastWater('2F')!.who + '）' : '未記録' }}</span>
            </button>
          </div>
          <button class="water-history-btn" @click="currentView = 'water-history'; waterFilter = 'all'">履歴</button>
        </div>

        <!-- 猫カード -->
        <div v-for="catId in CAT_IDS" :key="catId" class="cat-card">
          <div class="cat-card-header">
            <div class="cat-avatar">
              <img v-if="catsStore.getCatProfile(catId).icon_url" :src="catsStore.getCatProfile(catId).icon_url!" />
              <span v-else>{{ CAT_DEFAULTS[catId].emoji }}</span>
            </div>
            <div class="cat-info">
              <div class="cat-name">{{ catName(catId) }}</div>
              <div class="cat-age">
                {{ calcAge(catsStore.getCatProfile(catId).birthday) }}
                {{ catsStore.getCatProfile(catId).breed ? ' · ' + catsStore.getCatProfile(catId).breed : '' }}
              </div>
            </div>
            <button class="cat-detail-btn" @click="onOpenDetail(catId)">くわしく →</button>
          </div>
          <div class="cat-quick-btns">
            <button class="cat-quick-btn" @click="catsStore.quickLog(catId, 'food').then(() => appStore.showToast('ごはんあげたよ🍚'))">
              <span class="qicon">🍚</span>
              <span style="font-size:12px;font-weight:700">ごはん</span>
              <span class="quick-meta">{{ lastQuickLog(catId, 'food') ? fmtTimeAgo(lastQuickLog(catId, 'food')!.ts) + '（' + lastQuickLog(catId, 'food')!.who + '）' : '未記録' }}</span>
            </button>
            <button class="cat-quick-btn" @click="openWeightModal(catId)">
              <span class="qicon">⚖️</span>
              <span style="font-size:12px;font-weight:700">体重</span>
              <span class="quick-meta">{{ lastWeight(catId) ? lastWeight(catId)!.value + 'kg（' + lastWeight(catId)!.who + '）' : '未記録' }}</span>
            </button>
            <button class="cat-quick-btn" @click="openTodayNoteModal(catId)">
              <span class="qicon">📝</span>
              <span style="font-size:12px;font-weight:700">今日の様子</span>
              <span class="quick-meta">{{ lastTodayNote(catId) ? lastTodayNote(catId)!.time + '（' + lastTodayNote(catId)!.who + '）' : '未記録' }}</span>
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- ===== 水履歴 ===== -->
    <template v-else-if="currentView === 'water-history'">
      <div class="water-history-header">
        <button class="back-btn" @click="currentView = 'top'">‹</button>
        <div class="water-history-title">💧 水かえ履歴</div>
      </div>
      <div class="water-history-filter">
        <button
          v-for="f in ['all', '1F', '2F'] as const"
          :key="f"
          class="water-filter-btn"
          :class="{ active: waterFilter === f }"
          @click="waterFilter = f"
        >{{ f === 'all' ? 'すべて' : f === '1F' ? '🏠 1F' : '🛏 2F' }}</button>
      </div>
      <div class="water-history-list">
        <div v-if="!waterLogDayKeys.length" class="empty">まだ記録がないよ</div>
        <div v-for="day in waterLogDayKeys" :key="day" class="water-log-day">
          <div class="water-log-day-label">{{ dayLabel(day) }}</div>
          <div
            v-for="log in waterLogsByDay[day]"
            :key="log.id"
            class="water-log-item"
          >
            <div class="water-log-icon">{{ log.location === '1F' ? '🏠' : '🛏' }}</div>
            <div class="water-log-info">
              <div class="water-log-loc">{{ log.location }}</div>
              <div class="water-log-meta">{{ fmtTime2(log.ts) }}　{{ log.who }}</div>
            </div>
            <button class="water-log-del" @click="catsStore.delWaterLog(log.id)">✕</button>
          </div>
        </div>
      </div>
    </template>

    <!-- ===== 詳細ビュー ===== -->
    <template v-else-if="currentView === 'detail'">
      <!-- ヘッダー -->
      <div class="cat-detail-header">
        <button class="back-btn" @click="currentView = 'top'">‹</button>
        <div class="cat-detail-avatar">
          <img v-if="catsStore.getCatProfile(currentCatId).icon_url" :src="catsStore.getCatProfile(currentCatId).icon_url!" />
          <span v-else style="font-size:24px">{{ CAT_DEFAULTS[currentCatId].emoji }}</span>
        </div>
        <div class="cat-detail-name">{{ catName(currentCatId) }}</div>
      </div>

      <!-- タブ -->
      <div class="cat-tabs">
        <div
          v-for="tab in ['profile', 'weight', 'food', 'medicine', 'visit', 'symptom'] as const"
          :key="tab"
          class="cat-tab"
          :class="{ active: currentDetailTab === tab }"
          @click="switchDetailTab(tab)"
        >{{ { profile: '👤プロフィール', weight: '📊体重', food: '🍚ごはん', medicine: '💊投薬', visit: '🏥受診', symptom: '📝症状' }[tab] }}</div>
      </div>

      <!-- タブコンテンツ -->
      <div class="cat-tab-content">

        <!-- プロフィール -->
        <template v-if="currentDetailTab === 'profile'">
          <div class="profile-form">
            <div class="profile-avatar-wrap">
              <div class="profile-avatar-img">
                <img v-if="catsStore.getCatProfile(currentCatId).icon_url" :src="catsStore.getCatProfile(currentCatId).icon_url!" />
                <span v-else>{{ CAT_DEFAULTS[currentCatId].emoji }}</span>
              </div>
              <label class="btn-upload" style="font-size:13px">
                📷 アイコン変更
                <input type="file" accept="image/*" style="display:none" @change="onIconChange" />
              </label>
            </div>
            <div class="form-row">
              <div class="form-label">名前</div>
              <input v-model="profileForm.name" class="form-input" />
            </div>
            <div class="form-row-2">
              <div class="form-row">
                <div class="form-label">誕生日</div>
                <input v-model="profileForm.birthday" type="date" class="form-input" />
              </div>
              <div class="form-row">
                <div class="form-label">性別</div>
                <select v-model="profileForm.gender" class="form-input">
                  <option value="">-</option>
                  <option value="オス">オス</option>
                  <option value="メス">メス</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-label">品種</div>
              <input v-model="profileForm.breed" class="form-input" />
            </div>
            <div class="form-row-2">
              <div class="form-row">
                <div class="form-label">目標下限 (kg)</div>
                <input v-model="profileForm.weight_min" type="number" step="0.1" class="form-input" />
              </div>
              <div class="form-row">
                <div class="form-label">目標上限 (kg)</div>
                <input v-model="profileForm.weight_max" type="number" step="0.1" class="form-input" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-label">かかりつけ病院</div>
              <input v-model="profileForm.hospital_name" class="form-input" placeholder="病院名" />
              <input v-model="profileForm.hospital_tel" type="tel" class="form-input" placeholder="電話番号" style="margin-top:6px" />
              <input v-model="profileForm.hospital_url" type="url" class="form-input" placeholder="URL" style="margin-top:6px" />
              <a v-if="profileForm.hospital_url" :href="profileForm.hospital_url" target="_blank" class="hospital-link">🔗 病院サイトを開く</a>
            </div>
            <div class="form-row">
              <div class="form-label">一言メモ</div>
              <input v-model="profileForm.memo" class="form-input" />
            </div>
            <button class="form-save-btn" @click="saveProfile">保存する</button>
          </div>
        </template>

        <!-- 体重 -->
        <template v-else-if="currentDetailTab === 'weight'">
          <div class="weight-add-bar">
            <input v-model="weightTabVal" type="number" step="0.01" placeholder="kg" class="weight-input" />
            <input v-model="weightTabDate" type="date" class="form-input" style="flex:1" />
            <button class="btn-send" @click="addWeightFromTab">追加</button>
          </div>
          <div class="weight-list">
            <div v-if="!weightTabWeights(currentCatId).length" class="empty">まだ記録がないよ</div>
            <div v-for="w in weightTabWeights(currentCatId)" :key="w.id" class="weight-item">
              <span class="weight-val">{{ w.value }}kg</span>
              <span class="weight-date">{{ w.date }}{{ w.who ? ' （' + w.who + '）' : '' }}</span>
              <button class="weight-del" @click="catsStore.delWeight(currentCatId, w.id)">✕</button>
            </div>
          </div>
        </template>

        <!-- ごはん -->
        <template v-else-if="currentDetailTab === 'food'">
          <button class="form-save-btn" style="margin-bottom:14px" @click="foodModalOpen = true; foodForm = { name: '', maker: '', type: '', kcal: '' }">＋ ごはんを登録する</button>
          <div v-if="!Object.values(catsStore.getCat(currentCatId).food_types || {}).length" class="empty">まだ登録がないよ</div>
          <div v-for="f in Object.values(catsStore.getCat(currentCatId).food_types || {})" :key="f.id" class="food-card">
            <button class="food-del" @click="catsStore.delFood(currentCatId, f.id)">✕</button>
            <div class="food-name">{{ f.name }}</div>
            <div class="food-meta">{{ f.maker }}{{ f.type ? ' · ' + f.type : '' }}{{ f.kcal ? ' · ' + f.kcal + 'kcal/100g' : '' }}</div>
          </div>
          <!-- 記録ログ -->
          <div v-if="Object.values(catsStore.getCat(currentCatId).quick_log || {}).filter(l => l.type === 'food').length" style="margin-top:18px">
            <div class="section-label">📋 ごはん記録</div>
            <div
              v-for="l in Object.values(catsStore.getCat(currentCatId).quick_log || {}).filter(l => l.type === 'food').sort((a,b) => b.ts - a.ts).slice(0, 30)"
              :key="l.id"
              class="food-log-entry"
            >
              <span>🍚 ごはん</span>
              <span>{{ new Date(l.ts).getMonth() + 1 }}/{{ new Date(l.ts).getDate() }} {{ fmtTime2(l.ts) }}（{{ l.who }}）</span>
            </div>
          </div>
        </template>

        <!-- 投薬 -->
        <template v-else-if="currentDetailTab === 'medicine'">
          <button class="form-save-btn" style="margin-bottom:14px" @click="medModalOpen = true; medForm = { name: '', dose: '', freq: '', next_date: '' }">＋ 薬を登録する</button>
          <div v-if="!Object.values(catsStore.getCat(currentCatId).medicine || {}).length" class="empty">まだ登録がないよ</div>
          <div v-for="m in Object.values(catsStore.getCat(currentCatId).medicine || {})" :key="m.id" class="med-card">
            <button class="med-del" @click="catsStore.delMedicine(currentCatId, m.id)">✕</button>
            <div class="med-name">💊 {{ m.name }}</div>
            <div class="med-meta">{{ m.dose ? '量: ' + m.dose : '' }}{{ m.freq ? ' · ' + m.freq : '' }}{{ m.next_date ? ' · 次回: ' + m.next_date : '' }}</div>
            <button class="med-log-btn" @click="logMedNow(m.id, m.name)">今日投薬した</button>
          </div>
        </template>

        <!-- 受診 -->
        <template v-else-if="currentDetailTab === 'visit'">
          <button class="form-save-btn" style="margin-bottom:14px" @click="visitModalOpen = true; visitForm = { date: todayStr(), hospital: '', diagnosis: '', cost: '' }; visitFiles = []">＋ 受診を記録する</button>
          <div v-if="!Object.values(catsStore.getCat(currentCatId).visits || {}).length" class="empty">まだ記録がないよ</div>
          <div
            v-for="v in Object.values(catsStore.getCat(currentCatId).visits || {}).sort((a, b) => b.ts - a.ts)"
            :key="v.id"
            class="visit-card"
          >
            <button class="visit-del" @click="catsStore.delVisit(currentCatId, v.id)">✕</button>
            <div class="visit-date">{{ v.date }}</div>
            <div class="visit-hospital">🏥 {{ v.hospital }}<span v-if="v.who" style="font-size:11px;color:var(--text-muted)">（{{ v.who }}）</span></div>
            <div v-if="v.diagnosis" class="visit-diag">{{ v.diagnosis }}</div>
            <div v-if="v.cost" class="visit-cost">¥{{ Number(v.cost).toLocaleString() }}</div>
            <div v-if="v.photos?.length" class="visit-photos">
              <img
                v-for="(p, pi) in v.photos"
                :key="pi"
                class="visit-photo"
                :src="p"
                @click="photoOverlayUrl = p"
              />
            </div>
          </div>
        </template>

        <!-- 症状 -->
        <template v-else-if="currentDetailTab === 'symptom'">
          <button class="form-save-btn" style="margin-bottom:14px" @click="symptomModalOpen = true; symptomForm = { date: todayStr(), level: 'low', text: '' }">＋ 症状を記録する</button>
          <div v-if="!Object.values(catsStore.getCat(currentCatId).symptoms || {}).length" class="empty">まだ記録がないよ</div>
          <div
            v-for="s in Object.values(catsStore.getCat(currentCatId).symptoms || {}).sort((a, b) => b.ts - a.ts)"
            :key="s.id"
            class="symptom-card"
          >
            <button class="symptom-del" @click="catsStore.delSymptom(currentCatId, s.id)">✕</button>
            <span class="symptom-level" :class="s.level">{{ { low: '軽微', mid: '注意', high: '要受診' }[s.level] }}</span>
            <span class="symptom-date" style="margin-left:8px">{{ s.date }}</span>
            <div class="symptom-text">{{ s.text }}</div>
            <div v-if="s.who" style="font-size:11px;color:var(--text-muted);margin-top:4px">（{{ s.who }}）</div>
          </div>
        </template>

      </div>
    </template>

    <!-- ===== モーダル群 ===== -->

    <!-- 今日の様子 -->
    <div v-if="todayNoteModalCatId" class="modal-overlay" @click.self="closeTodayNoteModal">
      <div class="modal-box">
        <div class="modal-title">📝 {{ catName(todayNoteModalCatId) }}の今日の様子</div>
        <div style="margin-bottom:12px;max-height:160px;overflow-y:auto">
          <div v-if="!todayNotesForCat(todayNoteModalCatId).length" style="font-size:13px;color:var(--text-muted);padding:8px 0">今日はまだ記録がないよ</div>
          <div
            v-for="n in todayNotesForCat(todayNoteModalCatId)"
            :key="n.id"
            style="padding:8px 0;border-bottom:1px solid var(--border);font-size:13px"
          >
            <span style="color:var(--text-muted);font-size:11px">{{ n.time }}（{{ n.who }}）</span><br />
            {{ n.text }}
          </div>
        </div>
        <textarea
          v-model="todayNoteText"
          class="textarea-input"
          placeholder="今日の様子を書いてね（食欲・元気・気になることなど）"
          style="min-height:90px"
        />
        <div class="modal-btns">
          <button class="modal-cancel" @click="closeTodayNoteModal">キャンセル</button>
          <button class="modal-ok" @click="submitTodayNote">OK</button>
        </div>
      </div>
    </div>

    <!-- 体重（トップから） -->
    <div v-if="weightModalCatId" class="modal-overlay" @click.self="weightModalCatId = null">
      <div class="modal-box">
        <div class="modal-title">⚖️ 体重を記録</div>
        <input v-model="weightVal" type="number" step="0.01" placeholder="例：4.20" class="form-input" style="margin-bottom:8px" />
        <input v-model="weightDate" type="date" class="form-input" />
        <div class="modal-btns">
          <button class="modal-cancel" @click="weightModalCatId = null">キャンセル</button>
          <button class="modal-ok" @click="submitWeight">OK</button>
        </div>
      </div>
    </div>

    <!-- ごはん登録 -->
    <div v-if="foodModalOpen" class="modal-overlay" @click.self="foodModalOpen = false">
      <div class="modal-box">
        <div class="modal-title">🍚 ごはんを登録</div>
        <input v-model="foodForm.name" class="form-input" placeholder="商品名" style="margin-bottom:8px" />
        <input v-model="foodForm.maker" class="form-input" placeholder="メーカー名" style="margin-bottom:8px" />
        <select v-model="foodForm.type" class="form-input" style="margin-bottom:8px">
          <option value="">種類を選択</option>
          <option value="ドライ">ドライ</option>
          <option value="ウェット">ウェット</option>
          <option value="おやつ">おやつ</option>
          <option value="療法食">療法食</option>
        </select>
        <input v-model="foodForm.kcal" type="number" class="form-input" placeholder="kcal/100g（任意）" />
        <div class="modal-btns">
          <button class="modal-cancel" @click="foodModalOpen = false">キャンセル</button>
          <button class="modal-ok" @click="submitFood">OK</button>
        </div>
      </div>
    </div>

    <!-- 薬登録 -->
    <div v-if="medModalOpen" class="modal-overlay" @click.self="medModalOpen = false">
      <div class="modal-box">
        <div class="modal-title">💊 薬を登録</div>
        <input v-model="medForm.name" class="form-input" placeholder="薬の名前" style="margin-bottom:8px" />
        <input v-model="medForm.dose" class="form-input" placeholder="量（例：0.5ml）" style="margin-bottom:8px" />
        <input v-model="medForm.freq" class="form-input" placeholder="頻度（例：毎日・週1回）" style="margin-bottom:8px" />
        <div class="form-label" style="margin-bottom:4px">次回投薬日</div>
        <input v-model="medForm.next_date" type="date" class="form-input" />
        <div class="modal-btns">
          <button class="modal-cancel" @click="medModalOpen = false">キャンセル</button>
          <button class="modal-ok" @click="submitMedicine">OK</button>
        </div>
      </div>
    </div>

    <!-- 受診記録 -->
    <div v-if="visitModalOpen" class="modal-overlay" @click.self="visitModalOpen = false">
      <div class="modal-box">
        <div class="modal-title">🏥 受診を記録</div>
        <input v-model="visitForm.date" type="date" class="form-input" style="margin-bottom:8px" />
        <input v-model="visitForm.hospital" class="form-input" placeholder="病院名" style="margin-bottom:8px" />
        <textarea v-model="visitForm.diagnosis" class="textarea-input" placeholder="診断・メモ" style="margin-bottom:8px" />
        <input v-model="visitForm.cost" type="number" class="form-input" placeholder="費用（円）" style="margin-bottom:8px" />
        <label class="btn-upload" style="display:inline-flex;margin-bottom:8px;font-size:13px">
          📷 写真を追加
          <input type="file" accept="image/*" multiple style="display:none" @change="onVisitFileChange" />
        </label>
        <div v-if="visitFiles.length" style="font-size:12px;color:var(--text-muted)">{{ visitFiles.length }}枚選択中</div>
        <div class="modal-btns">
          <button class="modal-cancel" @click="visitModalOpen = false">キャンセル</button>
          <button class="modal-ok" @click="submitVisit">OK</button>
        </div>
      </div>
    </div>

    <!-- 症状記録 -->
    <div v-if="symptomModalOpen" class="modal-overlay" @click.self="symptomModalOpen = false">
      <div class="modal-box">
        <div class="modal-title">📝 症状を記録</div>
        <input v-model="symptomForm.date" type="date" class="form-input" style="margin-bottom:8px" />
        <select v-model="symptomForm.level" class="form-input" style="margin-bottom:8px">
          <option value="low">軽微</option>
          <option value="mid">注意</option>
          <option value="high">要受診</option>
        </select>
        <textarea v-model="symptomForm.text" class="textarea-input" placeholder="気になる症状を書いてね" />
        <div class="modal-btns">
          <button class="modal-cancel" @click="symptomModalOpen = false">キャンセル</button>
          <button class="modal-ok" @click="submitSymptom">OK</button>
        </div>
      </div>
    </div>

    <!-- 写真オーバーレイ -->
    <div v-if="photoOverlayUrl" class="photo-overlay" @click.self="photoOverlayUrl = null">
      <button class="photo-overlay-close" @click="photoOverlayUrl = null">✕</button>
      <img :src="photoOverlayUrl" />
    </div>

  </div>
</template>

<style scoped>
.cats-container {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

/* ===== トップ ===== */
.cats-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 12px 14px;
  -webkit-overflow-scrolling: touch;
}

.water-section {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 12px;
}
.water-section-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-muted);
  margin-bottom: 8px;
}
.water-btns {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}
.water-history-btn {
  width: 100%;
  padding: 7px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: transparent;
  font-size: 12px;
  cursor: pointer;
  font-family: inherit;
  color: var(--text-muted);
}

.cat-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 12px;
}
.cat-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.cat-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--accent-light);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}
.cat-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.cat-info {
  flex: 1;
}
.cat-name {
  font-size: 15px;
  font-weight: 700;
}
.cat-age {
  font-size: 12px;
  color: var(--text-muted);
}
.cat-detail-btn {
  padding: 6px 12px;
  border: 1.5px solid var(--border);
  background: transparent;
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
}

.cat-quick-btns {
  display: flex;
  gap: 6px;
}
.cat-quick-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 6px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg);
  cursor: pointer;
  font-family: inherit;
  gap: 2px;
}
.cat-quick-btn:active {
  background: var(--accent-light);
}
.qicon {
  font-size: 20px;
}
.quick-meta {
  font-size: 10px;
  color: var(--text-muted);
  font-weight: 400;
  text-align: center;
}

/* ===== 水履歴 ===== */
.water-history-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  gap: 10px;
  flex-shrink: 0;
}
.back-btn {
  background: none;
  border: none;
  font-size: 22px;
  cursor: pointer;
  color: var(--text-muted);
  padding: 0;
}
.water-history-title {
  font-size: 16px;
  font-weight: 700;
}
.water-history-filter {
  display: flex;
  gap: 8px;
  padding: 8px 14px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.water-filter-btn {
  padding: 5px 14px;
  border-radius: 20px;
  border: 1.5px solid var(--border);
  background: transparent;
  font-size: 12px;
  cursor: pointer;
  font-family: inherit;
  color: var(--text-muted);
}
.water-filter-btn.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
  font-weight: 600;
}
.water-history-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px 14px;
}
.water-log-day {
  margin-bottom: 12px;
}
.water-log-day-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-muted);
  margin-bottom: 6px;
}
.water-log-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  margin-bottom: 4px;
}
.water-log-icon {
  font-size: 18px;
}
.water-log-info {
  flex: 1;
}
.water-log-loc {
  font-size: 13px;
  font-weight: 600;
}
.water-log-meta {
  font-size: 11px;
  color: var(--text-muted);
  font-family: 'DM Mono', monospace;
}
.water-log-del {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  font-size: 13px;
}
.water-log-del:hover {
  color: var(--danger);
}

/* ===== 詳細 ===== */
.cat-detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.cat-detail-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--accent-light);
  display: flex;
  align-items: center;
  justify-content: center;
}
.cat-detail-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.cat-detail-name {
  font-size: 16px;
  font-weight: 700;
}

.cat-tabs {
  display: flex;
  overflow-x: auto;
  background: var(--surface);
  border-bottom: 2px solid var(--border);
  flex-shrink: 0;
  -webkit-overflow-scrolling: touch;
}
.cat-tab {
  padding: 10px 14px;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  color: var(--text-muted);
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  transition: color 0.15s;
}
.cat-tab.active {
  color: var(--accent);
  border-bottom-color: var(--accent);
  font-weight: 700;
}

.cat-tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 14px;
  -webkit-overflow-scrolling: touch;
}

/* プロフィール */
.profile-form {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.profile-avatar-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}
.profile-avatar-img {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--accent-light);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}
.profile-avatar-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.form-row {
  margin-bottom: 12px;
}
.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 12px;
}
.form-label {
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 600;
  margin-bottom: 4px;
}
.form-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 14px;
  background: var(--bg);
  outline: none;
  font-family: inherit;
  color: var(--text);
  box-sizing: border-box;
}
.form-input:focus {
  border-color: var(--accent);
}
.hospital-link {
  display: inline-block;
  margin-top: 6px;
  font-size: 12px;
  color: var(--accent);
}
.form-save-btn {
  padding: 12px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  width: 100%;
  transition: opacity 0.15s;
}
.form-save-btn:active {
  opacity: 0.8;
}
.btn-upload {
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 9px 16px;
  font-size: 14px;
  cursor: pointer;
  font-family: inherit;
  font-weight: 500;
  white-space: nowrap;
  transition: opacity 0.15s;
  display: inline-flex;
  align-items: center;
}

/* 体重 */
.weight-add-bar {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
}
.weight-input {
  width: 80px;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 14px;
  background: var(--bg);
  outline: none;
  font-family: inherit;
  color: var(--text);
}
.weight-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.weight-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
}
.weight-val {
  font-size: 16px;
  font-weight: 700;
  font-family: 'DM Mono', monospace;
  color: var(--accent);
  min-width: 60px;
}
.weight-date {
  flex: 1;
  font-size: 12px;
  color: var(--text-muted);
}
.weight-del {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  font-size: 13px;
}
.weight-del:hover {
  color: var(--danger);
}

/* ごはん */
.food-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 12px;
  margin-bottom: 8px;
  position: relative;
}
.food-del {
  position: absolute;
  top: 8px;
  right: 8px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  font-size: 13px;
}
.food-del:hover {
  color: var(--danger);
}
.food-name {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 2px;
}
.food-meta {
  font-size: 12px;
  color: var(--text-muted);
}
.section-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  margin-bottom: 8px;
}
.food-log-entry {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 13px;
  border-bottom: 1px solid var(--border);
}

/* 投薬 */
.med-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 12px;
  margin-bottom: 8px;
  position: relative;
}
.med-del {
  position: absolute;
  top: 8px;
  right: 8px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  font-size: 13px;
}
.med-del:hover {
  color: var(--danger);
}
.med-name {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 2px;
}
.med-meta {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 6px;
}
.med-log-btn {
  padding: 5px 12px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  font-family: inherit;
  font-weight: 600;
}

/* 受診 */
.visit-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-left: 3px solid var(--accent);
  border-radius: 10px;
  padding: 10px 12px;
  margin-bottom: 8px;
  position: relative;
}
.visit-del {
  position: absolute;
  top: 8px;
  right: 8px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  font-size: 13px;
}
.visit-del:hover {
  color: var(--danger);
}
.visit-date {
  font-size: 12px;
  color: var(--text-muted);
  font-family: 'DM Mono', monospace;
  margin-bottom: 4px;
}
.visit-hospital {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
}
.visit-diag {
  font-size: 13px;
  color: var(--text);
  margin-bottom: 4px;
}
.visit-cost {
  font-size: 12px;
  color: var(--text-muted);
  font-family: 'DM Mono', monospace;
}
.visit-photos {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 8px;
}
.visit-photo {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  object-fit: cover;
  cursor: pointer;
}

/* 症状 */
.symptom-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 12px;
  margin-bottom: 8px;
  position: relative;
}
.symptom-del {
  position: absolute;
  top: 8px;
  right: 8px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  font-size: 13px;
}
.symptom-del:hover {
  color: var(--danger);
}
.symptom-level {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
}
.symptom-level.low {
  background: #e8f5e9;
  color: #2e7d32;
}
.symptom-level.mid {
  background: #fff3e0;
  color: #e65100;
}
.symptom-level.high {
  background: #ffebee;
  color: var(--danger);
}
.symptom-date {
  font-size: 12px;
  color: var(--text-muted);
  font-family: 'DM Mono', monospace;
}
.symptom-text {
  font-size: 13px;
  margin-top: 6px;
}

/* 共通 */
.empty {
  text-align: center;
  padding: 30px 0;
  color: var(--text-muted);
  font-size: 14px;
}

/* モーダル */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.modal-box {
  background: var(--surface);
  border-radius: 16px;
  padding: 20px;
  width: 100%;
  max-width: 360px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  max-height: 90vh;
  overflow-y: auto;
}
.modal-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 14px;
}
.modal-btns {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 14px;
}
.modal-cancel {
  padding: 8px 18px;
  border: 1.5px solid var(--border);
  background: transparent;
  border-radius: 99px;
  font-size: 14px;
  cursor: pointer;
  font-family: inherit;
}
.modal-ok {
  padding: 8px 18px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 99px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}
.textarea-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 14px;
  background: var(--bg);
  outline: none;
  font-family: inherit;
  color: var(--text);
  min-height: 70px;
  resize: vertical;
  box-sizing: border-box;
}
.textarea-input:focus {
  border-color: var(--accent);
}
.btn-send {
  padding: 8px 14px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
}

/* 写真オーバーレイ */
.photo-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.92);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.photo-overlay img {
  max-width: 100%;
  max-height: 85vh;
  object-fit: contain;
  border-radius: 8px;
}
.photo-overlay-close {
  position: absolute;
  top: 16px;
  right: 20px;
  background: none;
  border: none;
  color: #fff;
  font-size: 28px;
  cursor: pointer;
}
</style>
