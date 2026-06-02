<script setup>
import { reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useVoteStore } from '@/stores/useVoteStore'

const router = useRouter()
const route = useRoute()
const voteStore = useVoteStore()

const state = reactive({
  activeTab: 'OPEN', // OPEN | CLOSED
  page: 0,
  size: 20,
})

const votes = computed(() => voteStore.votes?.content ?? [])
const totalPages = computed(() => voteStore.votes?.totalPages ?? 0)
const loading = computed(() => voteStore.loading)

const fetchVotes = async () => {
  await voteStore.fetchVotes({
    status: state.activeTab,
    page: state.page,
    size: state.size,
  })
}

const onTabChange = (tab) => {
  state.activeTab = tab
  state.page = 0
  fetchVotes()
}

const onPageChange = (p) => {
  state.page = p
  fetchVotes()
}

const goToDetail = (voteId) => {
  router.push(`/resident/${route.params.complexId}/vote/${voteId}`)
}

const formatPeriod = (startAt, endAt) => {
  const fmt = (d) => {
    if (!d) return ''
    const dt = new Date(d)
    return `${dt.getFullYear()}.${String(dt.getMonth() + 1).padStart(2, '0')}.${String(dt.getDate()).padStart(2, '0')}`
  }
  return `${fmt(startAt)} ~ ${fmt(endAt)}`
}

const statusLabel = (status) => {
  if (status === 'OPEN') return '투표중'
  if (status === 'CLOSED') return '결과 발표'
  return '시작 전'
}

const statusVariantClass = (status) => {
  if (status === 'OPEN') return 'badge--open'
  if (status === 'CLOSED') return 'badge--closed'
  return 'badge--ready'
}

const participationRate = (vote) => {
  if (!vote.householdCount || vote.householdCount === 0) return null
  return vote.householdCount
}

onMounted(() => {
  fetchVotes()
})
</script>

<template>
  <div class="vote-home">
    <!-- 헤더 -->
    <div class="vote-home__header">
      <h2 class="vote-home__title">모바일 투표</h2>
      <p class="vote-home__desc">단지 현안에 대한 투표에 참여하세요.</p>
    </div>

    <!-- 탭 -->
    <div class="tab-row">
      <button
        class="tab-pill"
        :class="{ active: state.activeTab === 'OPEN' }"
        @click="onTabChange('OPEN')"
      >
        투표중
      </button>
      <button
        class="tab-pill"
        :class="{ active: state.activeTab === 'CLOSED' }"
        @click="onTabChange('CLOSED')"
      >
        결과 발표
      </button>
    </div>

    <!-- 로딩 -->
    <div v-if="loading" class="loading-wrap">
      <span class="dot" /><span class="dot" /><span class="dot" />
    </div>

    <template v-else>
      <!-- 투표 목록 -->
      <ul class="vote-list">
        <li
          v-for="vote in votes"
          :key="vote.voteId"
          class="vote-card card-section"
          @click="goToDetail(vote.voteId)"
        >
          <div class="vote-card__top">
            <span class="vote-badge" :class="statusVariantClass(vote.status)">
              {{ statusLabel(vote.status) }}
            </span>
            <span v-if="vote.isParticipated" class="voted-badge">참여완료</span>
          </div>

          <p class="vote-card__title">{{ vote.title }}</p>

          <div class="vote-card__meta">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="9"/>
              <polyline points="12 7 12 12 16 14"/>
            </svg>
            <span>{{ formatPeriod(vote.startAt, vote.endAt) }}</span>
          </div>

          <!-- 종료된 투표: 간단한 결과 바 표시 -->
          <div v-if="vote.status === 'CLOSED' && (vote.agreeCount + vote.disagreeCount) > 0" class="result-bar-wrap">
            <div class="result-bar">
              <div
                class="result-bar__agree"
                :style="{
                  width: `${Math.round((vote.agreeCount / (vote.agreeCount + vote.disagreeCount)) * 100)}%`
                }"
              />
            </div>
            <div class="result-labels">
              <span class="label-agree">찬성 {{ vote.agreeCount }}</span>
              <span class="label-disagree">반대 {{ vote.disagreeCount }}</span>
            </div>
          </div>

          <!-- 투표중: 참여 세대 수 -->
          <div v-else-if="vote.status === 'OPEN'" class="participation-info">
            <span>{{ vote.householdCount ?? 0 }}세대 참여</span>
          </div>

          <div class="vote-card__arrow">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </div>
        </li>

        <li v-if="votes.length === 0" class="vote-empty">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#CBD5E0" stroke-width="1.5">
            <circle cx="12" cy="12" r="9"/>
            <path d="m9 12 2 2 4-4"/>
          </svg>
          <p>{{ state.activeTab === 'OPEN' ? '진행 중인 투표가 없습니다.' : '종료된 투표가 없습니다.' }}</p>
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
.vote-home {
  display: flex;
  flex-direction: column;
  gap: var(--space-16);
}

.vote-home__header {
  padding: 0 var(--space-4);
}

.vote-home__title {
  font-size: var(--font-size-heading-3);
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 var(--space-4);
}

.vote-home__desc {
  font-size: var(--font-size-body-sm);
  color: var(--color-text-secondary);
  margin: 0;
}

/* 탭 */
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
}

.tab-pill.active {
  color: var(--color-primary);
  border-color: var(--color-primary);
  font-weight: 600;
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

/* 투표 목록 */
.vote-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  padding: 0;
}

.vote-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
  padding: var(--space-16) !important;
  cursor: pointer;
  transition: background 0.12s;
  position: relative;
}

.vote-card:hover {
  background: var(--color-bg-muted);
}

.vote-card__top {
  display: flex;
  align-items: center;
  gap: var(--space-8);
}

/* 상태 배지 */
.vote-badge {
  display: inline-block;
  padding: 2px var(--space-8);
  border-radius: var(--radius-4);
  font-size: var(--font-size-badge);
  font-weight: 700;
}

.badge--open {
  background: rgba(73, 115, 229, 0.12);
  color: #4973e5;
}

.badge--closed {
  background: rgba(80, 200, 120, 0.14);
  color: #2f855a;
}

.badge--ready {
  background: rgba(148, 163, 184, 0.14);
  color: #64748b;
}

.voted-badge {
  display: inline-block;
  padding: 2px var(--space-8);
  border-radius: var(--radius-4);
  font-size: var(--font-size-badge);
  font-weight: 700;
  background: rgba(80, 200, 120, 0.14);
  color: #2f855a;
}

.vote-card__title {
  font-size: var(--font-size-body);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
  line-height: 1.5;
  padding-right: var(--space-20);
}

.vote-card__meta {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  font-size: var(--font-size-detail);
  color: var(--color-text-secondary);
}

/* 결과 바 */
.result-bar-wrap {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.result-bar {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #fed7d7;
  overflow: hidden;
}

.result-bar__agree {
  height: 100%;
  border-radius: 3px;
  background: #4973e5;
  transition: width 0.4s ease;
}

.result-labels {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-detail);
}

.label-agree { color: #4973e5; font-weight: 600; }
.label-disagree { color: #e53e3e; font-weight: 600; }

.participation-info {
  font-size: var(--font-size-detail);
  color: var(--color-text-secondary);
}

.vote-card__arrow {
  position: absolute;
  right: var(--space-16);
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-secondary);
}

/* 빈 상태 */
.vote-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-12);
  padding: var(--space-48) var(--space-16);
  color: var(--color-text-secondary);
  font-size: var(--font-size-body-sm);
  text-align: center;
}

.vote-empty p { margin: 0; }

/* 페이지네이션 */
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
