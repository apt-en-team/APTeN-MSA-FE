<script setup>
import { reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBoardStore } from '@/stores/useBoardStore'
import { useNoticeStore } from '@/stores/useNoticeStore'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import BasePagination from '@/components/common/BasePagination.vue'

const router = useRouter()
const boardStore = useBoardStore()
const noticeStore = useNoticeStore()

const state = reactive({
  activeTab: 'all',
  keyword: '',
  page: 1,
  size: 10,
  showDeleteModal: false,
  selectedPost: null,
  isSubmitting: false,
})

const statistics = computed(() => boardStore.boardStatistics)
const loading = computed(() => boardStore.loading || noticeStore.loading)

const posts = computed(() => boardStore.posts?.content ?? [])
const notices = computed(() => noticeStore.notices?.content ?? [])

const postsTotalPages = computed(() => boardStore.posts?.totalPages ?? 1)
const noticesTotalPages = computed(() => noticeStore.notices?.totalPages ?? 1)
const postsTotalElements = computed(() => Number(boardStore.posts?.totalElements ?? 0))
const noticesTotalElements = computed(() => Number(noticeStore.notices?.totalElements ?? 0))

const currentList = computed(() => {
  if (state.activeTab === 'notice') return notices.value
  if (state.activeTab === 'free') return posts.value.filter(p => p.category === 'FREE')
  if (state.activeTab === 'inquiry') return posts.value.filter(p => p.category === 'INQUIRY')
  return [...notices.value, ...posts.value]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
})

const currentTotalPages = computed(() => {
  if (state.activeTab === 'notice') return noticesTotalPages.value
  return postsTotalPages.value
})

const currentTotalElements = computed(() => {
  if (state.activeTab === 'notice') return noticesTotalElements.value
  if (state.activeTab === 'all') return postsTotalElements.value + noticesTotalElements.value
  return postsTotalElements.value
})

const filteredList = computed(() => {
  if (!state.keyword.trim()) return currentList.value
  return currentList.value.filter(item =>
    item.title?.includes(state.keyword) || item.writerName?.includes(state.keyword)
  )
})

const statCards = computed(() => [
  { label: '전체 게시글', value: postsTotalElements.value, unit: '개', desc: '자유 + 문의' },
  { label: '전체 공지', value: noticesTotalElements.value, unit: '개', desc: '단지 공지' },
  { label: '전체 댓글', value: statistics.value?.commentCount ?? 0, unit: '개', desc: '' },
  { label: '삭제된 글', value: 0, unit: '개', desc: '소프트 삭제' },
])

const fetchData = async () => {
  await boardStore.fetchBoardStatistics({})
  if (state.activeTab === 'notice') {
    await noticeStore.fetchAdminNotices({ page: state.page - 1, size: state.size })
  } else {
    const category = state.activeTab === 'free' ? 'FREE'
      : state.activeTab === 'inquiry' ? 'INQUIRY'
      : undefined
    await boardStore.fetchPosts({ page: state.page - 1, size: state.size, category })
    if (state.activeTab === 'all') {
      await noticeStore.fetchAdminNotices({ page: 0, size: 100 })
    }
  }
}

const onTabChange = (tab) => {
  state.activeTab = tab
  state.page = 1
  state.keyword = ''
  fetchData()
}

const onPageChange = (page) => {
  state.page = page
  fetchData()
}

const onReset = () => {
  state.keyword = ''
  state.page = 1
  fetchData()
}

const goToDetail = (item) => {
  if (item.noticeId) {
    router.push(`/admin/notices/${item.noticeId}`)
  } else {
    router.push(`/admin/boards/${item.postId}`)
  }
}

const goNoticeCreate = () => {
  router.push('/admin/notices/create')
}

const goNoticeEdit = (notice) => {
  router.push(`/admin/notices/${notice.noticeId}/edit`)
}

const openDeleteModal = (item) => {
  state.selectedPost = item
  state.showDeleteModal = true
}

const onDeleteConfirm = async () => {
  state.isSubmitting = true
  try {
    if (state.selectedPost.noticeId) {
      await noticeStore.deleteNotice(state.selectedPost.noticeId)
    } else {
      await boardStore.deletePost(state.selectedPost.postId)
    }
    state.showDeleteModal = false
    state.selectedPost = null
    await fetchData()
  } finally {
    state.isSubmitting = false
  }
}

