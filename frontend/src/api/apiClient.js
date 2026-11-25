import axios from 'axios'

const apiClient = axios.create({
  baseURL: 'http://127.0.0.1:8001',
  timeout: 10000,
})

export function getApiErrorMessage(error, fallbackMessage) {
  const detail = error.response?.data?.detail

  if (typeof detail === 'string') {
    return detail
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => item.msg)
      .filter(Boolean)
      .join(' ')
  }

  return fallbackMessage
}

export default apiClient
