import axios from 'axios'

export const SHOP_ID = Number(import.meta.env.VITE_SHOP_ID || 1)

// Prefer Vite env var; fallback to VITE_API_BASE_URL, React env var, then local dev default.
// This avoids situations where no env var is defined and app becomes blank due to uncaught HTTP errors.
const baseURL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  process.env.REACT_APP_API_URL ||
  'http://localhost:5000/api'

if (!baseURL) {
  // Should never happen with above fallback; this is defensive.
  console.error('API base URL is not configured. Set VITE_API_URL, VITE_API_BASE_URL, or REACT_APP_API_URL in .env.')
}

export const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'x-shop-id': String(SHOP_ID),
  },
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API request failed:', error)
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

