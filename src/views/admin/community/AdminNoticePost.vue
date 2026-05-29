<script setup>
import { reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useNoticeStore } from '@/stores/useNoticeStore'
import { useAuthStore } from '@/stores/useAuthStore'
import BoardEditor from '@/components/resident/BoardEditor.vue'
import noticeApi from '@/api/noticeApi'

const router = useRouter()
const route = useRoute()
const noticeStore = useNoticeStore()
const authStore = useAuthStore()

const noticeId = computed(() => route.params.noticeId)
const isEditMode = computed(() => !!noticeId.value)

const state = reactive({
  title: '',
  content: '',
  isSubmitting: false,
  createdAt: null,
  updatedAt: null,
  attachedFiles: [],
  attachedImages: [],
})

const isValid = computed(() =>
  state.title.trim() && state.content.trim() && state.content.trim() !== '<p></p>'
)

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const handleCancel = () => {
  router.push('/admin/boards/statistics')
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
      const created = await noticeStore.createNotice({
        title: state.title,
        content: state.content,
      })
      const newNoticeId = created?.noticeId

      if (newNoticeId) {
        const allFiles = [
          ...state.attachedImages.map(f => ({ file: f })),
          ...state.attachedFiles.map(f => ({ file: f })),
        ]
        for (const item of allFiles) {
          const fd = new FormData()
          fd.append('noticeId', newNoticeId)
          fd.append('files', item.file)
          await noticeApi.uploadNoticeFile(fd)
        }
      }
    }
    router.push('/admin/boards/statistics')
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
      state.createdAt = notice.createdAt ?? null
      state.updatedAt = notice.updatedAt ?? null
    }
  }
})
</script>

<template>
  <div class="notice-post">
    <div class="notice-post__layout">
      <!-- 왼쪽 메인 폼 -->
      <div class="notice-post__main">
        <div class="card-shell">
          <div class="form-header">
            <h2 class="form-title">{{ isEditMode ? '공지사항 수정' : '공지사항 작성' }}</h2>
          </div>

          <div class="form-body">
            <!-- 카테고리 -->
            <div class="form-group">
              <label class="form-label">카테고리</label>
              <div class="category-btn active">공지사항</div>
            </div>

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
              <BoardEditor
                v-model="state.content"
                @update:files="(f) => (state.attachedFiles = f)"
                @update:images="(i) => (state.attachedImages = i)"
              />
            </div>

            <!-- 수정 이력 (수정 모드만) -->
            <div v-if="isEditMode" class="history-section">
              <p class="history-title">수정 이력</p>
              <div class="history-item">
                <span class="history-dot" />
                <span class="history-date">{{ formatDate(state.createdAt) }}</span>
                <span class="history-label">최초 작성</span>
              </div>
              <div v-if="state.updatedAt && state.updatedAt !== state.createdAt" class="history-item">
                <span class="history-dot history-dot--updated" />
                <span class="history-date">{{ formatDate(state.updatedAt) }}</span>
                <span class="history-label">수정됨</span>
              </div>
            </div>
          </div>

          <!-- 하단 버튼 -->
          <div class="form-footer">
            <div class="footer-left">
              <button class="btn-ghost" @click="handleCancel">취소</button>
            </div>
            <div class="footer-right">
              <button
                class="btn-primary"
                :disabled="state.isSubmitting || !isValid"
                @click="handleSubmit"
              >
                {{ state.isSubmitting ? '처리 중...' : isEditMode ? '수정 완료' : '등록하기' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 오른쪽 사이드바 -->
      <div class="notice-post__sidebar">
        <!-- 발행 설정 -->
        <div class="sidebar-card">
          <h3 class="sidebar-title">발행 설정</h3>

          <div class="sidebar-section">
            <p class="sidebar-section-label">작성자</p>
            <div class="author-chip">
              <div class="author-avatar">관</div>
              <div class="author-info">
                <p class="author-name">{{ authStore.name ?? '관리자' }}</p>
                <p class="author-role">관리자</p>
              </div>
            </div>
          </div>

          <div class="sidebar-section">
            <p class="sidebar-section-label">게시 상태</p>
            <div class="publish-status">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect width="14" height="14" rx="3" fill="#4973E5"/>
                <path d="M3 7l3 3 5-5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>즉시 게시</span>
            </div>
          </div>

          <div class="sidebar-section">
            <p class="sidebar-section-label">{{ isEditMode ? '최초 작성일' : '작성일' }}</p>
            <p class="sidebar-value">{{ isEditMode ? formatDate(state.createdAt) : formatDate(new Date().toISOString()) }}</p>
          </div>

          <div v-if="isEditMode && state.updatedAt" class="sidebar-section">
            <p class="sidebar-section-label">수정일</p>
            <p class="sidebar-value sidebar-value--muted">수정 시 자동 업데이트</p>
          </div>
        </div>

        <!-- 수정 주의사항 (수정 모드만) -->
        <div v-if="isEditMode" class="sidebar-card sidebar-card--warning">
          <h3 class="sidebar-title">수정 주의사항</h3>
          <ul class="warning-list">
            <li class="warning-item">수정 후 즉시 반영됩니다.</li>
            <li class="warning-item">수정 된 내용이 자동 업데이트됩니다.</li>
            <li class="warning-item">댓글은 수정 시 영향 없습니다.</li>
            <li class="warning-item">삭제는 목록 페이지에서 가능합니다.</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.notice-post {
  width: 100%;
}

.notice-post__layout {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: var(--space-24);
  align-items: start;
}

.card-shell {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.form-header {
  padding: var(--space-20) var(--space-24);
  border-bottom: 1px solid #e2e8f0;
}

.form-title {
  margin: 0;
  font-size: var(--font-size-body);
  font-weight: 700;
  color: var(--color-text-primary);
}

.form-body {
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
  color: var(--color-text-secondary);
}

.required {
  color: var(--color-danger);
}

.category-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  padding: 0 var(--space-16);
  border-radius: var(--radius-8);
  font-size: var(--font-size-detail);
  font-weight: 700;
  background: var(--admin-main-navy);
  color: var(--white);
  width: fit-content;
}

.form-input {
  width: 100%;
  height: 44px;
  padding: 0 var(--space-16);
  border: 1px solid #e2e8f0;
  border-radius: var(--radius-8);
  font-size: var(--font-size-body-sm);
  color: var(--color-text-primary);
  outline: none;
  transition: border-color 0.15s;
  box-sizing: border-box;
}

.form-input:focus { border-color: var(--color-primary); }
.form-input::placeholder { color: #a0aec0; }

.history-section {
  border-top: 1px solid #e2e8f0;
  padding-top: var(--space-16);
}

.history-title {
  font-size: var(--font-size-detail);
  font-weight: 600;
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-12);
}

.history-item {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  margin-bottom: var(--space-8);
}

.history-dot {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  background: var(--color-primary);
  flex-shrink: 0;
}

.history-dot--updated {
  background: var(--color-warning);
}

.history-date {
  font-size: var(--font-size-detail);
  color: var(--color-text-secondary);
}

.history-label {
  font-size: var(--font-size-detail);
  color: var(--color-text-secondary);
  font-weight: 600;
}

.form-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-16) var(--space-24);
  border-top: 1px solid #e2e8f0;
}

