<script setup>
import { reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useNoticeStore } from '@/stores/useNoticeStore'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import boardApi from '@/api/boardApi'
import noticeApi from '@/api/noticeApi'
import { useAuthStore } from '@/stores/useAuthStore'

const router = useRouter()
const route = useRoute()
const noticeStore = useNoticeStore()
const authStore = useAuthStore()

const postId = computed(() => route.params.postId)
const noticeId = computed(() => route.params.noticeId)
const isNotice = computed(() => !!noticeId.value)

const state = reactive({
  post: null,
  comments: [],
  commentInput: '',
  loading: false,
  isSubmitting: false,
  showDeletePostModal: false,
  showDeleteCommentModal: false,
  selectedCommentId: null,
})

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const categoryLabel = computed(() => {
  if (isNotice.value) return '공지'
  if (state.post?.category === 'FREE') return '자유게시판'
  if (state.post?.category === 'INQUIRY') return '문의'
  return '-'
})

const isAdminRole = (role) => {
  return ['ADMIN', 'MANAGER', 'MASTER'].includes(role)
}

const goBack = () => {
  router.push('/admin/boards/statistics')
}

const goEdit = () => {
  if (isNotice.value) {
    router.push(`/admin/notices/${noticeId.value}/edit`)
  } else {
    router.push(`/admin/boards/${postId.value}/edit`)
  }
}

const openDeletePostModal = () => {
  state.showDeletePostModal = true
}

const onDeletePost = async () => {
  state.isSubmitting = true
  try {
    if (isNotice.value) {
      await noticeStore.deleteNotice(noticeId.value)
    } else {
      await boardApi.deleteAdminPost(postId.value)  // deletePost → deleteAdminPost
    }
    state.showDeletePostModal = false
    goBack()
  } finally {
    state.isSubmitting = false
  }
}

const onSubmitComment = async () => {
  if (!state.commentInput.trim() || state.isSubmitting) return
  state.isSubmitting = true
  try {
    await boardApi.createComment(postId.value, { content: state.commentInput })
    state.commentInput = ''
    await fetchComments()
  } finally {
    state.isSubmitting = false
  }
}

const openDeleteCommentModal = (commentId) => {
  state.selectedCommentId = commentId
  state.showDeleteCommentModal = true
}

const onDeleteComment = async () => {
  state.isSubmitting = true
  try {
    await boardApi.deleteAdminComment(state.selectedCommentId)
    state.showDeleteCommentModal = false
    state.selectedCommentId = null
    await fetchComments()
  } finally {
    state.isSubmitting = false
  }
}

const fetchComments = async () => {
  const res = await boardApi.getComments(postId.value, { page: 0, size: 100 })
  state.comments = res?.content ?? []
}

const fetchPost = async () => {
  state.loading = true
  try {
    if (isNotice.value) {
      state.post = await noticeApi.getAdminNoticeDetail(noticeId.value)
    } else {
      state.post = await boardApi.getAdminPostDetail(postId.value)
    }
  } finally {
    state.loading = false
  }
}

onMounted(async () => {
  await fetchPost()
  if (!isNotice.value) {
    await fetchComments()
  }
})
</script>

