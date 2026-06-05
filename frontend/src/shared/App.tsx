import { useEffect, useState } from 'react';
import { LoginPage } from '../auth/pages/LoginPage';
import { AdminDashboard } from './components/AdminDashboard';
import { SuperadminDashboard } from '../superadmin/pages/SuperadminDashboard';
import { RetailDashboard } from '../retail/pages/RetailDashboard';
import { RetailOrderProvider } from '../retail/context/RetailOrderContext';
import { RetailPOSDashboard } from '../retail/pages/RetailPOSDashboard';
import { RetailCreateOrder } from '../retail/pages/RetailCreateOrder';
import { RetailOrderList } from '../retail/pages/RetailOrderList';
import { RetailReports } from '../retail/pages/RetailReports';
import { POSDashboard } from '../restaurant/pages/POSDashboard';
import { CreateOrder } from '../restaurant/pages/CreateOrder';
import { TableManagement } from '../restaurant/pages/TableManagement';
import { Payment } from '../restaurant/pages/Payment';
import { Receipt } from '../restaurant/pages/Receipt';
import { OrderList } from '../restaurant/pages/OrderList';
import { Reports } from '../restaurant/pages/Reports';
import { StoreInformation } from './components/StoreInformation';
import { StoreSettings } from './components/StoreSettings';
import { CategoryManagement } from './components/CategoryManagement';
import { ProductManagement } from './components/ProductManagement';
import { OrderProvider } from './context/OrderContext';
import { TableProvider } from './context/TableContext';
import { StoreSettingsProvider } from './context/StoreSettingsContext';
import { getApiBaseUrl } from '../auth/services/auth';
import type { AuthenticatedUser } from '../auth/types/auth';

export type Page =
  | 'login'
  | 'superadmin-dashboard'
  | 'admin-dashboard'
  | 'retail-dashboard'
  | 'retail-pos-dashboard'
  | 'retail-sales'
  | 'retail-transactions'
  | 'retail-reports'
  | 'pos-dashboard'
  | 'create-order'
  | 'table-management'
  | 'payment'
  | 'receipt'
  | 'order-list'
  | 'reports'
  | 'store-information'
  | 'store-settings'
  | 'category-management'
  | 'product-management';

