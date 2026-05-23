// 단지 주차 운영 타입 상수 모음
// BE의 ParkingType enum과 code(01/02/03), 라벨/메타 단일 출처

export const PARKING_TYPE_OPTIONS = [
  {
    name: 'NONE',
    code: '01',
    label: '미사용',
    badgeVariant: 'neutral',
    summary: '주차 시스템을 사용하지 않음',
    description: '주차 구역, 입출차 기록, 주차 현황 화면이 모두 비활성화됩니다.',
  },
  {
    name: 'BASIC',
    code: '02',
    label: '기본',
    badgeVariant: 'info',
    summary: '단지 전체 점유율 기준으로 관리',
    description: '주차 구역과 입출차 기록을 관리하며, 전체 면수 대비 점유율을 집계해 표시합니다.',
  },
  {
    name: 'SENSOR',
    code: '03',
    label: '센서',
    badgeVariant: 'primary',
    summary: '자리별 센서로 실시간 점유 관리',
    description: '주차면 단위 실시간 점유 정보를 SSE로 받아 표시합니다. 더 정밀한 운영이 가능합니다.',
  },
]

// code(01/02/03) → enum name(NONE/BASIC/SENSOR) 변환
export function codeToParkingTypeName(code) {
  const option = PARKING_TYPE_OPTIONS.find((item) => item.code === code)
  return option ? option.name : 'NONE'
}

// enum name → code 변환
export function parkingTypeNameToCode(name) {
  const option = PARKING_TYPE_OPTIONS.find((item) => item.name === name)
  return option ? option.code : '01'
}
