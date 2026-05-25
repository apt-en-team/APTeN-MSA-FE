// 백엔드 enum 응답을 프론트 코드값으로 정규화한다.
// 한글 value, 코드값 혼용 응답을 모두 수용해 일관된 코드로 반환한다.

export const normalizeReservationType = (value) => {
  if (value == null) return ''
  const map = {
    SEAT: 'SEAT', '좌석형': 'SEAT',
    COUNT: 'COUNT', '정원형': 'COUNT',
    APPROVAL: 'APPROVAL', '승인형': 'APPROVAL',
  }
  return map[String(value).trim()] ?? value
}

// isActive boolean이 있으면 우선 사용한다.
export const normalizeFacilityStatus = (value, isActive) => {
  if (typeof isActive === 'boolean') return isActive ? 'ACTIVE' : 'INACTIVE'
  if (value == null) return 'INACTIVE'
  const v = String(value).trim()
  if (['ACTIVE', '운영중', '운영 중', 'OPERATING', 'true', 'TRUE'].includes(v)) return 'ACTIVE'
  return 'INACTIVE'
}

export const normalizeReservationStatus = (value) => {
  if (value == null) return ''
  const map = {
    CONFIRMED: 'CONFIRMED', '예약완료': 'CONFIRMED', '승인완료': 'CONFIRMED', '신청완료': 'CONFIRMED',
    COMPLETED: 'COMPLETED', '이용완료': 'COMPLETED',
    CANCELLED: 'CANCELLED', '취소': 'CANCELLED', '예약취소': 'CANCELLED', '취소됨': 'CANCELLED',
    WAITING: 'WAITING', '대기': 'WAITING', '대기중': 'WAITING', '대기 중': 'WAITING',
    REJECTED: 'REJECTED', '거절': 'REJECTED', '거절됨': 'REJECTED',
  }
  return map[String(value).trim()] ?? value
}

export const normalizeGxProgramStatus = (value) => {
  if (value == null) return ''
  const map = {
    RECRUITING: 'RECRUITING', '모집중': 'RECRUITING', '모집 중': 'RECRUITING',
    OPEN: 'RECRUITING', WAITING_REGISTRATION: 'RECRUITING',
    WAITING_CLOSED: 'WAITING_CLOSED', '모집마감': 'WAITING_CLOSED',
    CLOSED: 'CLOSED', '마감': 'CLOSED', '종료': 'CLOSED',
    CANCELLED: 'CANCELLED', '취소': 'CANCELLED', '취소됨': 'CANCELLED', '프로그램취소': 'CANCELLED',
    ACTIVE: 'ACTIVE', '진행중': 'ACTIVE', '진행 중': 'ACTIVE',
  }
  return map[String(value).trim()] ?? value
}

export const normalizeGxReservationStatus = (value) => {
  if (value == null) return ''
  const map = {
    CONFIRMED: 'CONFIRMED', '신청완료': 'CONFIRMED', '수강확정': 'CONFIRMED', '승인완료': 'CONFIRMED', '확정': 'CONFIRMED',
    WAITING: 'WAITING', '대기': 'WAITING', '대기중': 'WAITING', '대기 중': 'WAITING',
    CANCELLED: 'CANCELLED', '취소': 'CANCELLED', '취소됨': 'CANCELLED',
    REJECTED: 'REJECTED', '거절': 'REJECTED', '거절됨': 'REJECTED',
    COMPLETED: 'COMPLETED', '이용완료': 'COMPLETED',
  }
  return map[String(value).trim()] ?? value
}
