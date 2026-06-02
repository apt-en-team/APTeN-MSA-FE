<script setup>
import { ref, onBeforeUnmount, watch } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'

const props = defineProps({
  modelValue: { type: String, default: '' },
  hideAttach: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'update:files', 'update:images'])

const fileInputRef = ref(null)
const imageInputRef = ref(null)
const attachedFiles = ref([])
const attachedImages = ref([])

const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit,
    Underline,
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Placeholder.configure({
      placeholder: '본문을 입력하세요.\n비방성 게시글이나 부적절한 글은 삭제될 수 있습니다.\n이미지 최대 5장, 파일 최대 5개 첨부 가능합니다.',
    }),
  ],
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  },
  editorProps: {
    attributes: { class: 'tiptap-inner' },
  },
})

watch(
  () => props.modelValue,
  (newVal) => {
    if (editor.value && editor.value.getHTML() !== newVal) {
      editor.value.commands.setContent(newVal || '', false)
    }
  },
)

const triggerFileInput = () => fileInputRef.value?.click()
const triggerImageInput = () => imageInputRef.value?.click()

const handleFileAttach = (e) => {
  const files = Array.from(e.target.files || [])
  files.forEach((file) => {
    if (attachedFiles.value.length >= 5) return
    attachedFiles.value.push({ name: file.name, size: file.size, file })
  })
  emit('update:files', attachedFiles.value.map((f) => f.file))
  e.target.value = ''
}

const handleImageAttach = (e) => {
  const files = Array.from(e.target.files || [])
  files.forEach((file) => {
    if (attachedImages.value.length >= 5) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      attachedImages.value.push({ name: file.name, size: file.size, file, preview: ev.target.result })
      emit('update:images', attachedImages.value.map((i) => i.file))
    }
    reader.readAsDataURL(file)
  })
  e.target.value = ''
}

const removeFile = (idx) => {
  attachedFiles.value.splice(idx, 1)
  emit('update:files', attachedFiles.value.map((f) => f.file))
}

const removeImage = (idx) => {
  attachedImages.value.splice(idx, 1)
  emit('update:images', attachedImages.value.map((i) => i.file))
}

const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

onBeforeUnmount(() => editor.value?.destroy())
</script>

