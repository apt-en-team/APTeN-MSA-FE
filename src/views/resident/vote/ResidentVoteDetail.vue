<script setup>
import { reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useVoteStore } from '@/stores/useVoteStore'
import ResidentModal from '@/components/resident/ResidentModal.vue'

const router = useRouter()
const route = useRoute()
const voteStore = useVoteStore()

const voteId = computed(() => route.params.voteId)

const state = reactive({
  loading: false,
  showVoteModal: false,
  showResultModal: false,
  selectedChoice: null,
  isSubmitting: false,
  resultType: 'success',
  resultTitle: '',
  resultSubtitle: '',
})

const vote = computed(() => voteStore.voteDetail)

// VoteStatus enum이 value로 직렬화되므로 한글 값으로 비교한다.
const isOpen = computed(() => {
  const s = vote.value?.status
  return s === '진행 중' || s === 'OPEN'
})

const isClosed = computed(() => {
  const s = vote.value?.status
  return s === '종료' || s === 'CLOSED'
})

// READY이면서 startAt이 지났으면 입주민에게 투표 가능하게 표시
const isActive = computed(() => {
  const s = vote.value?.status
  if (isOpen.value) return true
  if (s === '시작 전' || s === 'READY') {
    return vote.value?.startAt && new Date(vote.value.startAt) <= new Date()
  }
  return false
})

const isParticipated = computed(() => !!vote.value?.participated)
const canVote = computed(() => isActive.value && !isParticipated.value)

// 도넛 차트
const totalVotes = computed(() => (vote.value?.agreeCount ?? 0) + (vote.value?.disagreeCount ?? 0))
const agreePercent = computed(() => {
  if (!totalVotes.value) return 0
  return Math.round(((vote.value?.agreeCount ?? 0) / totalVotes.value) * 100)
})
const disagreePercent = computed(() => totalVotes.value ? 100 - agreePercent.value : 0)

// 우세한 쪽 계산
const isDominantAgree = computed(() => agreePercent.value > disagreePercent.value)
const isTie = computed(() => totalVotes.value > 0 && agreePercent.value === disagreePercent.value)
const dominantPercent = computed(() => {
  if (!totalVotes.value) return 0
  return isDominantAgree.value ? agreePercent.value : disagreePercent.value
})

const circumference = 2 * Math.PI * 40
const donutDasharray = computed(() => {
  const dominantLen = (dominantPercent.value / 100) * circumference
  return `${dominantLen} ${circumference - dominantLen}`
})

// 도넛 색상
const donutFrontColor = computed(() => {
  if (!totalVotes.value) return '#e2e8f0'
  return isDominantAgree.value || isTie.value ? '#4973E5' : '#E53E3E'
})
const donutBgColor = computed(() => {
  if (!totalVotes.value) return '#e2e8f0'
  return isDominantAgree.value ? '#FED7D7' : '#BEE3F8'
})
const donutCenterText = computed(() => {
  if (!totalVotes.value) return '-'
  if (isTie.value) return '50%'
  return `${dominantPercent.value}%`
})
const donutCenterLabel = computed(() => {
  if (!totalVotes.value) return '데이터 없음'
  if (isTie.value) return '동률'
  return isDominantAgree.value ? '찬성' : '반대'
})

const choiceLabel = (choice) => choice === 'AGREE' ? '찬성' : '반대'

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

const formatDateTime = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const onSelectChoice = (choice) => {
  if (!canVote.value) return
  state.selectedChoice = choice
  state.showVoteModal = true
}

