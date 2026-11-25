import axios from 'axios'

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV
    ? 'http://127.0.0.1:8001'
    : 'https://patient-admission-manage-git-20bfa1-sahilak73984-5611s-projects.vercel.app')

const apiClient = axios.create({
  baseURL: apiBaseUrl,
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
