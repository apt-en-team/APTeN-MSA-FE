<script>
import { reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useBoardStore } from '@/stores/useBoardStore'
import ConfirmModal from '@/components/common/ConfirmModal.vue'

export default {
  name: 'ResidentBoardDetail',
  components: { ConfirmModal },

  setup() {
    const router = useRouter()
    const route = useRoute()
    const boardStore = useBoardStore()

    const postId = computed(() => route.params.postId)

    const state = reactive({
      commentInput: '',
      commentPage: 0,
      commentSize: 20,
      showAllComments: false,
      showBottomSheet: false,
      showDeleteModal: false,
      showCommentBottomSheet: false,
      showCommentDeleteModal: false,
      selectedCommentId: null,
      editingCommentId: null,
      editingCommentContent: '',
    })

    const post = computed(() => boardStore.postDetail)
    const comments = computed(() => boardStore.comments?.content ?? [])
    const loading = computed(() => boardStore.loading)

    const formatDate = (dateStr) => {
      if (!dateStr) return ''
      const d = new Date(dateStr)
      return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
    }

    const formatRelative = (dateStr) => {
      if (!dateStr) return ''
      const d = new Date(dateStr)
      const now = new Date()
      const diff = Math.floor((now - d) / 1000)
      const isToday = d.toDateString() === now.toDateString()

      if (!isToday) {
        return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
      }
      if (diff < 60) return '방금 전'
      if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
      return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    }

    const goBack = () => {
      const category = route.query.category ?? 'free'
      router.push({
        path: `/resident/${route.params.complexId}/board`,
        query: { category }
      })
    }

    const goToEdit = () => {
      state.showBottomSheet = false
      router.push(`/resident/${route.params.complexId}/board/${postId.value}/edit`)
    }

    const openDeleteModal = () => {
      state.showBottomSheet = false
      state.showDeleteModal = true
    }

    const onDeletePost = async () => {
      await boardStore.deletePost(postId.value)
      state.showDeleteModal = false
      goBack()
    }

    const onToggleLike = async () => {
      await boardStore.togglePostLike(postId.value)
      await boardStore.fetchPostDetail(postId.value)
    }

    const onSubmitComment = async () => {
      if (!state.commentInput.trim()) return
      await boardStore.createComment(postId.value, { content: state.commentInput })
      state.commentInput = ''
      await boardStore.fetchComments(postId.value, { page: 0, size: state.commentSize })
    }

    const openCommentBottomSheet = (commentId) => {
      state.selectedCommentId = commentId
      state.showCommentBottomSheet = true
    }

    const openCommentEditMode = () => {
      state.showCommentBottomSheet = false
      const comment = comments.value.find(c => c.commentId === state.selectedCommentId)
      if (comment) {
        state.editingCommentId = state.selectedCommentId
        state.editingCommentContent = comment.content
      }
    }

    const cancelEditComment = () => {
      state.editingCommentId = null
      state.editingCommentContent = ''
    }

    const submitEditComment = async () => {
      if (!state.editingCommentContent.trim()) return
      await boardStore.updateComment(state.editingCommentId, { content: state.editingCommentContent })
      cancelEditComment()
      await boardStore.fetchComments(postId.value, { page: 0, size: state.commentSize })
    }

    const openCommentDeleteModal = () => {
      state.showCommentBottomSheet = false
      state.showCommentDeleteModal = true
    }

    const onDeleteComment = async () => {
      await boardStore.deleteComment(state.selectedCommentId)
      state.showCommentDeleteModal = false
      state.selectedCommentId = null
      await boardStore.fetchComments(postId.value, { page: 0, size: state.commentSize })
    }

    const loadMoreComments = async () => {
      state.showAllComments = true
      await boardStore.fetchComments(postId.value, { page: 0, size: 100 })
    }

    // comments를 접힌 상태/펼친 상태로 분리
    const visibleComments = computed(() => {
      if (state.showAllComments) return comments.value
      return comments.value.slice(-3) // 최근 3개만
    })

    const hasMoreComments = computed(() => {
      return !state.showAllComments && comments.value.length > 3
    })

    const avatarLetter = (name) => name?.charAt(0) ?? '?'

    onMounted(async () => {
      await boardStore.fetchPostDetail(postId.value)
      await boardStore.fetchComments(postId.value, { page: 0, size: state.commentSize })
    })

    return {
      state,
      post,
      comments,
      visibleComments,
      hasMoreComments,
      loading,
      formatDate,
      formatRelative,
      goBack,
      goToEdit,
      openDeleteModal,
      onDeletePost,
      onToggleLike,
      onSubmitComment,
      openCommentBottomSheet,
      openCommentEditMode,
      cancelEditComment,
      submitEditComment,
      openCommentDeleteModal,
      onDeleteComment,
      loadMoreComments,
      avatarLetter,
    }
  },
}
</script>