const isNotice = (item) => !!item.noticeId

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="board-stats">
    <!-- 헤더 -->
    <div class="board-stats__header">
      <h1 class="page-title">게시판 관리</h1>
      <button class="btn-primary" @click="goNoticeCreate">+ 공지 작성</button>
    </div>

    <!-- 통계 카드 -->
    <div class="stats-grid">
      <div v-for="(card, idx) in statCards" :key="idx" class="stat-card">
        <p class="stat-card__label">{{ card.label }}</p>
        <p class="stat-card__value">{{ card.value }}<span class="stat-card__unit"> {{ card.unit }}</span></p>
        <p class="stat-card__desc">{{ card.desc }}</p>
      </div>
    </div>

    <!-- 탭 -->
    <div class="tab-row">
      <button
        v-for="tab in [
          { key: 'all', label: '전체' },
          { key: 'notice', label: '공지사항' },
          { key: 'free', label: '자유게시판' },
          { key: 'inquiry', label: '문의' },
        ]"
        :key="tab.key"
        class="tab-btn"
        :class="{ active: state.activeTab === tab.key }"
        @click="onTabChange(tab.key)"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- 필터 -->
    <div class="card-section filter-bar">
      <div class="filter-search">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/>
        </svg>
        <input
          v-model="state.keyword"
          class="search-input"
          type="text"
          placeholder="제목 또는 작성자 검색"
          @keyup.enter="fetchData"
        />
      </div>
      <button class="btn-reset" @click="onReset">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
        </svg>
        초기화
      </button>
    </div>

    <!-- 테이블 -->
    <div class="card-section table-wrap">
      <div v-if="loading" class="loading-wrap">
        <span class="dot" /><span class="dot" /><span class="dot" />
      </div>

      <table v-else class="board-table">
        <colgroup>
          <col style="width: 60px" />
          <col style="width: 80px" />
          <col />
          <col style="width: 120px" />
          <col style="width: 80px" />
          <col style="width: 80px" />
          <col style="width: 120px" />
          <col style="width: 140px" />
        </colgroup>
        <thead>
          <tr>
            <th>번호</th>
            <th>카테고리</th>
            <th>제목</th>
            <th>작성자</th>
            <th>댓글</th>
            <th>조회</th>
            <th>작성일</th>
            <th>관리</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredList.length === 0">
            <td colspan="8" class="empty-cell">게시글이 없습니다.</td>
          </tr>
          <tr
            v-for="(item, idx) in filteredList"
            :key="item.noticeId ?? item.postId"
            class="table-row"
            @click="goToDetail(item)"
          >
            <td class="cell-center">{{ currentTotalElements - ((state.page - 1) * state.size + idx) }}</td>
            <td class="cell-center">
              <span v-if="isNotice(item)" class="badge-notice">공지</span>
              <span v-else-if="item.category === 'FREE'" class="badge-free">자유</span>
              <span v-else class="badge-inquiry">문의</span>
            </td>
            <td class="cell-title">
              <span class="title-text">{{ item.title }}</span>
            </td>
            <td class="cell-center">{{ item.writerName ?? '-' }}</td>
            <td class="cell-center">{{ item.commentCount ?? '-' }}</td>
            <td class="cell-center">{{ item.viewCount ?? '-' }}</td>
            <td class="cell-center">{{ formatDate(item.createdAt) }}</td>
            <td class="cell-center">
              <div class="action-btns">
                <button
                  v-if="isNotice(item)"
                  class="btn-edit"
                  @click.stop="goNoticeEdit(item)"
                >수정</button>
                <button
                  class="btn-delete"
                  @click.stop="openDeleteModal(item)"
                >삭제</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="pagination-wrap">
        <BasePagination
          :current-page="state.page"
          :total-pages="currentTotalPages"
          :total-all="currentTotalElements"
          :total-filtered="filteredList.length"
          unit="건"
          @change="onPageChange"
        />
      </div>
    </div>

    <!-- 삭제 확인 모달 -->
    <ConfirmModal
      :visible="state.showDeleteModal"
      title="게시글을 삭제하시겠습니까?"
      subtitle="삭제된 게시글은 복구할 수 없습니다."
      :item-name="state.selectedPost?.title"
      confirm-text="삭제"
      cancel-text="취소"
      confirm-type="danger"
      :loading="state.isSubmitting"
      @confirm="onDeleteConfirm"
      @cancel="state.showDeleteModal = false"
    />
  </div>
</template>

<style scoped>
.board-stats {
  display: flex;
  flex-direction: column;
  gap: var(--space-20);
}

.board-stats__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.btn-primary {
  height: 36px;
  padding: 0 var(--space-16);
  border: none;
  border-radius: var(--radius-8);
  background: var(--color-primary);
  color: var(--white);
  font-size: var(--font-size-detail);
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}

.btn-primary:hover { opacity: 0.88; }