export interface StoreBrand {
  name: string | null;
  logo: string | null;
  business_description?: string | null;
  address?: string | null;
  contact_number?: string | null;
  email?: string | null;
  receipt_thank_you_message?: string | null;
  receipt_footer_message?: string | null;
  operating_hours?: string | null;
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('login');
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null);
  const [currentOrder, setCurrentOrder] = useState<any>(null);
  const [storeBrand, setStoreBrand] = useState<StoreBrand>({ name: null, logo: null });

  useEffect(() => {
    const loadStoreBrand = async () => {
      if (!currentUser?.id || currentUser.role === 'SUPERADMIN') {
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
            business_description: data.business_description ?? null,
            address: data.address ?? null,
            contact_number: data.contact_number ?? null,
            email: data.email ?? null,
            receipt_thank_you_message: data.receipt_thank_you_message ?? null,
            receipt_footer_message: data.receipt_footer_message ?? null,
            operating_hours: data.operating_hours ?? null,
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
      setCurrentPage('retail-pos-dashboard');
      return;
    }

    if (user.role === 'ADMIN' && user.store_type === 'RESTAURANT') {
      setCurrentPage('pos-dashboard');
      return;
    }

    if (user.role === 'STAFF' && user.store_type === 'RETAIL_STORE') {
      setCurrentPage('retail-pos-dashboard');
      return;
    }

    if (user.role === 'STAFF' && user.store_type === 'RESTAURANT') {
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
      <StoreSettingsProvider currentUser={currentUser}>
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
            <RetailDashboard currentUser={currentUser} onLogout={handleLogout} onNavigate={navigateTo} storeBrand={storeBrand} userName={currentUser?.full_name} storeType={currentUser?.store_type} staffType={currentUser?.staff_type} />
          )}
          {(currentPage === 'retail-pos-dashboard' || currentPage === 'retail-sales' || currentPage === 'retail-transactions' || currentPage === 'retail-reports') && (
            <RetailOrderProvider>
              {currentPage === 'retail-pos-dashboard' && (
                <RetailPOSDashboard
                  onLogout={handleLogout}
                  onNavigate={navigateTo}
                  isAdmin={currentUser?.role === 'ADMIN'}
                  storeBrand={storeBrand}
                  userName={currentUser?.full_name}
                  storeType={currentUser?.store_type}
                  staffType={currentUser?.staff_type}
                />
              )}
              {currentPage === 'retail-sales' && (
                <RetailCreateOrder
                  onNavigate={navigateTo}
                  onOrderCreated={setCurrentOrder}
                  onLogout={handleLogout}
                  storeBrand={storeBrand}
                  userName={currentUser?.full_name}
                  storeType={currentUser?.store_type}
                  staffType={currentUser?.staff_type}
                />
              )}
              {currentPage === 'retail-transactions' && (
                <RetailOrderList
                  onNavigate={navigateTo}
                  onLogout={handleLogout}
                  isAdmin={currentUser?.role === 'ADMIN'}
                  storeBrand={storeBrand}
                  userName={currentUser?.full_name}
                  storeType={currentUser?.store_type}
                  staffType={currentUser?.staff_type}
                />
              )}
              {currentPage === 'retail-reports' && (
                <RetailReports
                  onNavigate={navigateTo}
                  onLogout={handleLogout}
                  isAdmin={currentUser?.role === 'ADMIN'}
                  storeBrand={storeBrand}
                  userName={currentUser?.full_name}
                  storeType={currentUser?.store_type}
                  staffType={currentUser?.staff_type}
                />
              )}
            </RetailOrderProvider>
          )}
          {currentPage === 'pos-dashboard' && (
            <POSDashboard onLogout={handleLogout} onNavigate={navigateTo} isAdmin={currentUser?.role === 'ADMIN'} storeBrand={storeBrand} userName={currentUser?.full_name} storeType={currentUser?.store_type} staffType={currentUser?.staff_type} />
          )}
          {currentPage === 'create-order' && (
            <CreateOrder onNavigate={navigateTo} onOrderCreated={setCurrentOrder} onLogout={handleLogout} storeBrand={storeBrand} userName={currentUser?.full_name} storeType={currentUser?.store_type} staffType={currentUser?.staff_type} />
          )}
          {currentPage === 'table-management' && (
            <TableManagement onNavigate={navigateTo} currentOrder={currentOrder} onLogout={handleLogout} storeBrand={storeBrand} userName={currentUser?.full_name} storeType={currentUser?.store_type} staffType={currentUser?.staff_type} />
          )}
          {currentPage === 'payment' && (
            <Payment onNavigate={navigateTo} currentOrder={currentOrder} onLogout={handleLogout} storeBrand={storeBrand} userName={currentUser?.full_name} storeType={currentUser?.store_type} staffType={currentUser?.staff_type} />
          )}
          {currentPage === 'receipt' && (
            <Receipt onNavigate={navigateTo} currentOrder={currentOrder} onLogout={handleLogout} storeBrand={storeBrand} userName={currentUser?.full_name} storeType={currentUser?.store_type} staffType={currentUser?.staff_type} />
          )}
          {currentPage === 'order-list' && (
            <OrderList onNavigate={navigateTo} onLogout={handleLogout} isAdmin={currentUser?.role === 'ADMIN'} storeBrand={storeBrand} userName={currentUser?.full_name} storeType={currentUser?.store_type} staffType={currentUser?.staff_type} />
          )}
          {currentPage === 'reports' && (
            <Reports onNavigate={navigateTo} onLogout={handleLogout} isAdmin={currentUser?.role === 'ADMIN'} storeBrand={storeBrand} userName={currentUser?.full_name} storeType={currentUser?.store_type} staffType={currentUser?.staff_type} />
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
          {currentPage === 'store-settings' && (
            <StoreSettings currentUser={currentUser} storeBrand={storeBrand} onLogout={handleLogout} onNavigate={navigateTo} />
          )}
          {currentPage === 'category-management' && (
            <CategoryManagement currentUser={currentUser} storeBrand={storeBrand} onLogout={handleLogout} onNavigate={navigateTo} />
          )}
          {currentPage === 'product-management' && (
            <ProductManagement currentUser={currentUser} storeBrand={storeBrand} onLogout={handleLogout} onNavigate={navigateTo} />
          )}
          </TableProvider>
        </OrderProvider>
      </StoreSettingsProvider>
    </div>
  );
}
