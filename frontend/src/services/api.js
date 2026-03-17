import axios from 'axios'

export const SHOP_ID = Number(import.meta.env.VITE_SHOP_ID || 1)
export const AUTH_ENABLED = import.meta.env.VITE_AUTH_ENABLED === 'true'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 15000,
  headers: {
    'x-shop-id': String(SHOP_ID),
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('inventory_auth')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  } else {
    delete config.headers.Authorization
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    if (status === 401) {
      localStorage.clear()
      sessionStorage.clear()
      window.location.replace('/login')
    }
    return Promise.reject(error)
  }
)

export function getErrorMessage(err) {
  const msg =
    err?.response?.data?.error ||
    err?.message ||
    'Something went wrong'
  return String(msg)
}

