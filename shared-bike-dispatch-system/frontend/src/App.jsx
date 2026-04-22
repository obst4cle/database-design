import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import UsersPage from './pages/UsersPage'
import StationsPage from './pages/StationsPage'
import EquipmentsPage from './pages/EquipmentsPage'
import OrdersPage from './pages/OrdersPage'
import CouponsPage from './pages/CouponsPage'
import OperationsPage from './pages/OperationsPage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/users" element={<UsersPage />} />
      <Route path="/stations" element={<StationsPage />} />
      <Route path="/equipments" element={<EquipmentsPage />} />
      <Route path="/orders" element={<OrdersPage />} />
      <Route path="/coupons" element={<CouponsPage />} />
      <Route path="/operations" element={<OperationsPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