const onConfirmVote = async () => {
  if (!state.selectedChoice || state.isSubmitting) return
  state.isSubmitting = true
  try {
    await voteStore.submitVote(voteId.value, { choice: state.selectedChoice })
    state.showVoteModal = false
    state.resultType = 'success'
    state.resultTitle = `'${choiceLabel(state.selectedChoice)}'으로 투표 완료!`
    state.resultSubtitle = '소중한 의견 감사합니다.\n투표는 세대당 1회만 가능합니다.'
    state.showResultModal = true
    await voteStore.fetchVoteDetail(voteId.value)
  } catch (e) {
    state.showVoteModal = false
    const code = e?.response?.data?.code
    if (code === 'BRD_403_03') {
      state.resultType = 'warning'
      state.resultTitle = '세대주만 투표할 수 있습니다.'
      state.resultSubtitle = '투표는 세대 대표(세대주)만 참여 가능합니다.'
    } else if (code === 'BRD_409_01') {
      state.resultType = 'warning'
      state.resultTitle = '이미 투표에 참여하셨습니다.'
      state.resultSubtitle = '세대당 1회만 참여 가능합니다.'
    } else if (code === 'BRD_400_02') {
      state.resultType = 'warning'
      state.resultTitle = '투표 기간이 아닙니다.'
      state.resultSubtitle = '투표 기간을 확인해주세요.'
    } else {
      state.resultType = 'danger'
      state.resultTitle = '투표에 실패했습니다.'
      state.resultSubtitle = '잠시 후 다시 시도해주세요.'
    }
    state.showResultModal = true
  } finally {
    state.isSubmitting = false
  }
}

const goBack = () => {
  const tab = route.query.tab ?? 'OPEN'
  router.push(`/resident/${route.params.complexId}/vote?tab=${tab}`)
}

onMounted(async () => {
  state.loading = true
  try {
    await voteStore.fetchVoteDetail(voteId.value)
  } finally {
    state.loading = false
  }
})
</script>

