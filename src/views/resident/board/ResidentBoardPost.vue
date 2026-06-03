<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import BoardEditor from '@/components/resident/BoardEditor.vue'
import ResidentModal from '@/components/resident/ResidentModal.vue'
import { useBoardStore } from '@/stores/useBoardStore'
import boardApi from '@/api/boardApi'

const router = useRouter()
const route = useRoute()
const boardStore = useBoardStore()

const categories = [
  { value: 'FREE', label: '자유' },
  { value: 'INQUIRY', label: '문의 사항' },
]

const postId = computed(() => route.params.postId)
const isEditMode = computed(() => !!postId.value)

const form = ref({
  category: 'FREE',
  title: '',
  content: '',
})

const attachedFiles = ref([])
const attachedImages = ref([])
const isSubmitting = ref(false)

const pendingModal = ref(false)

const isValid = computed(
  () => form.value.title.trim() && form.value.content.trim() !== '<p></p>' && form.value.content.trim() !== '',
)

const resetCategory = () => {
  form.value.category = 'FREE'
}

const handleCancel = () => {
  router.back()
}

const handleSubmit = async () => {
  if (!isValid.value || isSubmitting.value) return
  isSubmitting.value = true
  try {
    const complexId = route.params.complexId

    if (isEditMode.value) {
      await boardStore.updatePost(postId.value, {
        title: form.value.title,
        content: form.value.content,
      })
      router.push(`/resident/${complexId}/board/${postId.value}`)
    } else {
      const created = await boardStore.createPost({
        complexId,
        category: form.value.category,
        title: form.value.title,
        content: form.value.content,
      })
      const newPostId = created?.postId

      if (newPostId) {
        const allFiles = [
          ...attachedImages.value.map(f => ({ file: f, fileType: 'IMAGE' })),
          ...attachedFiles.value.map(f => ({ file: f, fileType: 'FILE' })),
        ]
        for (const item of allFiles) {
          const fd = new FormData()
          fd.append('postId', newPostId)
          fd.append('files', item.file)
          await boardApi.uploadBoardFile(fd)
        }
      }

      router.push(`/resident/${complexId}/board`)
    }
  } catch (e) {
    const code = e?.response?.data?.code
    if (code === 'BRD_403_05') {
      pendingModal.value = true
    } else {
      console.error('게시글 처리 실패', e)
    }
  } finally {
    isSubmitting.value = false
  }
}

onMounted(async () => {
  if (isEditMode.value) {
    await boardStore.fetchPostDetail(postId.value)
    const post = boardStore.postDetail
    if (post) {
      form.value.category = post.category ?? 'FREE'
      form.value.title = post.title ?? ''
      form.value.content = post.content ?? ''
    }
  }
})
</script>

<template>
  <div class="page-container">
    <div class="page-title">{{ isEditMode ? '글 수정하기' : '글 작성하기' }}</div>

    <div class="form-actions">
      <button type="button" class="btn-cancel" @click="handleCancel">취소</button>
      <button
        type="button"
        class="btn-submit"
        :disabled="isSubmitting || !isValid"
        @click="handleSubmit"
      >
        {{ isSubmitting ? '처리 중...' : isEditMode ? '수정' : '등록' }}
      </button>
    </div>

    <div v-if="!isEditMode" class="form-section">
      <div class="section-header">
        <span class="section-label">카테고리</span>
        <button type="button" class="reset-btn" @click="resetCategory">초기화</button>
      </div>
      <div class="category-chips">
        <button
          v-for="cat in categories"
          :key="cat.value"
          type="button"
          class="chip"
          :class="{ 'chip--active': form.category === cat.value }"
          @click="form.category = cat.value"
        >
          {{ cat.label }}
        </button>
      </div>
    </div>

    <div class="form-section">
      <input
        v-model="form.title"
        type="text"
        class="title-input"
        placeholder="제목을 입력하세요."
        maxlength="200"
      />
    </div>

    <div class="form-section editor-section">
      <BoardEditor
        v-model="form.content"
        @update:files="(f) => (attachedFiles = f)"
        @update:images="(i) => (attachedImages = i)"
      />
    </div>

    <!-- 승인 대기 모달 -->
    <ResidentModal
      :visible="pendingModal"
      type="warning"
      title="게시글 작성 불가"
      subtitle="세대원 승인 대기 중입니다.&#10;관리자 승인 후 이용 가능합니다."
      confirm-text="확인"
      :show-cancel="false"
      @confirm="pendingModal = false"
      @close="pendingModal = false"
    />
  </div>
</template>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-16);
  padding: var(--space-20) var(--space-16);
  padding-bottom: 100px;
  background-color: var(--white);
  min-height: 100vh;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-label {
  font-size: var(--font-size-body-sm);
  color: var(--color-text-secondary);
}

.reset-btn {
  font-size: var(--font-size-detail);
  color: var(--color-primary);
  background: none;
  border: none;
  cursor: pointer;
}

.category-chips {
  display: flex;
  gap: var(--space-8);
  flex-wrap: wrap;
}

.chip {
  padding: var(--space-8) var(--space-16);
  border-radius: 999px;
  border: 1px solid var(--color-border-strong);
  background: transparent;
  font-size: var(--font-size-body-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}

.chip--active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--white);
  font-weight: 700;
}

.title-input {
  width: 100%;
  border: none;
  border-bottom: 1px solid var(--color-border);
  padding: var(--space-12) 0;
  font-size: var(--font-size-body);
  color: var(--color-text-primary);
  background: transparent;
  outline: none;
}

.title-input::placeholder {
  color: var(--color-text-secondary);
}

.editor-section {
  flex: 1;
}

.form-actions {
  position: sticky;
  top: 0;
  display: flex;
  gap: var(--space-12);
  padding: var(--space-8) 0;
  background: var(--white);
  z-index: 10;
}

.btn-cancel {
  flex: 1;
  padding: var(--space-8);
  border-radius: var(--radius-8);
  border: 1px solid var(--color-border-strong);
  background: white;
  font-size: var(--font-size-body);
  color: var(--color-text-primary);
  cursor: pointer;
}

.btn-submit {
  flex: 1;
  padding: var(--space-8);
  border-radius: var(--radius-8);
  border: none;
  background: var(--color-primary);
  color: var(--white);
  font-size: var(--font-size-body);
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.15s;
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
