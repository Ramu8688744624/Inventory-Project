import axios from 'axios'

export const SHOP_ID = Number(import.meta.env.VITE_SHOP_ID || 1)

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 15000,
  headers: {
    'x-shop-id': String(SHOP_ID),
  },
})

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
)

export function getErrorMessage(err) {
  const msg =
    err?.response?.data?.error ||
    err?.message ||
    'Something went wrong'
  return String(msg)
}