<template>
  <div class="board-editor">
    <!-- 툴바 -->
    <div class="editor-toolbar" v-if="editor">
      <!-- 텍스트 스타일 -->
      <div class="toolbar-group">
        <button type="button" class="toolbar-btn" :class="{ active: editor.isActive('bold') }"
          @click="editor.chain().focus().toggleBold().run()" title="굵게">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>
        </button>
        <button type="button" class="toolbar-btn" :class="{ active: editor.isActive('italic') }"
          @click="editor.chain().focus().toggleItalic().run()" title="기울임">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>
        </button>
        <button type="button" class="toolbar-btn" :class="{ active: editor.isActive('underline') }"
          @click="editor.chain().focus().toggleUnderline().run()" title="밑줄">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 4v6a6 6 0 0 0 12 0V4"/><line x1="4" y1="20" x2="20" y2="20"/></svg>
        </button>
        <button type="button" class="toolbar-btn" :class="{ active: editor.isActive('strike') }"
          @click="editor.chain().focus().toggleStrike().run()" title="취소선">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="4" y1="12" x2="20" y2="12"/><path d="M8 6h8a4 4 0 0 1 0 8"/><path d="M8 18h8"/></svg>
        </button>
      </div>

      <div class="toolbar-divider" />

      <!-- 제목 -->
      <div class="toolbar-group">
        <button type="button" class="toolbar-btn" :class="{ active: editor.isActive('heading', { level: 1 }) }"
          @click="editor.chain().focus().toggleHeading({ level: 1 }).run()" title="제목1">
          <span class="toolbar-text">H1</span>
        </button>
        <button type="button" class="toolbar-btn" :class="{ active: editor.isActive('heading', { level: 2 }) }"
          @click="editor.chain().focus().toggleHeading({ level: 2 }).run()" title="제목2">
          <span class="toolbar-text">H2</span>
        </button>
        <button type="button" class="toolbar-btn" :class="{ active: editor.isActive('heading', { level: 3 }) }"
          @click="editor.chain().focus().toggleHeading({ level: 3 }).run()" title="제목3">
          <span class="toolbar-text">H3</span>
        </button>
      </div>

      <div class="toolbar-divider" />

      <!-- 정렬 -->
      <div class="toolbar-group">
        <button type="button" class="toolbar-btn" :class="{ active: editor.isActive({ textAlign: 'left' }) }"
          @click="editor.chain().focus().setTextAlign('left').run()" title="왼쪽 정렬">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>
        </button>
        <button type="button" class="toolbar-btn" :class="{ active: editor.isActive({ textAlign: 'center' }) }"
          @click="editor.chain().focus().setTextAlign('center').run()" title="가운데 정렬">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
        </button>
        <button type="button" class="toolbar-btn" :class="{ active: editor.isActive({ textAlign: 'right' }) }"
          @click="editor.chain().focus().setTextAlign('right').run()" title="오른쪽 정렬">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>
        </button>
      </div>

      <div class="toolbar-divider" />

      <!-- 목록 -->
      <div class="toolbar-group">
        <button type="button" class="toolbar-btn" :class="{ active: editor.isActive('bulletList') }"
          @click="editor.chain().focus().toggleBulletList().run()" title="글머리 기호">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none"/></svg>
        </button>
        <button type="button" class="toolbar-btn" :class="{ active: editor.isActive('orderedList') }"
          @click="editor.chain().focus().toggleOrderedList().run()" title="번호 목록">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4" stroke="currentColor" stroke-width="1.5"/><path d="M4 10h2" stroke="currentColor" stroke-width="1.5"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" stroke="currentColor" stroke-width="1.5"/></svg>
        </button>
        <button type="button" class="toolbar-btn" :class="{ active: editor.isActive('blockquote') }"
          @click="editor.chain().focus().toggleBlockquote().run()" title="인용">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>
        </button>
      </div>

      <div class="toolbar-divider" />

      <!-- 기타 -->
      <div class="toolbar-group">
        <button type="button" class="toolbar-btn"
          @click="editor.chain().focus().setHorizontalRule().run()" title="구분선">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/></svg>
        </button>
        <button type="button" class="toolbar-btn"
          @click="editor.chain().focus().undo().run()" title="실행 취소">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>
        </button>
        <button type="button" class="toolbar-btn"
          @click="editor.chain().focus().redo().run()" title="다시 실행">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/></svg>
        </button>
      </div>

      <!-- 파일/이미지 첨부 — hideAttach가 true면 숨긴다 -->
      <template v-if="!hideAttach">
        <div class="toolbar-divider" />
        <div class="toolbar-group">
          <button type="button" class="toolbar-btn" @click="triggerImageInput" title="이미지 첨부">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          </button>
          <button type="button" class="toolbar-btn" @click="triggerFileInput" title="파일 첨부">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
          </button>
        </div>
      </template>
    </div>

    <!-- 에디터 본문 -->
    <editor-content :editor="editor" class="editor-content" />

    <!-- 숨김 파일 인풋 — hideAttach가 false일 때만 렌더링 -->
    <template v-if="!hideAttach">
      <input ref="fileInputRef" type="file" style="display: none" multiple
        accept=".pdf,.doc,.docx,.zip,.txt,.hwp,.xls,.xlsx,.ppt,.pptx" @change="handleFileAttach" />
      <input ref="imageInputRef" type="file" style="display: none" multiple
        accept="image/*" @change="handleImageAttach" />

      <!-- 첨부 파일 목록 -->
      <div v-if="attachedFiles.length > 0" class="attached-section">
        <div class="attached-title">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
          첨부파일
        </div>
        <div v-for="(file, idx) in attachedFiles" :key="idx" class="attached-file-item">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <span class="file-name">{{ file.name }}</span>
          <span class="file-size">{{ formatFileSize(file.size) }}</span>
          <button type="button" class="remove-btn" @click="removeFile(idx)">✕</button>
        </div>
      </div>

      <!-- 이미지 미리보기 -->
      <div v-if="attachedImages.length > 0" class="attached-section">
        <div class="attached-title">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          이미지
        </div>
        <div class="image-preview-grid">
          <div v-for="(img, idx) in attachedImages" :key="idx" class="image-preview-item">
            <img :src="img.preview" :alt="img.name" class="preview-img" />
            <button type="button" class="image-remove-btn" @click="removeImage(idx)">✕</button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.board-editor {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-8);
  background: var(--color-card-bg);
  overflow: hidden;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-8) var(--space-12);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-muted);
  flex-wrap: wrap;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 2px;
}

