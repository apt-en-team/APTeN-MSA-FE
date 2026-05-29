<script setup>
import { reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBoardStore } from '@/stores/useBoardStore'
import { useNoticeStore } from '@/stores/useNoticeStore'
import AdminTable from '@/components/admin/AdminTable.vue'
import AdminFilterBar from '@/components/admin/AdminFilterBar.vue'
import AppPagination from '@/components/common/AppPagination.vue'
import StatsCards from '@/components/admin/StatsCards.vue'
import BaseBadge from '@/components/common/BaseBadge.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'

const router = useRouter()
const boardStore = useBoardStore()
const noticeStore = useNoticeStore()

const state = reactive({
  activeTab: 'all',
  keyword: '',
  filterCategory: '',
  filterDeleted: '',
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

const tabCounts = computed(() => ({
  all: postsTotalElements.value + noticesTotalElements.value,
  notice: noticesTotalElements.value,
  free: posts.value.filter(p => p.category === 'FREE').length,
  inquiry: posts.value.filter(p => p.category === 'INQUIRY').length,
}))

const filteredList = computed(() => {
  let list = currentList.value
  if (state.keyword.trim()) {
    list = list.filter(item =>
      item.title?.includes(state.keyword) || item.writerName?.includes(state.keyword)
    )
  }
  if (state.filterCategory) {
    list = list.filter(item => {
      if (state.filterCategory === 'NOTICE') return isNotice(item)
      return item.category === state.filterCategory
    })
  }
  if (state.filterDeleted !== '') {
    const deleted = state.filterDeleted === 'true'
    list = list.filter(item => !!item.isDeleted === deleted)
  }
  return list
})

const summaryItems = computed(() => [
  { label: '전체 게시글', value: postsTotalElements.value, unit: '개', desc: '자유 + 문의' },
  { label: '전체 공지', value: noticesTotalElements.value, unit: '개', desc: '단지 공지' },
  { label: '전체 댓글', value: statistics.value?.commentCount ?? 0, unit: '개', desc: '' },
  { label: '삭제된 글', value: statistics.value?.deletedPostCount ?? 0, unit: '개', desc: '소프트 삭제' },
])

const columns = [
  { key: 'no', label: '번호' },
  { key: 'category', label: '카테고리' },
  { key: 'title', label: '제목' },
  { key: 'writerName', label: '작성자' },
  { key: 'commentCount', label: '댓글' },
  { key: 'viewCount', label: '조회' },
  { key: 'createdAt', label: '작성일' },
  { key: 'isDeleted', label: '삭제 여부' },
]

const fetchData = async () => {
  await boardStore.fetchBoardStatistics({})
  if (state.activeTab === 'notice') {
    await noticeStore.fetchAdminNotices({ page: state.page - 1, size: state.size })
  } else {
    const category = state.activeTab === 'free' ? 'FREE'
      : state.activeTab === 'inquiry' ? 'INQUIRY'
      : undefined
    await boardStore.fetchAdminPosts({ page: state.page - 1, size: state.size, category })
    if (state.activeTab === 'all') {
      await noticeStore.fetchAdminNotices({ page: 0, size: 100 })
    }
  }
}

const onTabChange = (tab) => {
  state.activeTab = tab
  state.page = 1
  state.keyword = ''
  state.filterCategory = ''
  state.filterDeleted = ''
  fetchData()
}

const onPageChange = (page) => {
  state.page = page
  fetchData()
}

const onReset = () => {
  state.keyword = ''
  state.filterCategory = ''
  state.filterDeleted = ''
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

const isNotice = (item) => !!item.noticeId

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

const allRows = computed(() =>
  filteredList.value.map((item, i) => ({
    ...item,
    no: currentTotalElements.value - ((state.page - 1) * state.size + i),
  }))
)

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="board-stats">
    <!-- 통계 카드 -->
    <StatsCards :stats="summaryItems" />

    <!-- 탭 -->
    <nav class="tab-bar">
      <button
        v-for="tab in [
          { key: 'all', label: '전체' },
          { key: 'notice', label: '공지사항' },
          { key: 'free', label: '자유게시판' },
          { key: 'inquiry', label: '문의' },
        ]"
        :key="tab.key"
        type="button"
        class="tab-btn"
        :class="{ active: state.activeTab === tab.key }"
        @click="onTabChange(tab.key)"
      >
        {{ tab.label }}
        <span class="tab-badge">{{ tabCounts[tab.key] }}</span>
      </button>
    </nav>

    <!-- 테이블 카드 -->
    <section class="card-shell">
      <!-- 필터바 -->
      <AdminFilterBar @reset="onReset">
        <div class="search-wrap">
          <input
            v-model="state.keyword"
            class="search-input"
            type="text"
            placeholder="제목, 작성자 검색"
            @keyup.enter="fetchData"
          />
        </div>
        <select v-model="state.filterCategory" class="filter-select">
          <option value="">카테고리</option>
          <option value="NOTICE">공지</option>
          <option value="FREE">자유</option>
          <option value="INQUIRY">문의</option>
        </select>
        <select v-model="state.filterDeleted" class="filter-select">
          <option value="">삭제 여부</option>
          <option value="false">정상</option>
          <option value="true">삭제</option>
        </select>
      </AdminFilterBar>

      <!-- 로딩 -->
      <div v-if="loading" class="loading-wrap">
        <span>불러오는 중...</span>
      </div>

      <!-- 테이블 -->
      <AdminTable
        v-else
        :columns="columns"
        :rows="allRows"
        @row-click="goToDetail"
      >
        <template #cell-category="{ row }">
          <BaseBadge v-if="isNotice(row)" variant="info">공지</BaseBadge>
          <BaseBadge v-else-if="row.category === 'FREE'" variant="neutral">자유</BaseBadge>
          <BaseBadge v-else variant="warning">문의</BaseBadge>
        </template>

        <<!-- 제목 -->
        <template #cell-title="{ row }">
          <span class="title-wrap">
            <span class="title-text">{{ row.title }}</span>
            <span v-if="row.thumbSavedName" class="title-icon title-icon--image">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </span>
            <span v-if="row.hasFile" class="title-icon title-icon--file">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
              </svg>
            </span>
          </span>
        </template>

        <template #cell-writerName="{ row }">
          {{ row.writerName ?? '-' }}
        </template>

        <template #cell-commentCount="{ row }">
          {{ isNotice(row) ? '-' : (row.commentCount ?? 0) }}
        </template>

        <template #cell-viewCount="{ row }">
          {{ isNotice(row) ? '-' : (row.viewCount ?? 0) }}
        </template>

        <template #cell-createdAt="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>

        <template #cell-isDeleted="{ row }">
          <BaseBadge v-if="row.isDeleted" variant="danger">삭제</BaseBadge>
          <BaseBadge v-else variant="success">정상</BaseBadge>
        </template>
      </AdminTable>

      <!-- 페이지네이션 -->
      <AppPagination
        :current-page="state.page"
        :max-page="currentTotalPages"
        :total-all="currentTotalElements"
        :total-filtered="filteredList.length"
        unit="건"
        @change="onPageChange"
      />
    </section>

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
      @confirm="() => {}"
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

/* 탭 */
.tab-bar {
  display: flex;
  gap: 8px;
  padding: 6px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #ffffff;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 38px;
  padding: 0 18px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: #687282;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.tab-btn:hover {
  background: #f5f6f8;
  color: #2b3a55;
}

.tab-btn.active {
  background: #1e2a3e;
  color: #ffffff;
}

.tab-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 18px;
  padding: 0 5px;
  border-radius: 20px;
  background: #e2e8f0;
  color: #687282;
  font-size: 11px;
  font-weight: 700;
}

.tab-btn.active .tab-badge {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
}

/* 카드 */
.card-shell {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
  overflow: hidden;
}

/* 검색 */
.search-wrap {
  position: relative;
}

.search-input {
  padding: 7px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  font-size: 13px;
  color: #1a202c;
  background: #ffffff;
  width: 220px;
  outline: none;
}

.search-input:focus {
  border-color: #a0aec0;
}

/* 필터 드롭다운 */
.filter-select {
  height: 34px;
  padding: 0 10px;
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  font-size: 13px;
  color: #1a202c;
  background: #ffffff;
  outline: none;
  cursor: pointer;
}

.filter-select:focus {
  border-color: #a0aec0;
}

/* 로딩 */
.loading-wrap {
  padding: 40px;
  text-align: center;
  color: #7b8ea8;
  font-size: 13px;
}

/* 제목 */
.title-text {
  font-weight: 500;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  display: block;
  max-width: 300px;
  text-align: left;
}

.title-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
}

.title-icon {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
}

.title-icon--image {
  color: var(--color-primary);
}

.title-icon--file {
  color: #e67e22;
}
</style>
