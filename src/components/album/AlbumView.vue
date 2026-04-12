<script setup lang="ts">
import { ref } from 'vue'
import { useAlbumStore, PRESET_TAGS } from '@/stores/album'
import { useAppStore } from '@/stores/app'

const albumStore = useAlbumStore()
const appStore = useAppStore()

const uploading = ref(false)
const captionInput = ref('')
const overlayPhoto = ref<{ url: string; caption: string } | null>(null)

// Tag select modal state
const tagModalOpen = ref(false)
const selectedTags = ref<Set<string>>(new Set())
const customTagInput = ref('')
const tagModalResolve = ref<((tags: string[] | null) => void) | null>(null)
const pendingFile = ref<File | null>(null)
const extraTags = ref<string[]>([])

function openTagModal(file: File) {
  pendingFile.value = file
  selectedTags.value = new Set()
  customTagInput.value = ''
  tagModalOpen.value = true
  return new Promise<string[] | null>((resolve) => {
    tagModalResolve.value = resolve
  })
}

function toggleTag(tag: string) {
  if (selectedTags.value.has(tag)) {
    selectedTags.value.delete(tag)
  } else {
    selectedTags.value.add(tag)
  }
  selectedTags.value = new Set(selectedTags.value) // trigger reactivity
}

function addCustomTag() {
  const v = customTagInput.value.trim()
  if (!v) return
  if (!PRESET_TAGS.includes(v) && !extraTags.value.includes(v)) {
    extraTags.value = [...extraTags.value, v]
  }
  selectedTags.value.add(v)
  selectedTags.value = new Set(selectedTags.value)
  customTagInput.value = ''
}

function confirmTags() {
  tagModalOpen.value = false
  tagModalResolve.value?.([...selectedTags.value])
  tagModalResolve.value = null
}

function cancelTags() {
  tagModalOpen.value = false
  tagModalResolve.value?.(null)
  tagModalResolve.value = null
  pendingFile.value = null
}

async function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  input.value = ''

  const tags = await openTagModal(file)
  if (tags === null) return // cancelled

  const caption = captionInput.value.trim()
  uploading.value = true
  try {
    await albumStore.uploadPhoto(pendingFile.value!, caption, tags)
    captionInput.value = ''
    appStore.showToast('📸 写真を追加したよ！')
  } catch (e) {
    appStore.showToast('アップロードに失敗したよ…')
  } finally {
    uploading.value = false
    pendingFile.value = null
  }
}

async function delPhoto(id: string) {
  if (!confirm('この写真を削除するだっちゃ？')) return
  await albumStore.delPhoto(id)
}

function openOverlay(id: string) {
  const photo = albumStore.photos.find((p) => p.id === id)
  if (!photo) return
  overlayPhoto.value = { url: photo.url, caption: photo.caption }
}

const allTagsForModal = () => [...new Set([...PRESET_TAGS, ...extraTags.value])]
</script>

<template>
  <div class="album-view">
    <!-- ツールバー -->
    <div class="album-toolbar">
      <div class="album-sort-btns">
        <button
          v-for="s in (['new', 'old', 'fav'] as const)"
          :key="s"
          class="sort-btn"
          :class="{ active: albumStore.sort === s }"
          @click="albumStore.sort = s"
        >{{ s === 'new' ? '新しい順' : s === 'old' ? '古い順' : 'お気に入り' }}</button>
      </div>
    </div>

    <!-- タグフィルターバー -->
    <div v-if="albumStore.usedTags.length" class="tag-filter-bar">
      <button
        class="tag-chip"
        :class="{ active: !albumStore.filterTag }"
        @click="albumStore.filterTag = null"
      >すべて</button>
      <button
        v-for="tag in albumStore.usedTags"
        :key="tag"
        class="tag-chip"
        :class="{ active: albumStore.filterTag === tag }"
        @click="albumStore.filterTag = tag"
      >{{ tag }}</button>
    </div>

    <!-- フォトグリッド -->
    <div class="album-scroll">
      <div v-if="!albumStore.sortedPhotos.length" class="empty">
        <div class="empty-icon">📸</div>
        {{ albumStore.filterTag ? `「${albumStore.filterTag}」の写真がないよ` : albumStore.sort === 'fav' ? 'お気に入りがまだないよ' : 'まだ写真がないよ' }}
      </div>
      <div v-else class="photo-grid">
        <div v-for="p in albumStore.sortedPhotos" :key="p.id" class="photo-card">
          <img
            class="photo-img"
            :src="p.url"
            loading="lazy"
            @click="openOverlay(p.id)"
          />
          <div class="photo-info">
            <div v-if="p.caption" class="photo-caption">{{ p.caption }}</div>
            <div v-if="p.tags?.length" class="photo-tags">
              <span v-for="t in p.tags" :key="t" class="photo-tag">{{ t }}</span>
            </div>
            <div class="photo-meta">
              <span class="photo-who">{{ p.who }}</span>
              <span class="photo-date">{{ p.dateStr }}</span>
              <div class="photo-actions">
                <button class="heart-btn" @click="albumStore.toggleFav(p.id)">
                  {{ p.fav ? '❤️' : '🤍' }}
                </button>
                <button class="photo-del" @click="delPhoto(p.id)">✕</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- アップロードバー -->
    <div class="upload-bar">
      <div v-if="uploading" class="uploading-label">📤 アップロード中…</div>
      <div v-else class="upload-wrap">
        <input
          v-model="captionInput"
          type="text"
          placeholder="コメント（任意）"
          class="caption-input"
        />
        <label class="btn-upload">
          📷 追加
          <input type="file" accept="image/*" style="display:none" @change="onFileChange" />
        </label>
      </div>
    </div>

    <!-- 写真フルスクリーン -->
    <div v-if="overlayPhoto" class="photo-overlay" @click.self="overlayPhoto = null">
      <button class="photo-overlay-close" @click="overlayPhoto = null">✕</button>
      <img :src="overlayPhoto.url" />
      <div v-if="overlayPhoto.caption" class="photo-overlay-caption">{{ overlayPhoto.caption }}</div>
    </div>

    <!-- タグ選択モーダル -->
    <div v-if="tagModalOpen" class="modal-overlay" @click.self="cancelTags">
      <div class="modal-box">
        <div class="modal-title">🏷️ タグを選択</div>
        <div class="tag-chips-wrap">
          <button
            v-for="t in allTagsForModal()"
            :key="t"
            class="tag-chip"
            :class="{ active: selectedTags.has(t) }"
            style="margin: 3px"
            @click="toggleTag(t)"
          >{{ t }}</button>
        </div>
        <div class="custom-tag-row">
          <input
            v-model="customTagInput"
            class="form-input"
            placeholder="カスタムタグを入力"
            @keydown.enter="addCustomTag"
          />
          <button class="btn-send" @click="addCustomTag">追加</button>
        </div>
        <div class="modal-btns">
          <button class="modal-cancel" @click="cancelTags">キャンセル</button>
          <button class="modal-ok" @click="confirmTags">OK</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.album-view {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}