.toolbar-divider {
  width: 1px;
  height: 20px;
  background: var(--color-border);
  margin: 0 var(--space-4);
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: var(--radius-4);
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: background 0.15s, color 0.15s;
}

.toolbar-btn:hover {
  background: var(--color-border);
  color: var(--color-text-primary);
}

.toolbar-btn.active {
  background: var(--color-primary);
  color: var(--white);
  border-color: var(--color-primary);
}

.toolbar-text {
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
}

.editor-content {
  min-height: 200px;
  padding: var(--space-12);
}

:deep(.tiptap-inner) {
  outline: none;
  min-height: 200px;
  font-size: var(--font-size-body);
  color: var(--color-text-primary);
  line-height: 1.7;
}

:deep(.tiptap-inner p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  color: var(--color-text-secondary);
  pointer-events: none;
  float: left;
  height: 0;
  white-space: pre-line;
}

:deep(.tiptap-inner h1) { font-size: var(--font-size-heading-2); font-weight: 700; margin: var(--space-8) 0; }
:deep(.tiptap-inner h2) { font-size: var(--font-size-heading-3); font-weight: 700; margin: var(--space-8) 0; }
:deep(.tiptap-inner h3) { font-size: var(--font-size-body); font-weight: 700; margin: var(--space-8) 0; }
:deep(.tiptap-inner ul) { padding-left: var(--space-20); list-style: disc; }
:deep(.tiptap-inner ol) { padding-left: var(--space-20); list-style: decimal; }
:deep(.tiptap-inner blockquote) {
  border-left: 3px solid var(--color-primary);
  padding-left: var(--space-12);
  color: var(--color-text-secondary);
  margin: var(--space-8) 0;
  font-style: italic;
}
:deep(.tiptap-inner hr) {
  border: none;
  border-top: 1px solid var(--color-border);
  margin: var(--space-16) 0;
}
:deep(.tiptap-inner strong) { font-weight: 700; }
:deep(.tiptap-inner em) { font-style: italic; }
:deep(.tiptap-inner u) { text-decoration: underline; }
:deep(.tiptap-inner s) { text-decoration: line-through; }

/* 첨부 섹션 */
.attached-section {
  border-top: 1px solid var(--color-border);
  padding: var(--space-12);
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.attached-title {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  font-size: var(--font-size-body-sm);
  font-weight: 700;
  color: var(--color-text-secondary);
}

.attached-file-item {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  padding: var(--space-4) var(--space-8);
  background: var(--color-bg-muted);
  border-radius: var(--radius-4);
}

.file-name {
  flex: 1;
  font-size: var(--font-size-body-sm);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.file-size {
  font-size: var(--font-size-detail);
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

.remove-btn {
  background: none;
  border: none;
  color: var(--color-danger);
  cursor: pointer;
  font-size: var(--font-size-body-sm);
  padding: 2px 4px;
  flex-shrink: 0;
}

.image-preview-grid {
  display: flex;
  gap: var(--space-8);
  flex-wrap: wrap;
}

.image-preview-item {
  position: relative;
  width: 80px;
  height: 80px;
}

.preview-img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: var(--radius-4);
  border: 1px solid var(--color-border);
}

.image-remove-btn {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 10px;
  cursor: pointer;
}
</style>
