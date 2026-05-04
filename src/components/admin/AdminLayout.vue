<script setup>
// 1차 관리자 화면 구조를 참고한 관리자 레이아웃 셸이다.
// MASTER와 ADMIN 화면은 필요 시 이 공통 프레젠테이션 컴포넌트를 재사용할 수 있다.
import { computed } from 'vue'

// 사이드바와 헤더에 표시할 기본 정보를 props로 받는다.
const props = defineProps({
  title: {
    type: String,
    default: '관리자 화면',
  },
  subtitle: {
    type: String,
    default: '',
  },
  navGroups: {
    type: Array,
    default: () => [],
  },
  profileName: {
    type: String,
    default: '관리자',
  },
  profileRole: {
    type: String,
    default: 'ADMIN',
  },
})

// 그룹형 네비게이션 데이터를 템플릿에서 사용하기 쉬운 형태로 정리한다.
const flattenedNav = computed(() => props.navGroups || [])
</script>

<template>
  <div class="legacy-admin-layout">
    <!-- 좌측 사이드바 영역이다. -->
    <aside class="legacy-admin-layout__sidebar">
      <div class="legacy-admin-layout__brand">
        <div class="legacy-admin-layout__brand-icon">A</div>
        <div>
          <p class="legacy-admin-layout__brand-title">아파트엔</p>
          <p class="legacy-admin-layout__brand-role">관리자</p>
        </div>
      </div>

      <div class="legacy-admin-layout__nav-scroll">
        <div v-for="group in flattenedNav" :key="group.label" class="legacy-admin-layout__nav-group">
          <p class="legacy-admin-layout__section-label">{{ group.label }}</p>
          <!-- 메뉴 아이템은 slot으로 교체하거나 기본 텍스트로 표시한다. -->
          <nav class="legacy-admin-layout__nav">
            <slot name="nav" :group="group">
              <div
                v-for="item in group.items || []"
                :key="item.label"
                class="legacy-admin-layout__nav-link"
              >
                {{ item.label }}
              </div>
            </slot>
          </nav>
        </div>
      </div>

      <!-- 하단 프로필 영역이다. -->
      <div class="legacy-admin-layout__profile">
        <div class="legacy-admin-layout__profile-avatar">관</div>
        <div class="legacy-admin-layout__profile-card">
          <p class="legacy-admin-layout__profile-name">{{ profileName }}</p>
          <p class="legacy-admin-layout__profile-role">{{ profileRole }}</p>
        </div>
      </div>
    </aside>

    <div class="legacy-admin-layout__main">
      <!-- 상단 헤더 영역이다. -->
      <header class="legacy-admin-layout__header">
        <div>
          <h1 class="legacy-admin-layout__title">{{ title }}</h1>
          <p v-if="subtitle" class="legacy-admin-layout__subtitle">{{ subtitle }}</p>
        </div>
        <slot name="header-actions" />
      </header>

      <!-- 본문 콘텐츠 영역이다. -->
      <section class="legacy-admin-layout__content">
        <slot />
      </section>
    </div>
  </div>
</template>

<style scoped>
.legacy-admin-layout {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  min-height: 100vh;
  background: #F5F6F8;
}

.legacy-admin-layout__sidebar {
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  justify-content: space-between;
  background: #1E2A3E;
  color: #FFFFFF;
}

.legacy-admin-layout__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 24px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}

.legacy-admin-layout__brand-icon {
  display: flex;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: #2B3A55;
  font-size: 16px;
  font-weight: 700;
}

.legacy-admin-layout__brand-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
}

.legacy-admin-layout__brand-role {
  margin: 2px 0 0;
  color: #7B8EA8;
  font-size: 11px;
}

.legacy-admin-layout__nav-scroll {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
}

.legacy-admin-layout__nav-group + .legacy-admin-layout__nav-group {
  margin-top: 8px;
}

.legacy-admin-layout__section-label {
  margin: 0 0 5px;
  padding: 14px 10px 5px;
  color: #687282;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
}

.legacy-admin-layout__nav {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.legacy-admin-layout__nav-link {
  display: flex;
  align-items: center;
  min-height: 36px;
  padding: 9px 10px;
  border-radius: 7px;
  color: #8B9AB0;
  font-size: 13px;
}

.legacy-admin-layout__profile {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
}

.legacy-admin-layout__profile-avatar {
  display: flex;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #2B3A55;
  color: #FFFFFF;
  font-size: 12px;
  font-weight: 600;
}

.legacy-admin-layout__profile-card {
  min-width: 0;
}

.legacy-admin-layout__profile-name {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
}

.legacy-admin-layout__profile-role {
  margin: 2px 0 0;
  color: #7B8EA8;
  font-size: 11px;
}

.legacy-admin-layout__main {
  display: flex;
  flex-direction: column;
}

.legacy-admin-layout__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 88px;
  padding: 0 48px;
  border-bottom: 1px solid #E2E8F0;
  background: #F5F6F8;
}

.legacy-admin-layout__title {
  margin: 0;
  color: #1A202C;
  font-size: 22px;
  font-weight: 700;
}

.legacy-admin-layout__subtitle {
  margin: 6px 0 0;
  color: #687282;
  font-size: 12px;
}

.legacy-admin-layout__content {
  padding: 20px 64px;
}
</style>