<template>
  <div class="vote-detail">
    <!-- 뒤로가기 -->
    <button class="back-btn" @click="goBack">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M12 4L6 10L12 16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      목록으로
    </button>

    <!-- 로딩 -->
    <div v-if="state.loading" class="loading-wrap">
      <span class="dot" /><span class="dot" /><span class="dot" />
    </div>

    <template v-else-if="vote">
      <!-- 작성자 정보 -->
      <div class="author-row">
        <div class="author-avatar">관</div>
        <div class="author-info">
          <div class="author-name-row">
            <span class="author-name">관리사무소</span>
            <span class="badge-admin">관리자</span>
          </div>
          <span class="author-meta">{{ formatDateTime(vote.startAt) }}</span>
        </div>
      </div>

      <!-- 상태 뱃지 -->
      <div class="status-row">
        <span class="status-badge" :class="{
          'badge--open': isOpen,
          'badge--closed': isClosed,
          'badge--ready': !isOpen && !isClosed,
        }">
          {{ isOpen ? '투표중' : isClosed ? '결과 발표' : '시작 전' }}
        </span>
        <span v-if="isParticipated" class="voted-chip">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M5 13l4 4L19 7"/>
          </svg>
          참여완료
        </span>
      </div>

      <!-- 투표 본문 -->
      <div class="vote-content">
        <h2 class="vote-title">{{ vote.title }}</h2>

        <!-- 메타 정보 -->
        <div class="vote-meta-grid">
          <div class="meta-row">
            <span class="meta-label">기간</span>
            <span class="meta-value">{{ formatDate(vote.startAt) }} ~ {{ formatDate(vote.endAt) }}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">대상</span>
            <span class="meta-value">아파트 전체 · 세대주</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">투표 방법</span>
            <span class="meta-value">모바일 또는 현장 투표소 방문</span>
          </div>
        </div>

        <!-- 본문 -->
        <div v-if="vote.description" class="vote-body" v-html="vote.description" />
      </div>

      <!-- 결과 차트 (종료 후) -->
      <div v-if="isClosed && totalVotes > 0" class="result-section">
        <svg class="donut-svg" viewBox="0 0 100 100">
          <!-- 동률: 파랑 반 + 빨강 반 -->
          <template v-if="isTie">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#E53E3E" stroke-width="14"
              :stroke-dasharray="`${circumference / 2} ${circumference / 2}`"
              stroke-linecap="butt"
              transform="rotate(-90 50 50)"
            />
            <circle cx="50" cy="50" r="40" fill="none" stroke="#4973E5" stroke-width="14"
              :stroke-dasharray="`${circumference / 2} ${circumference / 2}`"
              stroke-linecap="butt"
              transform="rotate(90 50 50)"
            />
          </template>
          <!-- 일반: 우세 색 앞링 + 배경링 -->
          <template v-else>
            <circle cx="50" cy="50" r="40" fill="none" :stroke="donutBgColor" stroke-width="14"/>
            <circle cx="50" cy="50" r="40" fill="none"
              :stroke="donutFrontColor" stroke-width="14"
              :stroke-dasharray="donutDasharray"
              stroke-linecap="round"
              transform="rotate(-90 50 50)"
            />
          </template>
          <text x="50" y="50" text-anchor="middle" font-size="14" font-weight="700" fill="#1A202C">
            {{ donutCenterText }}
          </text>
          <text x="50" y="64" text-anchor="middle" font-size="8" fill="#718096">{{ donutCenterLabel }}</text>
        </svg>
        <div class="result-legend">
          <span class="legend-agree">찬성 {{ agreePercent }}%</span>
          <span class="legend-disagree">반대 {{ disagreePercent }}%</span>
        </div>
        <div class="result-counts">
          <div class="count-item">
            <span class="count-label">찬성</span>
            <span class="count-value agree">{{ vote.agreeCount ?? 0 }}</span>
          </div>
          <div class="count-divider" />
          <div class="count-item">
            <span class="count-label">반대</span>
            <span class="count-value disagree">{{ vote.disagreeCount ?? 0 }}</span>
          </div>
          <div class="count-divider" />
          <div class="count-item">
            <span class="count-label">참여 세대</span>
            <span class="count-value">{{ vote.householdCount ?? 0 }}</span>
          </div>
        </div>
      </div>

      <!-- 투표 버튼 영역 — 투표 가능하거나 참여 완료 시 항상 표시 -->
      <div v-if="isActive || isParticipated" class="vote-buttons">
        <p class="vote-guide">
          {{ isParticipated ? '이미 투표에 참여하셨습니다.' : '어떻게 생각하시나요?' }}
        </p>
        <div class="vote-btn-row">
          <!-- 찬성 버튼 -->
          <button
            class="vote-btn vote-btn--agree"
            :class="{
              'is-selected': isParticipated && (vote.myChoice === 'AGREE' || vote.myChoice === '찬성'),
              'is-disabled': isParticipated && vote.myChoice !== 'AGREE' && vote.myChoice !== '찬성',
            }"
            :disabled="isParticipated"
            @click="onSelectChoice('AGREE')"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M5 13l4 4L19 7"/>
            </svg>
            찬성
            <span v-if="isParticipated && (vote.myChoice === 'AGREE' || vote.myChoice === '찬성')" class="my-pick-label">내 선택</span>
          </button>

          <!-- 반대 버튼 -->
          <button
            class="vote-btn vote-btn--disagree"
            :class="{
              'is-selected': isParticipated && (vote.myChoice === 'DISAGREE' || vote.myChoice === '반대'),
              'is-disabled': isParticipated && vote.myChoice !== 'DISAGREE' && vote.myChoice !== '반대',
            }"
            :disabled="isParticipated"
            @click="onSelectChoice('DISAGREE')"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
            반대
            <span v-if="isParticipated && (vote.myChoice === 'DISAGREE' || vote.myChoice === '반대')" class="my-pick-label">내 선택</span>
          </button>
        </div>
      </div>

      <!-- 종료 후 -->
      <div v-else-if="isClosed" class="vote-closed-notice">
        투표가 종료되었습니다.
      </div>
    </template>

    <!-- 투표 확인 모달 -->
    <ResidentModal
      :visible="state.showVoteModal"
      :type="state.selectedChoice === 'AGREE' ? 'info' : 'danger'"
      :title="`'${choiceLabel(state.selectedChoice)}'에 투표하시겠습니까?`"
      subtitle="세대당 1회만 참여 가능하며&#10;투표 후 변경이 불가합니다."
      :confirm-text="state.isSubmitting ? '처리 중...' : '투표하기'"
      cancel-text="취소"
      :show-cancel="true"
      @confirm="onConfirmVote"
      @close="state.showVoteModal = false"
    />

    <!-- 결과 모달 -->
    <ResidentModal
      :visible="state.showResultModal"
      :type="state.resultType"
      :title="state.resultTitle"
      :subtitle="state.resultSubtitle"
      confirm-text="확인"
      :show-cancel="false"
      @confirm="state.showResultModal = false"
      @close="state.showResultModal = false"
    />
  </div>