<template>
  <div class="board-detail">
    <div v-if="state.loading" class="loading-wrap">
      <span class="dot" /><span class="dot" /><span class="dot" />
    </div>

    <div v-else-if="state.post" class="detail-layout">
      <!-- 메인 본문 -->
      <div class="detail-main">
        <!-- 카테고리 뱃지 -->
        <div class="detail-badge-row">
          <span class="badge-category" :class="isNotice ? 'badge-notice' : 'badge-free'">
            {{ categoryLabel }}
          </span>
          <span v-if="state.post.isDeleted" class="badge-deleted">삭제됨</span>
        </div>

        <!-- 제목 -->
        <h1 class="detail-title">{{ state.post.title }}</h1>

        <!-- 작성자 정보 -->
        <div class="detail-meta">
          <div class="author-info">
            <div class="author-avatar">{{ state.post.writerName?.charAt(0) ?? '?' }}</div>
            <div class="author-copy">
              <span class="author-name">{{ state.post.writerName ?? '알 수 없음' }}</span>
              <span class="author-date">{{ formatDate(state.post.createdAt) }}</span>
            </div>
          </div>
          <div class="detail-stats">
            <span class="stat-item">조회 {{ state.post.viewCount ?? 0 }}</span>
            <span v-if="!isNotice" class="stat-item">댓글 {{ state.comments.length }}</span>
          </div>
        </div>

        <div class="detail-divider" />

        <!-- 본문 -->
        <div class="detail-body" v-html="state.post.content" />

        <!-- 첨부파일 -->
        <div v-if="state.post.files && state.post.files.length > 0" class="detail-files">
          <p class="files-label">첨부파일</p>
          <div v-for="file in state.post.files" :key="file.fileId" class="file-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <span>{{ file.originName }}</span>
          </div>
        </div>

        <!-- 댓글 섹션 (게시글만) -->
        <template v-if="!isNotice">
          <div class="detail-divider" />
          <div class="comment-section">
            <h3 class="comment-title">
              댓글
              <span class="comment-count">{{ state.comments.length }}</span>
            </h3>

            <div v-if="state.comments.length === 0" class="comment-empty">
              등록된 댓글이 없습니다.
            </div>

            <div
              v-for="comment in state.comments"
              :key="comment.commentId"
              class="comment-item"
              :class="{ 'comment-item--deleted': comment.isDeleted }"
            >
              <template v-if="comment.isDeleted">
                <div class="comment-deleted">(삭제된 댓글입니다.)</div>
              </template>

              <template v-else>
                <div class="comment-avatar" :class="{ 'avatar--admin': isAdminRole(comment.userRole) }">
                  {{ comment.writerName?.charAt(0) ?? '?' }}
                </div>
                <div class="comment-body">
                  <div class="comment-header">
                    <span class="comment-author">{{ comment.writerName ?? '알 수 없음' }}</span>
                    <span v-if="isAdminRole(comment.userRole)" class="badge-admin-tag">관리자</span>
                    <span class="comment-date">{{ formatDate(comment.createdAt) }}</span>
                    <button class="btn-comment-delete" @click="openDeleteCommentModal(comment.commentId)">삭제</button>
                  </div>
                  <p class="comment-content">{{ comment.content }}</p>
                </div>
              </template>
            </div>

            <!-- 댓글 입력 -->
            <div class="comment-input-wrap">
              <input
                v-model="state.commentInput"
                class="comment-input"
                type="text"
                placeholder="관리자 댓글을 입력해주세요."
                @keyup.enter="onSubmitComment"
              />
              <button
                class="btn-comment-submit"
                :disabled="!state.commentInput.trim() || state.isSubmitting"
                @click="onSubmitComment"
              >
                등록
              </button>
            </div>
          </div>
        </template>
      </div>

      <!-- 우측 사이드바 -->
      <div class="detail-sidebar">
        <!-- 게시글 정보 -->
        <div class="sidebar-card">
          <h3 class="sidebar-title">게시글 정보</h3>
          <div class="info-row">
            <span class="info-label">카테고리</span>
            <span class="info-value">{{ categoryLabel }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">작성자</span>
            <span class="info-value">{{ state.post.writerName ?? '알 수 없음' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">조회수</span>
            <span class="info-value">{{ state.post.viewCount ?? 0 }}</span>
          </div>
          <div v-if="!isNotice" class="info-row">
            <span class="info-label">댓글 수</span>
            <span class="info-value">{{ state.comments.length }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">작성일</span>
            <span class="info-value">{{ formatDate(state.post.createdAt) }}</span>
          </div>
          <div v-if="state.post.updatedAt" class="info-row">
            <span class="info-label">수정일</span>
            <span class="info-value">{{ formatDate(state.post.updatedAt) }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">삭제여부</span>
            <span class="info-value" :class="state.post.isDeleted ? 'text-danger' : 'text-success'">
              {{ state.post.isDeleted ? '삭제됨' : '정상' }}
            </span>
          </div>
        </div>

        <!-- 관리 -->
        <div class="sidebar-card">
          <h3 class="sidebar-title">관리</h3>
          <button class="btn-back" @click="goBack">목록으로 돌아가기</button>
          <button v-if="isNotice" class="btn-edit" @click="goEdit">
            공지 수정
          </button>
          <button class="btn-delete" @click="openDeletePostModal">
            {{ isNotice ? '공지 삭제' : '게시글 삭제' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 게시글 삭제 모달 -->
    <ConfirmModal
      :visible="state.showDeletePostModal"
      :title="isNotice ? '공지를 삭제하시겠습니까?' : '게시글을 삭제하시겠습니까?'"
      subtitle="삭제된 글은 복구할 수 없습니다."
      :item-name="state.post?.title"
      confirm-text="삭제"
      cancel-text="취소"
      confirm-type="danger"
      :loading="state.isSubmitting"
      @confirm="onDeletePost"
      @cancel="state.showDeletePostModal = false"
    />

    <!-- 댓글 삭제 모달 -->
    <ConfirmModal
      :visible="state.showDeleteCommentModal"
      title="댓글을 삭제하시겠습니까?"
      subtitle="삭제된 댓글은 복구할 수 없습니다."
      confirm-text="삭제"
      cancel-text="취소"
      confirm-type="danger"
      :loading="state.isSubmitting"
      @confirm="onDeleteComment"
      @cancel="state.showDeleteCommentModal = false"
    />
  </div>
</template>

<style scoped>
.board-detail {
  width: 100%;
}

.loading-wrap {
  display: flex;
  justify-content: center;
  gap: var(--space-8);
  padding: var(--space-48);
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: var(--radius-full);
  background-color: var(--color-primary);
  animation: dotBounce 0.7s infinite alternate;
}
.dot:nth-child(2) { animation-delay: 0.15s; }
.dot:nth-child(3) { animation-delay: 0.3s; }

@keyframes dotBounce {
  from { transform: translateY(0); opacity: 0.3; }
  to { transform: translateY(-5px); opacity: 1; }
}

.detail-layout {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: var(--space-24);
  align-items: start;
}

.detail-main {
  display: flex;
  flex-direction: column;
  gap: var(--space-16);
  padding: var(--space-24);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-12);
  background: var(--color-card-bg);
  box-shadow: var(--shadow-small);
}

.detail-badge-row {
  display: flex;
  align-items: center;
  gap: var(--space-8);
}

.badge-category {
  display: inline-block;
  padding: 3px var(--space-8);
  border-radius: var(--radius-4);
  font-size: var(--font-size-badge);
  font-weight: 700;
}

.badge-notice {
  background: var(--color-primary);
  color: var(--white);
}

.badge-free {
  background: var(--color-bg-muted);
  color: var(--color-text-secondary);
}

.badge-deleted {
  display: inline-block;
  padding: 3px var(--space-8);
  border-radius: var(--radius-4);
  font-size: var(--font-size-badge);
  font-weight: 700;
  background: rgba(229, 62, 62, 0.12);
  color: var(--color-danger);
}

.detail-title {
  margin: 0;
  font-size: var(--font-size-heading-3);
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1.4;
}

.detail-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.author-info {
  display: flex;
  align-items: center;
  gap: var(--space-12);
}

.author-avatar {
  width: 38px;
  height: 38px;
  border-radius: var(--radius-full);
  background: var(--color-primary);
  color: var(--white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-body-sm);
  font-weight: 700;
  flex-shrink: 0;
}

.author-copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.author-name {
  font-size: var(--font-size-body-sm);
  font-weight: 700;
  color: var(--color-text-primary);
}

.author-date {
  font-size: var(--font-size-detail);
  color: var(--color-text-secondary);
}

.detail-stats {
  display: flex;
  gap: var(--space-12);
}

.stat-item {
  font-size: var(--font-size-detail);
  color: var(--color-text-secondary);
}

.detail-divider {
  height: 1px;
  background: var(--color-border);
}

.detail-body {
  font-size: var(--font-size-body-sm);
  color: var(--color-text-primary);
  line-height: 1.8;
  min-height: 120px;
}

:deep(.detail-body p) { margin-bottom: var(--space-8); }
:deep(.detail-body strong) { font-weight: 700; }
:deep(.detail-body em) { font-style: italic; }
:deep(.detail-body ul) { padding-left: var(--space-20); list-style: disc; }

.detail-files {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.files-label {
  font-size: var(--font-size-detail);
  font-weight: 600;
  color: var(--color-text-secondary);
  margin: 0;
}

.file-item {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  font-size: var(--font-size-detail);
  color: var(--color-text-primary);
}

/* 댓글 */
.comment-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}

.comment-title {
  margin: 0;
  font-size: var(--font-size-body-sm);
  font-weight: 700;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: var(--space-8);
}

.comment-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 1px var(--space-8);
  border-radius: 99px;
  background: var(--color-primary);
  color: var(--white);
  font-size: var(--font-size-badge);
  font-weight: 700;
}

.comment-empty {
  text-align: center;
  padding: var(--space-32) 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-detail);
}

.comment-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-12);
  padding: var(--space-12) var(--space-16);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-8);
  background: var(--color-card-bg);
  transition: background 0.12s;
}

.comment-item--deleted {
  background: var(--color-bg-muted);
}

.comment-deleted {
  font-size: var(--font-size-detail);
  color: var(--color-text-secondary);
  font-style: italic;
  padding: var(--space-4) 0;
}

.comment-avatar {
  width: 34px;
  height: 34px;
  border-radius: var(--radius-full);
  background: var(--color-bg-muted);
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-detail);
  font-weight: 700;
  flex-shrink: 0;
}

