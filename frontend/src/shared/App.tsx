import { useEffect, useState } from 'react';
import { LoginPage } from '../auth/pages/LoginPage';
import { AdminDashboard } from './components/AdminDashboard';
import { SuperadminDashboard } from '../superadmin/pages/SuperadminDashboard';
import { RetailDashboard } from '../retail/pages/RetailDashboard';
import { InventoryDashboard } from '../restaurant/pages/InventoryDashboard';
import { POSDashboard } from '../restaurant/pages/POSDashboard';
import { CreateOrder } from '../restaurant/pages/CreateOrder';
import { TableManagement } from '../restaurant/pages/TableManagement';
import { Payment } from '../restaurant/pages/Payment';
import { Receipt } from '../restaurant/pages/Receipt';
import { OrderList } from '../restaurant/pages/OrderList';
import { Reports } from '../restaurant/pages/Reports';
import { StoreInformation } from './components/StoreInformation';
import { OrderProvider } from './context/OrderContext';
import { TableProvider } from './context/TableContext';
import { getApiBaseUrl } from '../auth/services/auth';
import type { AuthenticatedUser } from '../auth/types/auth';

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
  | 'reports'
  | 'store-information';

export interface StoreBrand {
  name: string | null;
  logo: string | null;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('login');
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [storeBrand, setStoreBrand] = useState<StoreBrand>({ name: null, logo: null });

  useEffect(() => {
    const loadStoreBrand = async () => {
      if (!currentUser?.id || currentUser.role !== 'ADMIN') {
        setStoreBrand({ name: null, logo: null });
        return;
      }

      try {
        const response = await fetch(`${getApiBaseUrl()}/admin/store-information?admin_user_id=${currentUser.id}`);
        const data = await response.json();

        if (response.ok) {
          setStoreBrand({
            name: data.business_name ?? currentUser.store_name ?? null,
            logo: data.logo ?? null,
          });
        }
      } catch {
        setStoreBrand({ name: currentUser.store_name ?? null, logo: null });
      }
    };

    void loadStoreBrand();
  }, [currentUser?.id, currentUser?.role, currentUser?.store_name]);

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
      setCurrentPage('pos-dashboard');
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
    setStoreBrand({ name: null, logo: null });
  };

  const navigateTo = (page: Page) => {
    setCurrentPage(page);
  };

  const updateCurrentUser = (updates: Partial<AuthenticatedUser>) => {
    setCurrentUser((user) => (user ? { ...user, ...updates } : user));
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
            <AdminDashboard currentUser={currentUser} storeBrand={storeBrand} onLogout={handleLogout} onNavigate={navigateTo} />
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
            <POSDashboard onLogout={handleLogout} onNavigate={navigateTo} isAdmin={currentUser?.role === 'ADMIN'} storeBrand={storeBrand} userName={currentUser?.full_name} />
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
            <OrderList onNavigate={navigateTo} onLogout={handleLogout} isAdmin={currentUser?.role === 'ADMIN'} storeBrand={storeBrand} userName={currentUser?.full_name} />
          )}
          {currentPage === 'reports' && (
            <Reports onNavigate={navigateTo} onLogout={handleLogout} isAdmin={currentUser?.role === 'ADMIN'} storeBrand={storeBrand} userName={currentUser?.full_name} />
          )}
          {currentPage === 'store-information' && (
            <StoreInformation
              currentUser={currentUser}
              onLogout={handleLogout}
              onNavigate={navigateTo}
              onUserUpdate={updateCurrentUser}
              onStoreBrandUpdate={setStoreBrand}
              storeBrand={storeBrand}
            />
          )}
        </TableProvider>
      </OrderProvider>
    </div>
  );
}