<template>
  <div class="detail-wrap">

    <!-- 뒤로가기 버튼 -->
    <button class="back-btn" @click="goBack">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M12 4L6 10L12 16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      목록으로
    </button>

    <!-- 로딩 -->
    <div v-if="loading && !post" class="loading-wrap">
      <span class="dot" /><span class="dot" /><span class="dot" />
    </div>

    <template v-else-if="post">
      <!-- 작성자 정보 -->
      <div class="author-row">
        <div class="author-avatar">{{ avatarLetter(post.writerName) }}</div>
        <div class="author-info">
          <span class="author-name">{{ post.writerName ?? '익명' }}</span>
          <span class="author-meta">조회수 {{ post.viewCount }} · {{ formatDate(post.createdAt) }}</span>
          <span class="author-unit">그린아파트 102동</span>
        </div>
        <button class="more-btn" @click="state.showBottomSheet = true">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="4" r="1.5" fill="currentColor"/>
            <circle cx="9" cy="9" r="1.5" fill="currentColor"/>
            <circle cx="9" cy="14" r="1.5" fill="currentColor"/>
          </svg>
        </button>
      </div>

      <!-- 이미지 첨부파일 -->
      <div
        v-if="post.files && post.files.some(f => f.fileType === 'IMAGE')"
        class="image-section"
      >
        <img
          v-for="file in post.files.filter(f => f.fileType === 'IMAGE')"
          :key="file.fileId"
          :src="file.filePath"
          :alt="file.originName"
          class="post-image"
        />
      </div>

      <!-- 본문 -->
      <div class="post-content">
        <h2 class="post-title">{{ post.title }}</h2>
        <div class="post-body" v-html="post.content"></div>
      </div>

      <!-- 좋아요/댓글 바 -->
      <div class="reaction-row">
        <div class="reaction-left">
          <span class="reaction-item">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M1.5 1.5h12v8H9l-1.5 2.5L6 9.5H1.5V1.5z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/>
            </svg>
            {{ comments.length }}
          </span>
          <button class="reaction-item like-btn" @click="onToggleLike">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path
                d="M7.5 12.5S1 8.5 1 4.5a3 3 0 016 0 3 3 0 016 0c0 4-6.5 8-6.5 8z"
                :fill="post.liked ? 'var(--color-danger)' : 'none'"
                stroke="var(--color-danger)"
                stroke-width="1.3"
              />
            </svg>
            <span class="like-count">{{ post.likeCount }}</span>
          </button>
        </div>

        <!-- 댓글 더보기 버튼 -->
        <button
          v-if="hasMoreComments"
          class="more-comments-btn"
          @click="state.showAllComments = true"
        >
          댓글 더보기 ({{ comments.length - 3 }})
        </button>
      </div>

      <!-- 댓글 목록 -->
      <ul class="comment-list">
        <li v-for="comment in visibleComments"
          :key="comment.commentId"
          class="comment-item"
        >
          <div class="comment-avatar">{{ avatarLetter(comment.writerName) }}</div>
          <div class="comment-body">
            <div class="comment-header">
              <div class="comment-author-wrap">
                <span class="comment-author">{{ comment.writerName ?? '익명' }}</span>
              </div>
              <div class="comment-header-right">
                <span class="comment-time">{{ formatRelative(comment.createdAt) }}</span>
                <button class="more-btn" @click="openCommentBottomSheet(comment.commentId)">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="3.5" r="1.3" fill="currentColor"/>
                    <circle cx="8" cy="8" r="1.3" fill="currentColor"/>
                    <circle cx="8" cy="12.5" r="1.3" fill="currentColor"/>
                  </svg>
                </button>
              </div>
            </div>
            <span class="comment-unit">그린아파트 102동</span>

            <!-- 수정 모드 -->
            <div v-if="state.editingCommentId === comment.commentId" class="comment-edit-wrap">
              <input
                v-model="state.editingCommentContent"
                class="comment-edit-input"
                type="text"
                @keyup.enter="submitEditComment"
              />
              <div class="comment-edit-actions">
                <button class="comment-edit-cancel" @click="cancelEditComment">취소</button>
                <button class="comment-edit-submit" @click="submitEditComment">수정</button>
              </div>
            </div>

            <!-- 일반 모드 -->
            <p v-else class="comment-content">{{ comment.content }}</p>
          </div>
        </li>

        <li v-if="comments.length === 0" class="comment-empty">
          첫 댓글을 작성해보세요.
        </li>
      </ul>
    </template>

    <!-- 게시글 바텀시트 -->
    <div v-if="state.showBottomSheet" class="bottom-sheet-overlay" @click="state.showBottomSheet = false">
      <div class="bottom-sheet" @click.stop>
        <div class="bottom-sheet-handle"></div>
        <button class="bottom-sheet-btn" @click="goToEdit">수정하기</button>
        <button class="bottom-sheet-btn bottom-sheet-btn--danger" @click="openDeleteModal">삭제하기</button>
      </div>
    </div>

    <!-- 댓글 바텀시트 -->
    <div v-if="state.showCommentBottomSheet" class="bottom-sheet-overlay" @click="state.showCommentBottomSheet = false">
      <div class="bottom-sheet" @click.stop>
        <div class="bottom-sheet-handle"></div>
        <button class="bottom-sheet-btn" @click="openCommentEditMode">수정하기</button>
        <button class="bottom-sheet-btn bottom-sheet-btn--danger" @click="openCommentDeleteModal">삭제하기</button>
      </div>
    </div>

    <!-- 게시글 삭제 확인 모달 -->
    <ConfirmModal
      :visible="state.showDeleteModal"
      title="게시글을 삭제하시겠습니까?"
      subtitle="삭제된 게시글은 복구할 수 없습니다."
      confirm-text="삭제"
      cancel-text="취소"
      confirm-type="danger"
      @confirm="onDeletePost"
      @cancel="state.showDeleteModal = false"
    />

    <!-- 댓글 삭제 확인 모달 -->
    <ConfirmModal
      :visible="state.showCommentDeleteModal"
      title="댓글을 삭제하시겠습니까?"
      subtitle="삭제된 댓글은 복구할 수 없습니다."
      confirm-text="삭제"
      cancel-text="취소"
      confirm-type="danger"
      @confirm="onDeleteComment"
      @cancel="state.showCommentDeleteModal = false"
    />

    <!-- 댓글 입력창 고정 -->
    <div class="comment-input-bar">
      <input
        v-model="state.commentInput"
        class="comment-input"
        type="text"
        placeholder="댓글을 입력하세요"
        @keyup.enter="onSubmitComment"
      />
      <button
        class="comment-submit"
        :disabled="!state.commentInput.trim()"
        @click="onSubmitComment"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M2 9h14M10 3l6 6-6 6" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.detail-wrap {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
  background-color: var(--white);
  min-height: 100vh;
  margin: calc(-1 * var(--space-20)) calc(-1 * var(--space-32));
  padding: var(--space-20) var(--space-20);
  padding-bottom: 80px;
}

