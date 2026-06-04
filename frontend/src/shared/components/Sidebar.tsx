import { Home, ShoppingCart, List, BarChart3, LogOut, Users, UtensilsCrossed, Store, Utensils, ShoppingBag, Boxes } from 'lucide-react';
import { Page, type StoreBrand } from '../App';
import type { StaffType } from '../../auth/types/auth';

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
  const isInventoryStaff = !isAdmin && staffType === 'INVENTORY_STAFF';

  const restaurantAdminMenuItems = [
    { icon: Home, label: 'Dashboard', page: 'pos-dashboard' as Page },
    { icon: List, label: 'Order List', page: 'order-list' as Page },
    { icon: BarChart3, label: 'Reports', page: 'reports' as Page },
    { icon: Store, label: 'Store Information', page: 'store-information' as Page },
    { icon: Users, label: 'User Management', page: 'admin-dashboard' as Page },
  ];

  const retailAdminMenuItems = [
    { icon: Home, label: 'Dashboard', page: 'retail-pos-dashboard' as Page },
    { icon: List, label: 'Transactions', page: 'retail-transactions' as Page },
    { icon: BarChart3, label: 'Reports', page: 'retail-reports' as Page },
    { icon: Store, label: 'Store Information', page: 'store-information' as Page },
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

  const restaurantInventoryMenuItems = [
    { icon: Boxes, label: 'Inventory Dashboard', page: 'inventory-dashboard' as Page },
  ];

  const retailInventoryMenuItems = [
    { icon: Boxes, label: 'Inventory Dashboard', page: 'retail-inventory-dashboard' as Page },
  ];

  const menuItems = isAdmin
    ? (isRetail ? retailAdminMenuItems : restaurantAdminMenuItems)
    : isInventoryStaff
      ? (isRetail ? retailInventoryMenuItems : restaurantInventoryMenuItems)
      : (isRetail ? retailStaffMenuItems : restaurantStaffMenuItems);
  const defaultTitle = isRetail ? 'Retail Store' : 'The Restaurant';
  const headerTitle = storeBrand?.name || defaultTitle;
  const userRoleLabel = isAdmin ? 'Admin' : isInventoryStaff ? 'Inventory Staff' : 'POS Staff';

  return (
    <div className="flex h-screen w-80 shrink-0 flex-col bg-[#111827] text-[#f8fafc]">
      <div className="border-b border-white/10 px-6 pb-8 pt-12">
        <div className="text-center">
          <div className="mx-auto mb-8 flex h-20 w-24 items-center justify-center overflow-hidden bg-transparent p-1 text-slate-600">
            {storeBrand?.logo ? (
              <img src={storeBrand.logo} alt={headerTitle} className="h-full w-full object-contain" />
            ) : isRetail ? (
              <ShoppingBag className="h-16 w-16" strokeWidth={1.6} />
            ) : (
              <UtensilsCrossed className="h-16 w-16" strokeWidth={1.6} />
            )}
          </div>
          <h2 className="truncate text-2xl font-semibold tracking-tight text-white">{headerTitle}</h2>
        </div>
      </div>

      <nav className="flex-1 px-5 py-7">
        <ul className="space-y-4">
          {menuItems.map((item) => {
            const active = currentPage === item.page;
            return (
              <li key={item.page}>
                <button
                  onClick={() => onNavigate(item.page)}
                  className={`flex h-[52px] w-full items-center gap-4 rounded-lg border px-4 text-left transition ${
                    active
                      ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400'
                      : 'border-transparent text-slate-500 hover:bg-white/[0.04] hover:text-slate-300'
                  }`}
                >
                  <span className="shrink-0">
                    <item.icon className="h-6 w-6" strokeWidth={1.8} />
                  </span>
                  <span className={`flex-1 text-base ${active ? 'font-semibold' : 'font-medium'}`}>
                    {item.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-white/10 px-5 py-8">
        <div className="mb-8 px-4">
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold leading-tight text-white">{userName || (isAdmin ? 'Administrator' : 'Staff')}</p>
            <p className="truncate text-lg leading-tight text-slate-200">{userRoleLabel}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex h-[52px] w-full items-center gap-4 rounded-lg border border-transparent px-4 text-left text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
        >
          <span className="shrink-0">
            <LogOut className="h-6 w-6" strokeWidth={1.8} />
          </span>
          <span className="flex-1 text-base font-medium">
            Logout
          </span>
        </button>
      </div>
    </div>
  );
}