.avatar--admin {
  background: var(--admin-main-navy);
  color: var(--white);
}

.comment-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.comment-header {
  display: flex;
  align-items: center;
  gap: var(--space-8);
}

.comment-author {
  font-size: var(--font-size-detail);
  font-weight: 700;
  color: var(--color-text-primary);
}

.badge-admin-tag {
  display: inline-block;
  padding: 1px var(--space-8);
  border-radius: 99px;
  background: var(--admin-main-navy);
  color: var(--white);
  font-size: var(--font-size-badge);
  font-weight: 700;
}

.comment-date {
  font-size: var(--font-size-detail);
  color: var(--color-text-secondary);
  flex: 1;
}

.btn-comment-delete {
  height: 24px;
  padding: 0 var(--space-8);
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-4);
  background: var(--white);
  font-size: var(--font-size-detail);
  color: var(--color-danger);
  cursor: pointer;
  transition: background 0.12s;
  white-space: nowrap;
}

.btn-comment-delete:hover { background: rgba(229, 62, 62, 0.06); }

.comment-content {
  font-size: var(--font-size-detail);
  color: var(--color-text-primary);
  line-height: 1.6;
  white-space: pre-wrap;
  margin: 0;
}

.comment-input-wrap {
  display: flex;
  gap: var(--space-8);
  margin-top: var(--space-8);
}