/* 뒤로가기 버튼 */
.back-btn {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  font-size: var(--font-size-body-sm);
  color: var(--color-text-secondary);
  background: none;
  cursor: pointer;
  padding: 0 var(--space-16);
  margin-bottom: var(--space-4);
}

.back-btn:hover {
  color: var(--color-primary);
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
  to   { transform: translateY(-5px); opacity: 1; }
}

.author-row {
  display: flex;
  align-items: flex-start;
  gap: var(--space-12);
  padding: var(--space-4) var(--space-16);
  border-bottom: 1px solid var(--color-border);
  padding-bottom: var(--space-12);
}

.author-avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background-color: var(--color-primary);
  color: var(--white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-body);
  font-weight: 700;
  flex-shrink: 0;
}

.author-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.author-name {
  font-size: var(--font-size-body);
  font-weight: 700;
  color: var(--color-text-primary);
}

.author-meta {
  font-size: var(--font-size-detail);
  color: var(--color-text-secondary);
}

.author-unit {
  font-size: var(--font-size-detail);
  color: var(--color-text-secondary);
}

.more-btn {
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: var(--space-4);
  flex-shrink: 0;
}

.image-section {
  margin: 0 calc(-1 * var(--space-20));
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.post-image {
  width: 100%;
  max-height: 280px;
  object-fit: cover;
  display: block;
}

.post-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
  padding: 0 var(--space-16);
}

.post-title {
  font-size: var(--font-size-heading-3);
  font-weight: 700;
  color: var(--color-text-primary);
}

.post-body {
  font-size: var(--font-size-body);
  color: var(--color-text-primary);
  line-height: 1.7;
}

:deep(.post-body p) { margin-bottom: var(--space-8); }
:deep(.post-body strong) { font-weight: 700; }
:deep(.post-body em) { font-style: italic; }
:deep(.post-body h1) { font-size: var(--font-size-heading-3); font-weight: 700; margin-bottom: var(--space-8); }
:deep(.post-body ul) { padding-left: var(--space-20); list-style: disc; }

.reaction-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-8) var(--space-16);
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
}