</template>

<style scoped>
.vote-detail {
  display: flex;
  flex-direction: column;
  gap: var(--space-16);
  background-color: var(--white);
  min-height: 100vh;
  margin: calc(-1 * var(--space-20)) calc(-1 * var(--space-16));
  padding: var(--space-20);
  padding-bottom: var(--space-48);
}

.back-btn {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  font-size: var(--font-size-body-sm);
  color: var(--color-text-secondary);
  background: none;
  cursor: pointer;
  padding: 0;
}
.back-btn:hover { color: var(--color-primary); }

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

/* 작성자 */
.author-row {
  display: flex;
  align-items: center;
  gap: var(--space-12);
  padding-bottom: var(--space-12);
  border-bottom: 1px solid var(--color-border);
}
.author-avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background: var(--admin-main-navy);
  color: var(--white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-body);
  font-weight: 700;
  flex-shrink: 0;
}
.author-info { display: flex; flex-direction: column; gap: 2px; }
.author-name-row { display: flex; align-items: center; gap: var(--space-8); }
.author-name { font-size: var(--font-size-body-sm); font-weight: 700; color: var(--color-text-primary); }
.badge-admin {
  display: inline-block;
  padding: 1px var(--space-8);
  border-radius: 99px;
  background: var(--admin-main-navy);
  color: var(--white);
  font-size: var(--font-size-badge);
  font-weight: 700;
}
.author-meta { font-size: var(--font-size-detail); color: var(--color-text-secondary); }

/* 상태 */
.status-row { display: flex; align-items: center; gap: var(--space-8); }
.status-badge {
  display: inline-block;
  padding: 3px var(--space-12);
  border-radius: var(--radius-4);
  font-size: var(--font-size-badge);
  font-weight: 700;
}
.badge--open { background: rgba(73, 115, 229, 0.12); color: #4973e5; }
.badge--closed { background: rgba(80, 200, 120, 0.14); color: #2f855a; }
.badge--ready { background: rgba(148, 163, 184, 0.14); color: #64748b; }

.voted-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px var(--space-8);
  border-radius: var(--radius-4);
  font-size: var(--font-size-badge);
  font-weight: 700;
  background: rgba(80, 200, 120, 0.14);
  color: #2f855a;
}

/* 본문 */
.vote-content { display: flex; flex-direction: column; gap: var(--space-12); }
.vote-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
  line-height: 1.4;
}

.vote-meta-grid {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-8);
  overflow: hidden;
}
.meta-row {
  display: flex;
  gap: var(--space-12);
  padding: var(--space-8) var(--space-12);
  border-bottom: 1px solid var(--color-border);
  font-size: var(--font-size-detail);
}
.meta-row:last-child { border-bottom: none; }
.meta-label { color: var(--color-text-secondary); width: 60px; flex-shrink: 0; }
.meta-value { color: var(--color-text-primary); font-weight: 500; }

