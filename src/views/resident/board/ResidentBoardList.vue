<script>
import { reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useBoardStore } from '@/stores/useBoardStore'

export default {
  name: 'ResidentBoardList',

  setup() {
    const router = useRouter()
    const route = useRoute()
    const boardStore = useBoardStore()

    const state = reactive({
      activeTab: 'free',
      keyword: '',
      page: 0,
      size: 20,
    })

    const posts = computed(() => {
      if (state.activeTab === 'my') {
        return boardStore.myPosts?.content ?? []
      }
      return boardStore.posts?.content ?? []
    })

    const totalPages = computed(() => {
      if (state.activeTab === 'my') {
        return boardStore.myPosts?.totalPages ?? 0
      }
      return boardStore.posts?.totalPages ?? 0
    })

    const loading = computed(() => boardStore.loading)

    const fetchPosts = () => {
      if (state.activeTab === 'my') {
        boardStore.fetchMyPosts({ page: state.page, size: state.size })
      } else {
        boardStore.fetchPosts({
          keyword: state.keyword || undefined,
          category: state.activeTab === 'inquiry' ? 'INQUIRY' : 'FREE',
          page: state.page,
          size: state.size,
        })
      }
    }

    const onSearch = () => {
      state.page = 0
      fetchPosts()
    }

    const onTabChange = (tab) => {
      state.activeTab = tab
      state.page = 0
      state.keyword = ''
      fetchPosts()
    }

    const goToDetail = (postId) => {
      router.push({
        path: `/resident/${route.params.complexId}/board/${postId}`,
        query: { category: state.activeTab }
      })
    }

    const goToCreate = () => {
      router.push(`/resident/${route.params.complexId}/board/posts`)
    }

    const onPageChange = (p) => {
      state.page = p
      fetchPosts()
    }

    const formatDate = (dateStr) => {
      if (!dateStr) return ''
      const d = new Date(dateStr)
      const now = new Date()
      const isToday = d.toDateString() === now.toDateString()
      if (isToday) {
        return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
      }
      return `${String(d.getFullYear()).slice(2)}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
    }

    onMounted(() => {
      const category = route.query.category
      if (category) {
        state.activeTab = category
      }
      fetchPosts()
    })

    return {
      state,
      posts,
      totalPages,
      loading,
      onSearch,
      onTabChange,
      goToDetail,
      goToCreate,
      onPageChange,
      formatDate,
    }
  },
}
</script>

<template>
  <div class="board-wrap">

    <!-- 탭 -->
    <div class="tab-row">
      <button
        class="tab-pill"
        :class="{ active: state.activeTab === 'free' }"
        @click="onTabChange('free')"
      >자유</button>
      <button
        class="tab-pill"
        :class="{ active: state.activeTab === 'inquiry' }"
        @click="onTabChange('inquiry')"
      >문의 사항</button>
      <button
        class="tab-pill"
        :class="{ active: state.activeTab === 'my' }"
        @click="onTabChange('my')"
      >내가 쓴 글</button>
    </div>

    <!-- 검색 -->
    <div class="search-box">
      <input
        v-model="state.keyword"
        class="search-input"
        type="text"
        placeholder="검색어를 입력하세요"
        @keyup.enter="onSearch"
      />
      <button class="search-icon-btn" @click="onSearch">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" stroke-width="1.6"/>
          <path d="M10 10L14 14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
        </svg>
      </button>
    </div>

    <!-- 로딩 -->
    <div v-if="loading" class="loading-wrap">
      <span class="dot" /><span class="dot" /><span class="dot" />
    </div>

    <!-- 게시글 목록 -->
    <ul v-else class="post-list card-section">
      <li
        v-for="post in posts"
        :key="post.postId"
        class="post-item"
        @click="goToDetail(post.postId)"
      >
        <div class="post-body">
          <p class="post-title text-ellipsis">{{ post.title }}</p>
          <p v-if="post.preview" class="post-preview">{{ post.preview }}</p>
          <div class="post-stats">
            <span class="stat">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 1h10v6.5H7l-1 2-1-2H1V1z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
              </svg>
              {{ post.commentCount ?? 0 }}
            </span>
            <span class="stat stat--like">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 10S1 6.5 1 3.5a2.5 2.5 0 015 0 2.5 2.5 0 015 0C11 6.5 6 10 6 10z" stroke="currentColor" stroke-width="1.2"/>
              </svg>
              {{ post.likeCount ?? 0 }}
            </span>
            <span class="stat">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <ellipse cx="6" cy="6" rx="5" ry="3" stroke="currentColor" stroke-width="1.2"/>
                <circle cx="6" cy="6" r="1.5" fill="currentColor"/>
              </svg>
              {{ post.viewCount ?? 0 }}
            </span>
            <span class="meta-sep">|</span>
            <span class="meta-name">{{ post.writerName ?? '익명' }}</span>
            <span class="meta-dot">·</span>
            <span class="meta-date">{{ formatDate(post.createdAt) }}</span>
          </div>
        </div>

        <div v-if="post.thumbUrl" class="post-thumb">
          <img :src="post.thumbUrl" alt="" />
        </div>
      </li>

      <li v-if="posts.length === 0" class="post-empty">
        게시글이 없습니다.
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

    <!-- FAB -->
    <button class="fab" @click="goToCreate" aria-label="글쓰기">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 3v14M3 10h14" stroke="white" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>
  </div>
</template>

<style scoped>
.board-wrap {
  display: flex;
  flex-direction: column;
  gap: var(--space-12);
}

.tab-row {
  display: flex;
  gap: var(--space-8);
}

.tab-pill {
  padding: var(--space-8) var(--space-16);
  font-size: var(--font-size-body-sm);
  font-weight: 500;
  color: var(--color-text-secondary);
  background: var(--white);
  border: 1.4px solid var(--color-border);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.tab-pill.active {
  color: var(--color-primary);
  border-color: var(--color-primary);
  font-weight: 600;
  background: var(--white);
}

.search-box {
  display: flex;
  align-items: center;
  background: var(--white);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-8);
  overflow: hidden;
  transition: border-color 0.15s;
}

.search-box:focus-within {
  border-color: var(--color-primary);
}

.search-input {
  flex: 1;
  padding: var(--space-8) var(--space-12);
  border: none;
  outline: none;
  font-size: var(--font-size-body-sm);
  color: var(--color-text-primary);
  background: transparent;
}

.search-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 var(--space-12);
  height: 36px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: color 0.15s;
}

.search-icon-btn:hover {
  color: var(--color-primary);
}

.loading-wrap {
  display: flex;
  justify-content: center;
  gap: var(--space-8);
  padding: var(--space-32);
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

.post-list {
  padding: 0 !important;
  overflow: hidden;
}

.post-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-12);
  padding: var(--space-12) var(--space-16);
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  transition: background-color 0.12s;
}

.post-item:last-child {
  border-bottom: none;
}

.post-item:hover {
  background-color: var(--color-bg-muted);
}

.post-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.post-title {
  font-size: var(--font-size-body);
  font-weight: 600;
  color: var(--color-text-primary);
}

.post-preview {
  font-size: var(--font-size-body-sm);
  color: var(--color-text-secondary);
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.post-stats {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  margin-top: var(--space-4);
}

.stat {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: var(--font-size-detail);
  color: var(--color-text-secondary);
}

.stat--like {
  color: var(--color-danger);
}

.meta-sep {
  font-size: var(--font-size-detail);
  color: var(--color-border-strong);
  margin: 0 var(--space-4);
}

.meta-name {
  font-size: var(--font-size-detail);
  color: var(--color-text-secondary);
}

.meta-dot {
  font-size: var(--font-size-detail);
  color: var(--color-border-strong);
}

.meta-date {
  font-size: var(--font-size-detail);
  color: var(--color-text-secondary);
}

.post-thumb {
  width: 60px;
  height: 60px;
  border-radius: var(--radius-8);
  overflow: hidden;
  flex-shrink: 0;
  background-color: var(--color-bg-muted);
}

.post-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.post-empty {
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

.fab {
  position: fixed;
  bottom: 100px;
  right: calc(50% - 215px + 16px);
  width: 48px;
  height: 48px;
  border-radius: var(--radius-full);
  background-color: var(--color-primary);
  box-shadow: var(--shadow-medium);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
  z-index: 50;
}

.fab:hover {
  transform: scale(1.07);
  box-shadow: var(--shadow-large);
}

@media (max-width: 430px) {
  .fab {
    right: 16px;
    bottom: 88px;
  }
}
</style>
