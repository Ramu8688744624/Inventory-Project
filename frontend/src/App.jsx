import { Navigate, Route, Routes } from 'react-router-dom'
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

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/" element={<AppLayout />}>
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
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

