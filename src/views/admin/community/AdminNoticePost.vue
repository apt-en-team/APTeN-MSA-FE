<script setup>
import { reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useNoticeStore } from '@/stores/useNoticeStore'
import BoardEditor from '@/components/resident/BoardEditor.vue'

const router = useRouter()
const route = useRoute()
const noticeStore = useNoticeStore()

const noticeId = computed(() => route.params.noticeId)
const isEditMode = computed(() => !!noticeId.value)

const state = reactive({
  title: '',
  content: '',
  isSubmitting: false,
})

const isValid = computed(() =>
  state.title.trim() && state.content.trim() && state.content.trim() !== '<p></p>'
)

const handleCancel = () => {
  router.push('/admin/notices')
}

const handleSubmit = async () => {
  if (!isValid.value || state.isSubmitting) return
  state.isSubmitting = true
  try {
    if (isEditMode.value) {
      await noticeStore.updateNotice(noticeId.value, {
        title: state.title,
        content: state.content,
      })
    } else {
      await noticeStore.createNotice({
        title: state.title,
        content: state.content,
      })
    }
    router.push('/admin/notices')
  } finally {
    state.isSubmitting = false
  }
}

onMounted(async () => {
  if (isEditMode.value) {
    await noticeStore.fetchAdminNoticeDetail(noticeId.value)
    const notice = noticeStore.noticeDetail
    if (notice) {
      state.title = notice.title ?? ''
      state.content = notice.content ?? ''
    }
  }
})
</script>

<template>
  <div class="notice-post">
    <!-- 헤더 -->
    <div class="notice-post__header">
      <h1 class="page-title">{{ isEditMode ? '공지사항 수정' : '공지사항 작성' }}</h1>
      <div class="header-actions">
        <button class="btn-cancel" @click="handleCancel">취소</button>
        <button
          class="btn-submit"
          :disabled="state.isSubmitting || !isValid"
          @click="handleSubmit"
        >
          {{ state.isSubmitting ? '처리 중...' : isEditMode ? '수정' : '등록' }}
        </button>
      </div>
    </div>

    <!-- 폼 -->
    <div class="card-section notice-post__form">
      <!-- 제목 -->
      <div class="form-group">
        <label class="form-label">제목 <span class="required">*</span></label>
        <input
          v-model="state.title"
          class="form-input"
          type="text"
          placeholder="공지사항 제목을 입력해주세요."
          maxlength="200"
        />
      </div>

      <!-- 내용 -->
      <div class="form-group">
        <label class="form-label">내용 <span class="required">*</span></label>
        <BoardEditor v-model="state.content" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.notice-post {
  display: flex;
  flex-direction: column;
  gap: var(--space-20);
}

.notice-post__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-actions {
  display: flex;
  gap: var(--space-8);
}

.btn-cancel {
  height: 36px;
  padding: 0 var(--space-16);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-8);
  background: var(--white);
  font-size: var(--font-size-detail);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background 0.15s;
}

.btn-cancel:hover { background: var(--color-bg-muted); }

.btn-submit {
  height: 36px;
  padding: 0 var(--space-20);
  border: none;
  border-radius: var(--radius-8);
  background: var(--color-primary);
  color: var(--white);
  font-size: var(--font-size-detail);
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 폼 */
.notice-post__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-20);
  padding: var(--space-24);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.form-label {
  font-size: var(--font-size-detail);
  font-weight: 600;
  color: var(--color-text-primary);
}

.required {
  color: var(--color-danger);
}

.form-input {
  width: 100%;
  height: 44px;
  padding: 0 var(--space-16);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-8);
  font-size: var(--font-size-body-sm);
  color: var(--color-text-primary);
  outline: none;
  transition: border-color 0.15s;
  box-sizing: border-box;
}

.form-input:focus { border-color: var(--color-primary); }
.form-input::placeholder { color: var(--color-border-strong); }
</style>
