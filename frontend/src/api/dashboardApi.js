import apiClient from './apiClient.js'

export async function fetchDashboardStats() {
  const response = await apiClient.get('/api/stats')
  return response.data
}

export async function fetchPatients(params) {
  const response = await apiClient.get('/api/patients', { params })
  return response.data
}

export async function fetchPatientOptions() {
  const response = await apiClient.get('/api/options')
  return response.data
}

export async function createPatient(patientData) {
  const response = await apiClient.post('/api/patients', patientData)
  return response.data
}

export async function fetchPatient(patientId) {
  const response = await apiClient.get(`/api/patients/${patientId}`)
  return response.data
}

export async function updatePatient(patientId, patientData) {
  const response = await apiClient.put(`/api/patients/${patientId}`, patientData)
  return response.data
}

export async function deletePatient(patientId) {
  const response = await apiClient.delete(`/api/patients/${patientId}`)
  return response.data
}

export async function dischargePatient(patientId) {
  const response = await apiClient.patch(`/api/patients/${patientId}/discharge`)
  return response.data
}