.reaction-left {
  display: flex;
  align-items: center;
  gap: var(--space-12);
}

.reaction-item {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  font-size: var(--font-size-body-sm);
  color: var(--color-text-secondary);
}

.like-btn {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  cursor: pointer;
  background: none;
}

.like-count {
  font-size: var(--font-size-body-sm);
  color: var(--color-danger);
  font-weight: 600;
}

.more-comments-btn {
  font-size: var(--font-size-body-sm);
  color: var(--color-primary);
  font-weight: 600;
  cursor: pointer;
  background: none;
}

.comment-list {
  padding: 0 !important;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  margin: 0 var(--space-4);
}

.comment-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-8);
  padding: var(--space-12) var(--space-16);
  border-bottom: 1px solid var(--color-border);
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-avatar {
  width: 34px;
  height: 34px;
  border-radius: var(--radius-full);
  background-color: var(--color-primary);
  color: var(--white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-body-sm);
  font-weight: 700;
  flex-shrink: 0;
}

.comment-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.comment-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.comment-author-wrap {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.comment-author {
  font-size: var(--font-size-body);
  font-weight: 700;
  color: var(--color-text-primary);
}

.comment-header-right {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.comment-time {
  font-size: var(--font-size-detail);
  color: var(--color-text-secondary);
}

.comment-date {
  font-size: var(--font-size-detail);
  color: var(--color-text-secondary);
}

.comment-unit {
  font-size: var(--font-size-detail);
  color: var(--color-text-secondary);
}

.comment-content {
  font-size: var(--font-size-body);
  color: var(--color-text-primary);
  line-height: 1.6;
  white-space: pre-wrap;
  margin-top: var(--space-4);
}

.comment-empty {
  padding: var(--space-24) var(--space-16);
  text-align: center;
  font-size: var(--font-size-body-sm);
  color: var(--color-text-secondary);
}

/* 댓글 수정 */
.comment-edit-wrap {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  margin-top: var(--space-4);
}

.comment-edit-input {
  width: 100%;
  padding: var(--space-8) var(--space-12);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-8);
  font-size: var(--font-size-body-sm);
  color: var(--color-text-primary);
  background: var(--white);
  outline: none;
}

.comment-edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-8);
}

.comment-edit-cancel {
  padding: var(--space-4) var(--space-12);
  border-radius: var(--radius-4);
  border: 1px solid var(--color-border-strong);
  background: transparent;
  font-size: var(--font-size-body-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
}

.comment-edit-submit {
  padding: var(--space-4) var(--space-12);
  border-radius: var(--radius-4);
  border: none;
  background: var(--color-primary);
  font-size: var(--font-size-body-sm);
  color: var(--white);
  font-weight: 700;
  cursor: pointer;
}

/* 댓글 입력창 고정 */
.comment-input-bar {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 430px;
  display: flex;
  align-items: center;
  gap: var(--space-8);
  padding: var(--space-12) var(--space-20);
  padding-bottom: calc(var(--space-12) + env(safe-area-inset-bottom, 0px));
  background-color: var(--white);
  border-top: 1px solid var(--color-border);
  z-index: 50;
}

.comment-input {
  flex: 1;
  padding: var(--space-8) var(--space-12);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-8);
  font-size: var(--font-size-body-sm);
  color: var(--color-text-primary);
  background: var(--color-bg-muted);
  outline: none;
  transition: border-color 0.15s;
}

.comment-input:focus {
  border-color: var(--color-primary);
  background: var(--white);
}

.comment-submit {
  width: 38px;
  height: 38px;
  border-radius: var(--radius-8);
  background-color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: opacity 0.15s;
}

.comment-submit:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 바텀시트 */
.bottom-sheet-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 100;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.bottom-sheet {
  width: 100%;
  max-width: 430px;
  background: var(--white);
  border-radius: var(--radius-12) var(--radius-12) 0 0;
  padding: var(--space-8) var(--space-16) calc(var(--space-32) + env(safe-area-inset-bottom, 0px));
  display: flex;
  flex-direction: column;
}

.bottom-sheet-handle {
  width: 36px;
  height: 4px;
  background: var(--color-border);
  border-radius: 2px;
  margin: var(--space-4) auto var(--space-16);
}

.bottom-sheet-btn {
  width: 100%;
  padding: var(--space-16);
  font-size: var(--font-size-body);
  color: var(--color-text-primary);
  background: none;
  cursor: pointer;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
  transition: background 0.12s;
}

.bottom-sheet-btn:last-child {
  border-bottom: none;
}

.bottom-sheet-btn:hover {
  background: var(--color-bg-muted);
}

.bottom-sheet-btn--danger {
  color: var(--color-danger);
}
</style>