.footer-left {
  display: flex;
  gap: var(--space-8);
}

.footer-right {
  display: flex;
  gap: var(--space-8);
}

.btn-ghost {
  height: 38px;
  padding: 0 var(--space-20);
  border: 1px solid #e2e8f0;
  border-radius: var(--radius-8);
  background: #ffffff;
  font-size: var(--font-size-detail);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background 0.15s;
}

.btn-ghost:hover { background: #f5f6f8; }

.btn-primary {
  height: 38px;
  padding: 0 var(--space-24);
  border: none;
  border-radius: var(--radius-8);
  background: var(--admin-main-navy);
  color: var(--white);
  font-size: var(--font-size-detail);
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.15s;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.notice-post__sidebar {
  display: flex;
  flex-direction: column;
  gap: var(--space-16);
}

.sidebar-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: var(--space-20);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
}

.sidebar-card--warning {
  border-color: rgba(192, 139, 45, 0.3);
  background: #fffdf5;
}

.sidebar-title {
  margin: 0 0 var(--space-16);
  font-size: var(--font-size-body-sm);
  font-weight: 700;
  color: var(--color-text-primary);
}

.sidebar-section {
  margin-bottom: var(--space-16);
}

.sidebar-section:last-child {
  margin-bottom: 0;
}

.sidebar-section-label {
  font-size: var(--font-size-detail);
  color: var(--color-text-secondary);
  margin: 0 0 var(--space-8);
  font-weight: 600;
}

.author-chip {
  display: flex;
  align-items: center;
  gap: var(--space-12);
  padding: var(--space-12);
  background: #f5f6f8;
  border-radius: var(--radius-8);
}

.author-avatar {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-full);
  background: var(--admin-main-navy);
  color: var(--white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-detail);
  font-weight: 700;
  flex-shrink: 0;
}

.author-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.author-name {
  font-size: var(--font-size-detail);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.author-role {
  font-size: var(--font-size-badge);
  color: var(--color-text-secondary);
  margin: 0;
}

.publish-status {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  font-size: var(--font-size-detail);
  color: var(--color-primary);
  font-weight: 600;
}

.sidebar-value {
  font-size: var(--font-size-detail);
  color: var(--color-text-primary);
  margin: 0;
}

.sidebar-value--muted {
  color: var(--color-text-secondary);
}

.warning-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  padding: 0;
  margin: 0;
  list-style: none;
}

.warning-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-8);
  font-size: var(--font-size-detail);
  color: var(--color-warning);
}

.warning-item::before {
  content: '•';
  color: var(--color-warning);
  flex-shrink: 0;
  font-weight: 700;
}
</style>
