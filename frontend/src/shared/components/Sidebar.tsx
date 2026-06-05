import { Home, ShoppingCart, List, BarChart3, LogOut, Users, UtensilsCrossed, Store, ShoppingBag, Settings, Tags, Package } from 'lucide-react';
import { Page, type StoreBrand } from '../App';
import type { StaffType } from '../../auth/types/auth';
import { useStoreSettings } from '../context/StoreSettingsContext';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  isAdmin?: boolean;
  storeBrand?: StoreBrand;
  userName?: string | null;
  storeType?: 'RESTAURANT' | 'RETAIL_STORE' | string | null;
  staffType?: StaffType;
}

export function Sidebar({ currentPage, onNavigate, onLogout, isAdmin = false, storeBrand, userName, storeType = 'RESTAURANT', staffType = 'POS_STAFF' }: SidebarProps) {
  const isRetail = storeType === 'RETAIL_STORE';
  const { settings } = useStoreSettings();

  const restaurantAdminMenuItems = [
    { icon: Home, label: 'Dashboard', page: 'pos-dashboard' as Page },
    { icon: List, label: 'Order List', page: 'order-list' as Page },
    { icon: BarChart3, label: 'Reports', page: 'reports' as Page },
    { icon: Store, label: 'Store Information', page: 'store-information' as Page },
    { icon: Settings, label: 'Store Settings', page: 'store-settings' as Page },
    { icon: Tags, label: 'Categories', page: 'category-management' as Page },
    { icon: Package, label: 'Products', page: 'product-management' as Page },
    { icon: Users, label: 'User Management', page: 'admin-dashboard' as Page },
  ];

  const retailAdminMenuItems = [
    { icon: Home, label: 'Dashboard', page: 'retail-pos-dashboard' as Page },
    { icon: List, label: 'Transactions', page: 'retail-transactions' as Page },
    { icon: BarChart3, label: 'Reports', page: 'retail-reports' as Page },
    { icon: Store, label: 'Store Information', page: 'store-information' as Page },
    { icon: Settings, label: 'Store Settings', page: 'store-settings' as Page },
    { icon: Tags, label: 'Categories', page: 'category-management' as Page },
    { icon: Package, label: 'Products', page: 'product-management' as Page },
    { icon: Users, label: 'User Management', page: 'admin-dashboard' as Page },
  ];

  const restaurantStaffMenuItems = [
    { icon: Home, label: 'Dashboard', page: 'pos-dashboard' as Page },
    { icon: ShoppingCart, label: 'Create Order', page: 'create-order' as Page },
    { icon: List, label: 'Order List', page: 'order-list' as Page },
    { icon: UtensilsCrossed, label: 'Table Management', page: 'table-management' as Page },
    { icon: BarChart3, label: 'Reports', page: 'reports' as Page },
  ];

  const retailStaffMenuItems = [
    { icon: Home, label: 'Dashboard', page: 'retail-pos-dashboard' as Page },
    { icon: ShoppingBag, label: 'Sales', page: 'retail-sales' as Page },
    { icon: List, label: 'Transactions', page: 'retail-transactions' as Page },
    { icon: BarChart3, label: 'Reports', page: 'retail-reports' as Page },
  ];

  const menuItems = isAdmin
    ? (isRetail ? retailAdminMenuItems : restaurantAdminMenuItems)
    : (isRetail ? retailStaffMenuItems : restaurantStaffMenuItems);
  const visibleMenuItems = menuItems.filter((item) => item.page !== 'table-management' || settings.enable_table_management);
  const defaultTitle = isRetail ? 'Retail Store' : 'The Restaurant';
  const headerTitle = storeBrand?.name || defaultTitle;
  const userRoleLabel = isAdmin ? 'Admin' : 'POS Staff';

  return (
    <div
      className="sticky top-0 flex h-screen w-80 shrink-0 flex-col overflow-hidden text-white"
      style={{ background: 'linear-gradient(180deg, #003534 0%, #007a5e 100%)' }}
    >
      <div className="shrink-0 border-b border-white/10 px-6 pb-5 pt-6">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-10 w-12 items-center justify-center overflow-hidden bg-transparent p-1 text-[#008967]">
            {storeBrand?.logo ? (
              <img src={storeBrand.logo} alt={headerTitle} className="h-full w-full object-contain" />
            ) : isRetail ? (
              <ShoppingBag className="h-9 w-9" strokeWidth={1.6} />
            ) : (
              <UtensilsCrossed className="h-9 w-9" strokeWidth={1.6} />
            )}
          </div>
          <h2 className="truncate text-xl font-semibold tracking-tight text-white">{headerTitle}</h2>
          <p className="mt-1 text-base leading-tight text-slate-200">{userRoleLabel}</p>
        </div>
      </div>

      <nav className="min-h-0 flex-1 px-5 py-3">
        <ul className="space-y-1">
          {visibleMenuItems.map((item) => {
            const active = currentPage === item.page;
            return (
              <li key={item.page}>
                <button
                  onClick={() => onNavigate(item.page)}
                  className={`flex h-9 w-full items-center gap-3 rounded-lg border px-4 text-left transition ${
                    active
                      ? 'border-[#00a7a5]/25 text-white'
                      : 'border-transparent text-white hover:bg-[#007a5e]/15 hover:text-slate-100'
                  }`}
                  style={
                    active
                      ? { background: 'linear-gradient(135deg, #008967 0%, #007a5e 100%)', boxShadow: '0 0 18px rgba(0,167,165,0.16)' }
                      : undefined
                  }
                >
                  <span className="shrink-0">
                    <item.icon className="h-4 w-4" strokeWidth={1.8} />
                  </span>
                  <span className={`flex-1 text-[15px] ${active ? 'font-semibold' : 'font-medium'}`}>
                    {item.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="shrink-0 border-t border-white/10 px-5 py-3 text-white">
        <button
          onClick={onLogout}
          className="flex h-9 w-full items-center gap-3 rounded-lg border border-transparent px-4 text-left text-white transition hover:bg-red-500/10 hover:text-red-200"
        >
          <span className="shrink-0">
            <LogOut className="h-4 w-4" strokeWidth={1.8} />
          </span>
          <span className="flex-1 text-[15px] font-medium">
            Logout
          </span>
        </button>
      </div>
    </div>
  );
}
