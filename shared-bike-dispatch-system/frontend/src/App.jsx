import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import UsersPage from './pages/UsersPage'
import StationsPage from './pages/StationsPage'
import EquipmentsPage from './pages/EquipmentsPage'
import OrdersPage from './pages/OrdersPage'
import TransactionsPage from './pages/TransactionsPage'
import CouponsPage from './pages/CouponsPage'
import OperationsPage from './pages/OperationsPage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/users" element={<UsersPage />} />
      <Route path="/stations" element={<StationsPage />} />
      <Route path="/equipments" element={<EquipmentsPage />} />
      <Route path="/orders" element={<OrdersPage />} />
      <Route path="/transactions" element={<TransactionsPage />} />
      <Route path="/coupons" element={<CouponsPage />} />
      <Route path="/operations" element={<OperationsPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