.album-toolbar {
  padding: 10px 16px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.album-sort-btns {
  display: flex;
  gap: 6px;
}
.sort-btn {
  padding: 5px 12px;
  border-radius: 20px;
  border: 1.5px solid var(--border);
  background: transparent;
  font-size: 12px;
  cursor: pointer;
  font-family: inherit;
  color: var(--text-muted);
  transition: all 0.15s;
}
.sort-btn.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
  font-weight: 600;
}

.tag-filter-bar {
  display: flex;
  gap: 6px;
  padding: 8px 14px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.tag-chip {
  padding: 4px 12px;
  border-radius: 20px;
  border: 1.5px solid var(--border);
  background: transparent;
  font-size: 12px;
  cursor: pointer;
  font-family: inherit;
  color: var(--text-muted);
  white-space: nowrap;
  transition: all 0.15s;
}
.tag-chip.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
  font-weight: 600;
}

.album-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
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

.photo-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}
.photo-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
}
.photo-img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  display: block;
  cursor: pointer;
}
.photo-info {
  padding: 8px 10px;
}
.photo-caption {
  font-size: 13px;
  color: var(--text);
  margin-bottom: 4px;
  word-break: break-word;
}
.photo-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}
.photo-tag {
  font-size: 10px;
  background: var(--accent-light);
  color: var(--accent);
  border-radius: 8px;
  padding: 2px 7px;
  font-weight: 600;
}
.photo-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.photo-who {
  font-size: 11px;
  color: var(--text-muted);
  font-weight: 600;
}
.photo-date {
  font-size: 11px;
  color: var(--text-muted);
  font-family: 'DM Mono', monospace;
}
.photo-actions {
  display: flex;
  gap: 6px;
  align-items: center;
}
.heart-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  transition: transform 0.15s;
}
.heart-btn:active {
  transform: scale(1.3);
}
.photo-del {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  font-size: 13px;
  transition: color 0.15s;
}
.photo-del:hover {
  color: var(--danger);
}

.upload-bar {
  padding: 10px 14px;
  background: var(--surface);
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}
.uploading-label {
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
  padding: 6px 0;
}
.upload-wrap {
  display: flex;
  gap: 8px;
  align-items: center;
}
.caption-input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 99px;
  font-size: 14px;
  background: var(--bg);
  outline: none;
  font-family: inherit;
}
.caption-input:focus {
  border-color: var(--accent);
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
.btn-upload:hover {
  opacity: 0.85;
}

/* フルスクリーンオーバーレイ */
.photo-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.92);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.photo-overlay img {
  max-width: 100%;
  max-height: 80vh;
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
.photo-overlay-caption {
  color: #fff;
  font-size: 14px;
  margin-top: 12px;
  text-align: center;
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
}
.modal-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 14px;
}
.tag-chips-wrap {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.custom-tag-row {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}
.form-input {
  flex: 1;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 14px;
  background: var(--bg);
  outline: none;
  font-family: inherit;
  color: var(--text);
  width: 100%;
}
.form-input:focus {
  border-color: var(--accent);
}
.modal-btns {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
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
</style>
