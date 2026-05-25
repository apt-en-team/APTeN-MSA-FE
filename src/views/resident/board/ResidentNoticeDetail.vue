<script>
import { reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useNoticeStore } from '@/stores/useNoticeStore'

export default {
  name: 'ResidentNoticeDetail',

  setup() {
    const router = useRouter()
    const route = useRoute()
    const noticeStore = useNoticeStore()

    const noticeId = computed(() => route.params.noticeId)

    const state = reactive({
      loading: false,
    })

    const notice = computed(() => noticeStore.noticeDetail)

    const formatDate = (dateStr) => {
      if (!dateStr) return ''
      const d = new Date(dateStr)
      return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
    }

    const goBack = () => {
      router.push(`/resident/${route.params.complexId}/notice`)
    }

    const avatarLetter = (name) => name?.charAt(0) ?? '관'

    onMounted(async () => {
      state.loading = true
      try {
        await noticeStore.fetchNoticeDetail(noticeId.value)
      } finally {
        state.loading = false
      }
    })

    return {
      state,
      notice,
      formatDate,
      goBack,
      avatarLetter,
    }
  },
}
</script>

<template>
  <div class="notice-detail">
    <!-- 로딩 -->
    <div v-if="state.loading" class="loading-wrap">
      <span class="dot" /><span class="dot" /><span class="dot" />
    </div>

    <template v-else-if="notice">
      <!-- 뒤로가기 -->
      <button class="back-btn" @click="goBack">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M12 4L6 10L12 16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        목록으로
      </button>

      <!-- 작성자 정보 -->
      <div class="author-row">
        <div class="author-avatar">{{ avatarLetter(notice.writerName) }}</div>
        <div class="author-info">
          <div class="author-name-row">
            <span class="author-name">{{ notice.writerName ?? '관리자' }}</span>
            <span class="badge-admin">관리자</span>
          </div>
          <span class="author-meta">조회수 {{ notice.viewCount ?? 0 }} · {{ formatDate(notice.createdAt) }}</span>
          <span class="author-unit">그린아파트 관리사무소</span>
        </div>
      </div>

      <!-- 제목 -->
      <div class="notice-content">
        <h2 class="notice-title">{{ notice.title }}</h2>
        <div class="notice-body" v-html="notice.content" />
      </div>

      <!-- 이미지 첨부파일 -->
      <div
        v-if="notice.files && notice.files.some(f => f.fileType === 'IMAGE')"
        class="image-section"
      >
        <img
          v-for="file in notice.files.filter(f => f.fileType === 'IMAGE')"
          :key="file.fileId"
          :src="file.filePath"
          :alt="file.originName"
          class="notice-image"
        />
      </div>

      <!-- 일반 첨부파일 -->
      <div
        v-if="notice.files && notice.files.some(f => f.fileType === 'FILE')"
        class="file-section"
      >
        <p class="file-label">첨부파일</p>
        <div
          v-for="file in notice.files.filter(f => f.fileType === 'FILE')"
          :key="file.fileId"
          class="file-item"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <span>{{ file.originName }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.notice-detail {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
  padding-bottom: var(--space-32);
  background-color: var(--white);
  min-height: 100vh;
  margin: calc(-1 * var(--space-20)) calc(-1 * var(--space-32));
  padding: var(--space-20) var(--space-20);
  padding-bottom: var(--space-32);
}

/* 로딩 */
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

/* 뒤로가기 */
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

/* 작성자 */
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
  background-color: var(--admin-main-navy);
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

.author-name-row {
  display: flex;
  align-items: center;
  gap: var(--space-8);
}

.author-name {
  font-size: var(--font-size-body-sm);
  font-weight: 700;
  color: var(--color-text-primary);
}

.badge-admin {
  display: inline-block;
  padding: 1px var(--space-8);
  border-radius: 99px;
  background: var(--admin-main-navy);
  color: var(--white);
  font-size: var(--font-size-badge);
  font-weight: 700;
}

.author-meta {
  font-size: var(--font-size-detail);
  color: var(--color-text-secondary);
}

.author-unit {
  font-size: var(--font-size-detail);
  color: var(--color-text-secondary);
}

/* 본문 */
.notice-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
  padding: 0 var(--space-16);
}

.notice-title {
  font-size: var(--font-size-heading-3);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
  line-height: 1.4;
}

.notice-body {
  font-size: var(--font-size-body-sm);
  color: var(--color-text-primary);
  line-height: 1.8;
}

:deep(.notice-body p) { margin-bottom: var(--space-8); }
:deep(.notice-body strong) { font-weight: 700; }
:deep(.notice-body em) { font-style: italic; }
:deep(.notice-body h1) { font-size: var(--font-size-heading-3); font-weight: 700; margin-bottom: var(--space-8); }
:deep(.notice-body ul) { padding-left: var(--space-20); list-style: disc; }

/* 이미지 */
.image-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  padding: 0 var(--space-16);
}

.notice-image {
  width: 100%;
  border-radius: var(--radius-8);
  object-fit: cover;
  display: block;
}

/* 첨부파일 */
.file-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  padding: var(--space-12) var(--space-16);
  background: var(--color-bg-muted);
  border-radius: var(--radius-8);
  margin: 0 var(--space-16);
}

.file-label {
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
  cursor: pointer;
}

.file-item:hover {
  color: var(--color-primary);
}
</style>
