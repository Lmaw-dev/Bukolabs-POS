import { useState } from 'react';
import { LoginPage } from './components/LoginPage';
import { AdminDashboard } from './components/AdminDashboard';
import { POSDashboard } from './components/POSDashboard';
import { CreateOrder } from './components/CreateOrder';
import { TableManagement } from './components/TableManagement';
import { Payment } from './components/Payment';
import { Receipt } from './components/Receipt';
import { OrderList } from './components/OrderList';
import { Reports } from './components/Reports';
import { OrderProvider } from './context/OrderContext';
import { TableProvider } from './context/TableContext';

export type UserRole = 'admin' | 'staff' | 'cashier' | null;

export type Page =
  | 'login'
  | 'admin-dashboard'
  | 'pos-dashboard'
  | 'create-order'
  | 'table-management'
  | 'payment'
  | 'receipt'
  | 'order-list'
  | 'reports';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('login');
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [currentOrder, setCurrentOrder] = useState<any>(null);

  const handleLogin = (role: UserRole) => {
    setUserRole(role);
    if (role === 'admin') {
      setCurrentPage('admin-dashboard');
    } else {
      setCurrentPage('pos-dashboard');
    }
  };

  const handleLogout = () => {
    setUserRole(null);
    setCurrentPage('login');
    setCurrentOrder(null);
  };

  const navigateTo = (page: Page) => {
    setCurrentPage(page);
  };

  return (
    <div className="size-full bg-background">
      <OrderProvider>
        <TableProvider>
          {currentPage === 'login' && (
            <LoginPage onLogin={handleLogin} />
          )}
          {currentPage === 'admin-dashboard' && (
            <AdminDashboard onLogout={handleLogout} onNavigate={navigateTo} />
          )}
          {currentPage === 'pos-dashboard' && (
            <POSDashboard onLogout={handleLogout} onNavigate={navigateTo} isAdmin={userRole === 'admin'} />
          )}
          {currentPage === 'create-order' && (
            <CreateOrder onNavigate={navigateTo} onOrderCreated={setCurrentOrder} />
          )}
          {currentPage === 'table-management' && (
            <TableManagement onNavigate={navigateTo} currentOrder={currentOrder} />
          )}
          {currentPage === 'payment' && (
            <Payment onNavigate={navigateTo} currentOrder={currentOrder} />
          )}
          {currentPage === 'receipt' && (
            <Receipt onNavigate={navigateTo} currentOrder={currentOrder} />
          )}
          {currentPage === 'order-list' && (
            <OrderList onNavigate={navigateTo} onLogout={handleLogout} isAdmin={userRole === 'admin'} />
          )}
          {currentPage === 'reports' && (
            <Reports onNavigate={navigateTo} onLogout={handleLogout} isAdmin={userRole === 'admin'} />
          )}
        </TableProvider>
      </OrderProvider>
    </div>
  );
}
