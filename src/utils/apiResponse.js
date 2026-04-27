// API 응답에서 실제 데이터 추출
export function unwrapApiData(response) {
  const body = response?.data

  if (body == null) return body

  if (Object.prototype.hasOwnProperty.call(body, 'resultData')) {
    return body.resultData
  }

  if (Object.prototype.hasOwnProperty.call(body, 'data')) {
    return body.data
  }

  if (Object.prototype.hasOwnProperty.call(body, 'content')) {
    return body
  }

  return body
}

// 페이지 응답 여부 확인
export function isPageResponse(data) {
  return !!data && Array.isArray(data.content)
}

// 목록 데이터 안전 추출
export function toList(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.content)) return data.content
  return []
}
