import { DEFAULT_COMPLEX_FEATURES, FEATURE_CODES } from '@/constants/complexFeatures'

// features source 확정 후 featuresReady 방식으로 개선 가능하다.
export function normalizeFeatures(features) {
  return {
    ...DEFAULT_COMPLEX_FEATURES,
    ...(features || {}),
  }
}

// false로 명확히 내려온 기능만 비활성으로 판단한다.
export function isFeatureEnabled(features, featureCode) {
  const normalizedFeatures = normalizeFeatures(features)

  if (!(featureCode in normalizedFeatures)) {
    return true
  }

  return normalizedFeatures[featureCode] !== false
}

// 관리자 경로를 기능 코드와 매핑한다.
export function getAdminFeatureByPath(path = '') {
  if (path.startsWith('/admin/facilities')) return FEATURE_CODES.FACILITY
  if (path.startsWith('/admin/reservations')) return FEATURE_CODES.FACILITY
  if (path.startsWith('/admin/gx-programs')) return FEATURE_CODES.FACILITY
  if (path.startsWith('/admin/parking-logs')) return FEATURE_CODES.PARKING_STATUS
  if (path.startsWith('/admin/parking/dashboard')) return FEATURE_CODES.PARKING_STATUS
  if (path.startsWith('/admin/votes')) return FEATURE_CODES.VOTE
  return null
}

// 입주민 경로를 기능 코드와 매핑한다.
export function getResidentFeatureByPath(path = '') {
  if (path.includes('/facility')) return FEATURE_CODES.FACILITY
  if (path.includes('/reservations')) return FEATURE_CODES.FACILITY
  if (path.includes('/parking')) return FEATURE_CODES.PARKING_STATUS
  if (path.includes('/vote')) return FEATURE_CODES.VOTE
  return null
}
