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
    await boardStore.fetchAdminPosts({ page: state.page - 1, size: state.size, category })  // ← 변경
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

    <!-- 테이블 카드 -->
    <section class="card-shell">
      <!-- 필터바 -->
      <AdminFilterBar @reset="onReset">
        <div class="search-wrap">
          <input
            v-model="state.keyword"
            class="search-input"
            type="text"
            placeholder="제목 또는 작성자 검색"
            @keyup.enter="fetchData"
          />
        </div>
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
        <!-- 카테고리 -->
        <template #cell-category="{ row }">
          <BaseBadge v-if="isNotice(row)" variant="info">공지</BaseBadge>
          <BaseBadge v-else-if="row.category === 'FREE'" variant="neutral">자유</BaseBadge>
          <BaseBadge v-else variant="warning">문의</BaseBadge>
        </template>

        <!-- 제목 -->
        <template #cell-title="{ row }">
          <span class="title-text">{{ row.title }}</span>
        </template>

        <!-- 작성자 -->
        <template #cell-writerName="{ row }">
          {{ row.writerName ?? '-' }}
        </template>

        <!-- 댓글 -->
        <template #cell-commentCount="{ row }">
          {{ isNotice(row) ? '-' : (row.commentCount ?? 0) }}
        </template>

        <!-- 조회 -->
        <template #cell-viewCount="{ row }">
          {{ isNotice(row) ? '-' : (row.viewCount ?? 0) }}
        </template>

        <!-- 작성일 -->
        <template #cell-createdAt="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>

        <!-- 삭제 여부 -->
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
.tab-row {
  display: flex;
  gap: var(--space-4);
  border-bottom: 1px solid var(--color-border);
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
</style>
