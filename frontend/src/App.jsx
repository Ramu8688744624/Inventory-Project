import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AUTH_ENABLED } from './services/api'
import AppLayout from './components/AppLayout.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import CategoriesPage from './pages/CategoriesPage.jsx'
import InventoryPage from './pages/InventoryPage.jsx'
import SalesPosPage from './pages/SalesPosPage.jsx'
import StockPage from './pages/StockPage.jsx'
import OutOfStockPage from './pages/OutOfStockPage.jsx'
import LowStockPage from './pages/LowStockPage.jsx'
import SalesHistoryPage from './pages/SalesHistoryPage.jsx'
import ProfitReportsPage from './pages/ProfitReportsPage.jsx'
import ServiceIncomePage from './pages/ServiceIncomePage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx'
import VerifyEmailPage from './pages/VerifyEmailPage.jsx'
import ResetPasswordPage from './pages/ResetPasswordPage.jsx'

function ProtectedRoute({ children }) {
  const { token, loading } = useAuth()

  if (!AUTH_ENABLED) return children
  if (loading) return null
  if (!token) return <Navigate to="/login" replace />
  return children
}

function AppRoutes() {
  const { loading } = useAuth()

  if (loading) {
    return null
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="sales-pos" element={<SalesPosPage />} />
        <Route path="stock" element={<StockPage />} />
        <Route path="out-of-stock" element={<OutOfStockPage />} />
        <Route path="low-stock" element={<LowStockPage />} />
        <Route path="sales-history" element={<SalesHistoryPage />} />
        <Route path="profit-reports" element={<ProfitReportsPage />} />
        <Route path="service-income" element={<ServiceIncomePage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

