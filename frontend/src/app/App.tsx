import { useState } from 'react';
import { LoginPage } from './components/LoginPage';
import { AdminDashboard } from './components/AdminDashboard';
import { SuperadminDashboard } from './components/SuperadminDashboard';
import { RetailDashboard } from './components/RetailDashboard';
import { InventoryDashboard } from './components/InventoryDashboard';
import { POSDashboard } from './components/POSDashboard';
import { CreateOrder } from './components/CreateOrder';
import { TableManagement } from './components/TableManagement';
import { Payment } from './components/Payment';
import { Receipt } from './components/Receipt';
import { OrderList } from './components/OrderList';
import { Reports } from './components/Reports';
import { OrderProvider } from './context/OrderContext';
import { TableProvider } from './context/TableContext';
import type { AuthenticatedUser } from './types/auth';

export type Page =
  | 'login'
  | 'superadmin-dashboard'
  | 'admin-dashboard'
  | 'retail-dashboard'
  | 'retail-pos-dashboard'
  | 'retail-inventory-dashboard'
  | 'inventory-dashboard'
  | 'pos-dashboard'
  | 'create-order'
  | 'table-management'
  | 'payment'
  | 'receipt'
  | 'order-list'
  | 'reports';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('login');
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null);
  const [currentOrder, setCurrentOrder] = useState<any>(null);

  const handleLogin = (user: AuthenticatedUser) => {
    setCurrentUser(user);

    if (user.role === 'SUPERADMIN') {
      setCurrentPage('superadmin-dashboard');
      return;
    }

    if (user.role === 'ADMIN' && user.store_type === 'RETAIL_STORE') {
      setCurrentPage('retail-dashboard');
      return;
    }

    if (user.role === 'ADMIN' && user.store_type === 'RESTAURANT') {
      setCurrentPage('admin-dashboard');
      return;
    }

    if (user.role === 'STAFF' && user.store_type === 'RETAIL_STORE' && user.staff_type === 'POS_STAFF') {
      setCurrentPage('retail-pos-dashboard');
      return;
    }

    if (user.role === 'STAFF' && user.store_type === 'RETAIL_STORE' && user.staff_type === 'INVENTORY_STAFF') {
      setCurrentPage('retail-inventory-dashboard');
      return;
    }

    if (user.role === 'STAFF' && user.store_type === 'RESTAURANT' && user.staff_type === 'INVENTORY_STAFF') {
      setCurrentPage('inventory-dashboard');
      return;
    }

    if (user.role === 'STAFF' && user.store_type === 'RESTAURANT' && user.staff_type === 'POS_STAFF') {
      setCurrentPage('pos-dashboard');
      return;
    }

    setCurrentPage('login');
  };

  const handleLogout = () => {
    setCurrentUser(null);
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
          {currentPage === 'superadmin-dashboard' && (
            <SuperadminDashboard currentUser={currentUser} onLogout={handleLogout} />
          )}
          {currentPage === 'admin-dashboard' && (
            <AdminDashboard currentUser={currentUser} onLogout={handleLogout} onNavigate={navigateTo} />
          )}
          {currentPage === 'retail-dashboard' && (
            <RetailDashboard currentUser={currentUser} onLogout={handleLogout} />
          )}
          {currentPage === 'retail-pos-dashboard' && (
            <RetailDashboard title="Retail POS Dashboard" roleLabel="Retail POS Staff" currentUser={currentUser} onLogout={handleLogout} />
          )}
          {currentPage === 'retail-inventory-dashboard' && (
            <RetailDashboard title="Retail Inventory Dashboard" roleLabel="Retail Inventory Staff" currentUser={currentUser} onLogout={handleLogout} />
          )}
          {currentPage === 'inventory-dashboard' && (
            <InventoryDashboard onLogout={handleLogout} />
          )}
          {currentPage === 'pos-dashboard' && (
            <POSDashboard onLogout={handleLogout} onNavigate={navigateTo} isAdmin={currentUser?.role === 'ADMIN'} />
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
            <OrderList onNavigate={navigateTo} onLogout={handleLogout} isAdmin={currentUser?.role === 'ADMIN'} />
          )}
          {currentPage === 'reports' && (
            <Reports onNavigate={navigateTo} onLogout={handleLogout} isAdmin={currentUser?.role === 'ADMIN'} />
          )}
        </TableProvider>
      </OrderProvider>
    </div>
  );
}