.comment-input {
  flex: 1;
  height: 44px;
  padding: 0 var(--space-12);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-8);
  font-size: var(--font-size-detail);
  color: var(--color-text-primary);
  outline: none;
  transition: border-color 0.15s;
  background: var(--color-bg-muted);
}

.comment-input:focus {
  border-color: var(--color-primary);
  background: var(--white);
}

.comment-input::placeholder { color: var(--color-border-strong); }

.btn-comment-submit {
  height: 44px;
  padding: 0 var(--space-20);
  border: none;
  border-radius: var(--radius-8);
  background: var(--admin-main-navy);
  color: var(--white);
  font-size: var(--font-size-detail);
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.15s;
}

.btn-comment-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 사이드바 */
.detail-sidebar {
  display: flex;
  flex-direction: column;
  gap: var(--space-16);
}

.sidebar-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  padding: var(--space-16) var(--space-20);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-12);
  background: var(--color-card-bg);
  box-shadow: var(--shadow-small);
}

.sidebar-title {
  margin: 0 0 var(--space-4);
  font-size: var(--font-size-body-sm);
  font-weight: 700;
  color: var(--color-text-primary);
}

.info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-8) 0;
  border-bottom: 1px solid var(--color-border);
  font-size: var(--font-size-detail);
}

.info-row:last-child { border-bottom: none; }

.info-label { color: var(--color-text-secondary); }
.info-value { color: var(--color-text-primary); font-weight: 600; }
.text-danger { color: var(--color-danger) !important; }
.text-success { color: var(--color-success) !important; }

.btn-back {
  width: 100%;
  height: 36px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-8);
  background: var(--white);
  font-size: var(--font-size-detail);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background 0.15s;
}

.btn-back:hover { background: var(--color-bg-muted); }

.btn-edit {
  width: 100%;
  height: 36px;
  border: none;
  border-radius: var(--radius-8);
  background: var(--color-primary);
  color: var(--white);
  font-size: var(--font-size-detail);
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}

.btn-edit:hover { opacity: 0.88; }

.btn-delete {
  width: 100%;
  height: 36px;
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-8);
  background: var(--white);
  font-size: var(--font-size-detail);
  color: var(--color-danger);
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-delete:hover { background: rgba(229, 62, 62, 0.06); }
</style>
