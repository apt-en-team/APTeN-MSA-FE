<script>
import { reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useNoticeStore } from '@/stores/useNoticeStore'

export default {
  name: 'ResidentNoticeList',

  setup() {
    const router = useRouter()
    const route = useRoute()
    const noticeStore = useNoticeStore()

    const state = reactive({
      page: 0,
      size: 20,
    })

    const notices = computed(() => noticeStore.notices?.content ?? [])
    const totalPages = computed(() => noticeStore.notices?.totalPages ?? 0)
    const loading = computed(() => noticeStore.loading)

    const fetchNotices = async () => {
      await noticeStore.fetchNotices({ page: state.page, size: state.size })
    }

    const goToDetail = (noticeId) => {
      router.push(`/resident/${route.params.complexId}/notice/${noticeId}`)
    }

    const onPageChange = (p) => {
      state.page = p
      fetchNotices()
    }

    const formatDate = (dateStr) => {
      if (!dateStr) return ''
      const d = new Date(dateStr)
      return `${String(d.getFullYear()).slice(2)}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
    }

    onMounted(() => {
      fetchNotices()
    })

    return {
      state,
      notices,
      totalPages,
      loading,
      goToDetail,
      onPageChange,
      formatDate,
    }
  },
}
</script>

<template>
  <div class="notice-list">
    <!-- 로딩 -->
    <div v-if="loading" class="loading-wrap">
      <span class="dot" /><span class="dot" /><span class="dot" />
    </div>

    <template v-else>
      <!-- 타이틀 -->
      <div class="notice-header">
        <h2 class="notice-page-title">공지사항</h2>
      </div>

      <!-- 목록 -->
      <ul class="notice-items">
        <li
          v-for="notice in notices"
          :key="notice.noticeId"
          class="notice-item card-section"
          @click="goToDetail(notice.noticeId)"
        >
          <div class="notice-body">
            <div class="notice-title-row">
              <span class="badge-notice">공지</span>
              <p class="notice-title">
                {{ notice.title }}
                <span v-if="notice.thumbSavedName" class="attach-icon attach-icon--image">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                </span>
                <span v-if="notice.hasFile" class="attach-icon attach-icon--file">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                  </svg>
                </span>
              </p>
            </div>
            <div class="notice-meta">
              <span class="meta-writer">{{ notice.writerName ?? '관리사무소' }}</span>
              <span class="meta-dot">·</span>
              <span class="meta-date">{{ formatDate(notice.createdAt) }}</span>
            </div>
          </div>
        </li>

        <li v-if="notices.length === 0" class="notice-empty">
          공지사항이 없습니다.
        </li>
      </ul>

      <!-- 페이지네이션 -->
      <div v-if="totalPages > 1" class="pagination">
        <button
          v-for="p in totalPages"
          :key="p"
          class="page-btn"
          :class="{ active: state.page === p - 1 }"
          @click="onPageChange(p - 1)"
        >{{ p }}</button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.notice-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}

.notice-header {
  padding: 0 var(--space-4);
}

.notice-page-title {
  font-size: var(--font-size-heading-3);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
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

.notice-items {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  padding: 0;
}

.notice-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-12);
  padding: var(--space-16) !important;
  cursor: pointer;
  transition: background 0.12s;
}

.notice-item:hover {
  background: var(--color-bg-muted);
}

.notice-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.notice-title-row {
  display: flex;
  align-items: center;
  gap: var(--space-8);
}

.badge-notice {
  display: inline-block;
  padding: 2px var(--space-8);
  border-radius: var(--radius-4);
  background: var(--color-primary);
  color: var(--white);
  font-size: var(--font-size-badge);
  font-weight: 700;
  white-space: nowrap;
  flex-shrink: 0;
}

.notice-title {
  font-size: var(--font-size-body-sm);
  font-weight: 600;
  color: var(--color-text-primary);
  line-height: 1.5;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 4px;
}

.attach-icon {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
}

.attach-icon--image {
  color: var(--color-primary);
}

.attach-icon--file {
  color: #e67e22;
}

.notice-meta {
  display: flex;
  align-items: center;
  gap: var(--space-8);
}

.meta-writer {
  font-size: var(--font-size-detail);
  color: var(--color-text-secondary);
  font-weight: 600;
}

.meta-dot {
  font-size: var(--font-size-detail);
  color: var(--color-border-strong);
}

.meta-date {
  font-size: var(--font-size-detail);
  color: var(--color-text-secondary);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: var(--font-size-detail);
  color: var(--color-text-secondary);
}

.notice-empty {
  padding: var(--space-48) var(--space-16);
  text-align: center;
  font-size: var(--font-size-body-sm);
  color: var(--color-text-secondary);
}

.pagination {
  display: flex;
  justify-content: center;
  gap: var(--space-4);
}

.page-btn {
  width: 30px;
  height: 30px;
  border-radius: var(--radius-8);
  font-size: var(--font-size-body-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}

.page-btn.active {
  background-color: var(--color-primary);
  color: var(--white);
  font-weight: 700;
}

.page-btn:hover:not(.active) {
  background-color: var(--color-bg-muted);
}
</style>