/* tiptap 본문 */
.vote-body {
  font-size: var(--font-size-body-sm);
  color: var(--color-text-primary);
  line-height: 1.8;
}
:deep(.vote-body p) { margin-bottom: var(--space-8); }
:deep(.vote-body strong) { font-weight: 700; }
:deep(.vote-body em) { font-style: italic; }
:deep(.vote-body u) { text-decoration: underline; }
:deep(.vote-body s) { text-decoration: line-through; }
:deep(.vote-body h1) { font-size: var(--font-size-heading-2); font-weight: 700; margin-bottom: var(--space-8); }
:deep(.vote-body h2) { font-size: var(--font-size-heading-3); font-weight: 700; margin-bottom: var(--space-8); }
:deep(.vote-body h3) { font-size: var(--font-size-body); font-weight: 700; margin-bottom: var(--space-8); }
:deep(.vote-body ul) { padding-left: var(--space-20); list-style: disc; }
:deep(.vote-body ol) { padding-left: var(--space-20); list-style: decimal; }
:deep(.vote-body blockquote) {
  border-left: 3px solid var(--color-primary);
  padding-left: var(--space-12);
  color: var(--color-text-secondary);
  margin: var(--space-8) 0;
  font-style: italic;
}
:deep(.vote-body hr) { border: none; border-top: 1px solid var(--color-border); margin: var(--space-16) 0; }
:deep(.vote-body p[style*="text-align: center"]) { text-align: center; }
:deep(.vote-body p[style*="text-align: right"]) { text-align: right; }

/* 결과 차트 */
.result-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-12);
  padding: var(--space-20);
  border: 1px solid var(--color-border);
  border-radius: 16px;
}
.donut-svg { width: 140px; height: 140px; }
.result-legend { display: flex; gap: var(--space-24); font-size: var(--font-size-body-sm); font-weight: 700; }
.legend-agree { color: #4973e5; }
.legend-disagree { color: #e53e3e; }
.result-counts {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-20);
  width: 100%;
  padding-top: var(--space-12);
  border-top: 1px solid var(--color-border);
}
.count-item { display: flex; flex-direction: column; align-items: center; gap: var(--space-4); }
.count-label { font-size: var(--font-size-detail); color: var(--color-text-secondary); }
.count-value { font-size: 20px; font-weight: 700; color: var(--color-text-primary); }
.count-value.agree { color: #4973e5; }
.count-value.disagree { color: #e53e3e; }
.count-divider { width: 1px; height: 32px; background: var(--color-border); }

/* 투표 버튼 */
.vote-buttons { display: flex; flex-direction: column; gap: var(--space-12); margin-top: var(--space-8); }
.vote-guide {
  font-size: var(--font-size-body-sm);
  color: var(--color-text-secondary);
  text-align: center;
  margin: 0;
}
.vote-btn-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-12); }

.vote-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  height: 88px;
  border-radius: 16px;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
  border: 2px solid transparent;
  position: relative;
}

/* 찬성 기본 */
.vote-btn--agree {
  background: rgba(73, 115, 229, 0.08);
  color: #4973e5;
  border-color: rgba(73, 115, 229, 0.2);
}
.vote-btn--agree:not(:disabled):hover {
  background: #4973e5;
  color: var(--white);
  border-color: #4973e5;
  transform: scale(1.02);
}

/* 반대 기본 */
.vote-btn--disagree {
  background: rgba(229, 62, 62, 0.06);
  color: #e53e3e;
  border-color: rgba(229, 62, 62, 0.2);
}
.vote-btn--disagree:not(:disabled):hover {
  background: #e53e3e;
  color: var(--white);
  border-color: #e53e3e;
  transform: scale(1.02);
}

/* 내 선택 강조 */
.vote-btn--agree.is-selected {
  background: #4973e5;
  color: var(--white);
  border-color: #4973e5;
}
.vote-btn--disagree.is-selected {
  background: #e53e3e;
  color: var(--white);
  border-color: #e53e3e;
}

/* 선택 안 한 버튼 회색 비활성 */
.vote-btn.is-disabled {
  background: #f5f6f8;
  color: #c0c8d4;
  border-color: #e2e8f0;
  cursor: not-allowed;
}

/* 내 선택 라벨 */
.my-pick-label {
  font-size: 11px;
  font-weight: 600;
  opacity: 0.85;
}

.vote-closed-notice {
  text-align: center;
  padding: var(--space-20);
  color: var(--color-text-secondary);
  font-size: var(--font-size-body-sm);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-bg-muted);
}
</style>
