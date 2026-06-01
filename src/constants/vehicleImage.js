// 차종 텍스트를 차급으로 매핑하고 차급별 카드 이미지를 제공하는 모듈이다.
// 이미지 파일은 src/assets/images/vehicle/ 아래 실제 파일명 그대로 사용한다.

// 차급별 키워드 사전, 공백과 대소문자를 무시한 부분 매칭에 사용
const VEHICLE_CLASS_KEYWORDS = {
  compact: ['모닝', '레이', '스파크', '캐스퍼', '비스토', '마티즈'],
  sedan: ['아반떼', '소나타', '그랜저', 'k3', 'k5', 'k7', 'k8', 'sm6', '말리부', '어코드', '캠리', '제네시스', 'g70', 'g80'],
  suv: ['투싼', '싼타페', '쏘렌토', '스포티지', '셀토스', '코나', '니로', '팰리세이드', 'qm6', '티볼리', '렉스턴'],
  van: ['카니발', '스타렉스', '스타리아', '쏠라티'],
}

// 매칭 실패 시 사용할 기본 차급
const DEFAULT_VEHICLE_CLASS = 'sedan'

// 차급을 실제 이미지 파일명으로 연결 (대문자/공백 포함, 비교는 소문자로 정규화)
const VEHICLE_CLASS_FILE = {
  compact: 'compact car.png',
  sedan: 'sedan.png',
  suv: 'suv.png',
  van: 'van.png',
}

// 차급별 이미지 파일을 빌드 시점에 정적으로 수집한다. 파일이 없으면 맵에서 빠진다.
const imageModules = import.meta.glob('../assets/images/vehicle/*.png', {
  eager: true,
  import: 'default',
})

// 파일명(소문자)을 키로 이미지 url 맵을 구성한다.
const FILE_URL_MAP = Object.entries(imageModules).reduce((acc, [path, url]) => {
  const fileName = path.split('/').pop()
  if (fileName) {
    acc[fileName.toLowerCase()] = url
  }
  return acc
}, {})

// 차종 텍스트를 차급으로 변환
export function resolveVehicleClass(modelName) {
  if (!modelName) {
    return DEFAULT_VEHICLE_CLASS
  }
  const normalized = String(modelName).replace(/\s+/g, '').toLowerCase()
  for (const [className, keywords] of Object.entries(VEHICLE_CLASS_KEYWORDS)) {
    if (keywords.some((keyword) => normalized.includes(keyword.toLowerCase()))) {
      return className
    }
  }
  return DEFAULT_VEHICLE_CLASS
}

// 차종 텍스트에 해당하는 카드 이미지를 반환, 파일이 없으면 undefined
export function vehicleImageByModelName(modelName) {
  const fileName = VEHICLE_CLASS_FILE[resolveVehicleClass(modelName)]
  return FILE_URL_MAP[fileName]
}
