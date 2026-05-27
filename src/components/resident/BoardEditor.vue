<template>
  <div class="board-editor">
    <!-- 툴바 -->
    <div class="editor-toolbar" v-if="editor">
      <button
        type="button"
        class="toolbar-btn"
        :class="{ active: editor.isActive('bold') }"
        @click="editor.chain().focus().toggleBold().run()"
        title="굵게"
      >
        <span class="toolbar-icon">B</span>
      </button>
      <button
        type="button"
        class="toolbar-btn"
        :class="{ active: editor.isActive('italic') }"
        @click="editor.chain().focus().toggleItalic().run()"
        title="기울임"
      >
        <span class="toolbar-icon italic-icon">I</span>
      </button>
      <button
        type="button"
        class="toolbar-btn"
        :class="{ active: editor.isActive('heading', { level: 1 }) }"
        @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
        title="제목"
      >
        <span class="toolbar-icon">H1</span>
      </button>
      <button
        type="button"
        class="toolbar-btn"
        :class="{ active: editor.isActive('bulletList') }"
        @click="editor.chain().focus().toggleBulletList().run()"
        title="목록"
      >
        <span class="toolbar-icon">≡</span>
      </button>
      <!-- 파일 첨부 버튼 -->
      <button
        type="button"
        class="toolbar-btn"
        @click="triggerFileInput"
        title="파일 첨부"
      >
        <span class="toolbar-icon">📎</span>
      </button>
      <!-- 이미지 첨부 버튼 -->
      <button
        type="button"
        class="toolbar-btn"
        @click="triggerImageInput"
        title="이미지"
      >
        <span class="toolbar-icon">🖼</span>
      </button>
    </div>

    <!-- 에디터 본문 -->
    <editor-content
      :editor="editor"
      class="editor-content"
    />

    <!-- 숨김 파일 인풋 -->
    <input
      ref="fileInputRef"
      type="file"
      style="display: none"
      multiple
      accept=".pdf,.doc,.docx,.zip,.txt"
      @change="handleFileAttach"
    />
    <input
      ref="imageInputRef"
      type="file"
      style="display: none"
      multiple
      accept="image/*"
      @change="handleImageAttach"
    />

    <!-- 첨부 파일 목록 -->
    <div v-if="attachedFiles.length > 0" class="attached-files">
      <div class="attached-files-title">첨부파일</div>
      <div
        v-for="(file, idx) in attachedFiles"
        :key="idx"
        class="attached-file-item"
      >
        <span class="file-icon">📄</span>
        <span class="file-name">{{ file.name }}</span>
        <span class="file-size">{{ formatFileSize(file.size) }}</span>
        <button
          type="button"
          class="file-remove-btn"
          @click="removeFile(idx)"
        >✕</button>
      </div>
    </div>

    <!-- 이미지 미리보기 -->
    <div v-if="attachedImages.length > 0" class="attached-images">
      <div class="attached-files-title">이미지</div>
      <div class="image-preview-grid">
        <div
          v-for="(img, idx) in attachedImages"
          :key="idx"
          class="image-preview-item"
        >
          <img :src="img.preview" :alt="img.name" class="preview-img" />
          <button
            type="button"
            class="image-remove-btn"
            @click="removeImage(idx)"
          >✕</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onBeforeUnmount, watch } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'

// Props & Emits
const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
})

const emit = defineEmits([
  'update:modelValue',
  'update:files',
  'update:images',
])

// 파일/이미지 refs
const fileInputRef = ref(null)
const imageInputRef = ref(null)
const attachedFiles = ref([])   // { name, size, file }
const attachedImages = ref([])  // { name, size, file, preview }

// Tiptap 에디터 초기화
const editor = useEditor({
  content: props.modelValue,
  extensions: [
    StarterKit,
    Placeholder.configure({
      placeholder: '본문을 입력하세요.\n비방성 게시글이나 부적절한 글은 삭제될 수 있습니다.',
    }),
  ],
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  },
  editorProps: {
    attributes: {
      class: 'tiptap-inner',
    },
  },
})

// 부모에서 값 변경 시 동기화
watch(
  () => props.modelValue,
  (newVal) => {
    if (editor.value && editor.value.getHTML() !== newVal) {
      editor.value.commands.setContent(newVal || '', false)
    }
  },
)

// 파일 첨부
const triggerFileInput = () => fileInputRef.value?.click()
const triggerImageInput = () => imageInputRef.value?.click()

const handleFileAttach = (e) => {
  const files = Array.from(e.target.files || [])
  files.forEach((file) => {
    if (attachedFiles.value.length >= 5) return // 최대 5개
    attachedFiles.value.push({ name: file.name, size: file.size, file })
  })
  emit('update:files', attachedFiles.value.map((f) => f.file))
  e.target.value = ''
}

const handleImageAttach = (e) => {
  const files = Array.from(e.target.files || [])
  files.forEach((file) => {
    if (attachedImages.value.length >= 5) return // 최대 5개
    const reader = new FileReader()
    reader.onload = (ev) => {
      attachedImages.value.push({
        name: file.name,
        size: file.size,
        file,
        preview: ev.target.result,
      })
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

// 유틸
const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<style scoped>
.board-editor {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-8);
  background: var(--color-card-bg);
  overflow: hidden;
}

/* 툴바 */
.editor-toolbar {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-8) var(--space-12);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-muted);
  flex-wrap: wrap;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-4);
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  transition: background 0.15s;
}

.toolbar-btn:hover {
  background: var(--color-border);
}

.toolbar-btn.active {
  background: var(--color-primary);
  color: var(--white);
  border-color: var(--color-primary);
}

.toolbar-icon {
  font-size: var(--font-size-body-sm);
  font-weight: 700;
  line-height: 1;
  color: var(--color-text-primary);
}

.toolbar-btn.active .toolbar-icon {
  color: var(--white);
}

.italic-icon {
  font-style: italic;
}

/* 에디터 본문 */
.editor-content {
  min-height: 200px;
  padding: var(--space-12);
}

/* Tiptap 내부 스타일 (scoped 밖에서 적용) */
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

:deep(.tiptap-inner h1) {
  font-size: var(--font-size-heading-3);
  font-weight: 700;
  margin-bottom: var(--space-8);
}

:deep(.tiptap-inner ul) {
  padding-left: var(--space-20);
  list-style: disc;
}

:deep(.tiptap-inner strong) {
  font-weight: 700;
}

:deep(.tiptap-inner em) {
  font-style: italic;
}

/* 첨부파일 목록 */
.attached-files,
.attached-images {
  border-top: 1px solid var(--color-border);
  padding: var(--space-12);
}

.attached-files-title {
  font-size: var(--font-size-body-sm);
  font-weight: 700;
  color: var(--color-text-secondary);
  margin-bottom: var(--space-8);
}

.attached-file-item {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  padding: var(--space-4) 0;
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
}

.file-remove-btn,
.image-remove-btn {
  background: none;
  border: none;
  color: var(--color-danger);
  cursor: pointer;
  font-size: var(--font-size-body-sm);
  padding: 2px 4px;
  border-radius: var(--radius-4);
}

/* 이미지 미리보기 */
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
  border-radius: 50%;
  font-size: 10px;
}
</style>