/* 통계 카드 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-16);
}

.stat-card {
  padding: var(--space-20) var(--space-24);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-12);
  background: var(--color-card-bg);
  box-shadow: var(--shadow-small);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.stat-card__label {
  font-size: var(--font-size-detail);
  color: var(--color-text-secondary);
  margin: 0;
}

.stat-card__value {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
  line-height: 1.2;
}

.stat-card__unit {
  font-size: var(--font-size-detail);
  color: var(--color-text-secondary);
  font-weight: 400;
}

.stat-card__desc {
  font-size: var(--font-size-detail);
  color: var(--color-text-secondary);
  margin: 0;
}

/* 탭 */
.tab-row {
  display: flex;
  gap: var(--space-4);
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 0;
}

.tab-btn {
  height: 36px;
  padding: 0 var(--space-16);
  border: none;
  border-bottom: 2px solid transparent;
  background: none;
  font-size: var(--font-size-body-sm);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.15s;
  margin-bottom: -1px;
}

.tab-btn.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
  font-weight: 700;
}

.tab-btn:hover:not(.active) {
  color: var(--color-text-primary);
}

/* 필터 */
.filter-bar {
  display: flex;
  align-items: center;
  gap: var(--space-8);
  padding: var(--space-16) var(--space-20);
}

.filter-search {
  position: relative;
  flex: 0 0 280px;
}

.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 14px;
  height: 14px;
  stroke: var(--color-border-strong);
}

.search-input {
  width: 100%;
  height: 36px;
  padding: 0 var(--space-12) 0 32px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-8);
  font-size: var(--font-size-detail);
  color: var(--color-text-primary);
  outline: none;
  transition: border-color 0.15s;
  box-sizing: border-box;
}

.search-input:focus { border-color: var(--color-primary); }
.search-input::placeholder { color: var(--color-border-strong); }

.btn-reset {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  height: 36px;
  padding: 0 var(--space-12);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-8);
  background: var(--white);
  font-size: var(--font-size-detail);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: background 0.15s;
}

.btn-reset:hover { background: var(--color-bg-muted); }

/* 테이블 */
.table-wrap {
  padding: 0;
  overflow: hidden;
}

.board-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.board-table th {
  padding: 12px var(--space-16);
  background: var(--color-bg-muted);
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  font-size: var(--font-size-detail);
  font-weight: 600;
  text-align: center;
}

.board-table td {
  padding: 14px var(--space-16);
  border-bottom: 1px solid var(--color-border);
  font-size: var(--font-size-detail);
  color: var(--color-text-primary);
  vertical-align: middle;
}

.board-table tbody tr:last-child td {
  border-bottom: none;
}

.table-row {
  cursor: pointer;
  transition: background 0.15s;
}

.table-row:hover {
  background: var(--color-bg-muted);
}

.cell-center { text-align: center; }

.cell-title {
  text-align: left;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.title-text { font-weight: 500; }

.badge-notice {
  display: inline-block;
  padding: 2px var(--space-8);
  border-radius: var(--radius-4);
  background: var(--color-primary);
  color: var(--white);
  font-size: var(--font-size-badge);
  font-weight: 700;
}

.badge-free {
  display: inline-block;
  padding: 2px var(--space-8);
  border-radius: var(--radius-4);
  background: var(--color-bg-muted);
  color: var(--color-text-secondary);
  font-size: var(--font-size-badge);
  font-weight: 700;
}

.badge-inquiry {
  display: inline-block;
  padding: 2px var(--space-8);
  border-radius: var(--radius-4);
  background: rgba(192, 139, 45, 0.14);
  color: var(--color-warning);
  font-size: var(--font-size-badge);
  font-weight: 700;
}

.empty-cell {
  padding: var(--space-48) 0 !important;
  color: var(--color-text-secondary);
  text-align: center;
}

.action-btns {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-8);
  white-space: nowrap;
}

.btn-edit {
  height: 28px;
  padding: 0 var(--space-12);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-4);
  background: var(--white);
  font-size: var(--font-size-detail);
  color: var(--color-text-primary);
  cursor: pointer;
  transition: background 0.12s;
  white-space: nowrap;
}

.btn-edit:hover { background: var(--color-bg-muted); }

.btn-delete {
  height: 28px;
  padding: 0 var(--space-12);
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-4);
  background: var(--white);
  font-size: var(--font-size-detail);
  color: var(--color-danger);
  cursor: pointer;
  transition: background 0.12s;
  white-space: nowrap;
}

.btn-delete:hover { background: rgba(229, 62, 62, 0.06); }

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

/* 페이지네이션 */
.pagination-wrap {
  padding: var(--space-16) var(--space-20);
  border-top: 1px solid var(--color-border);
}

:deep(.base-pagination) {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
}

:deep(.base-pagination__nav) {
  justify-content: center;
}

:deep(.base-pagination__summary) {
  text-align: left;
}
</style>
