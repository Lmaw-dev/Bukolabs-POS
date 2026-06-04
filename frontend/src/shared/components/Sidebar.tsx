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
  const defaultTitle = isRetail ? 'Retail POS System' : 'N&Ns POS System';
  const headerTitle = storeBrand?.name || defaultTitle;
  const userRoleLabel = isAdmin ? 'Admin' : isInventoryStaff ? 'Inventory Staff' : 'POS Staff';

  return (
    <div className="w-64 bg-sidebar text-sidebar-foreground h-screen flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-24 items-center justify-center overflow-hidden bg-transparent p-1 text-sidebar-foreground">
            {storeBrand?.logo ? (
              <img src={storeBrand.logo} alt={headerTitle} className="h-full w-full object-contain" />
            ) : isRetail ? (
              <ShoppingBag className="h-12 w-12" strokeWidth={1.6} />
            ) : (
              <Utensils className="h-12 w-12" strokeWidth={1.6} />
            )}
          </div>
          <h2 className="truncate text-xl text-sidebar-foreground">{headerTitle}</h2>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const active = currentPage === item.page;
            return (
              <li key={item.page}>
                <button
                  onClick={() => onNavigate(item.page)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 transition-all text-left"
                  style={{
                    background: active ? 'rgba(16,185,129,0.12)' : 'transparent',
                    border: active ? '1px solid rgba(16,185,129,0.2)' : '1px solid transparent',
                    color: active ? '#10b981' : '#64748b',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <span style={{ flexShrink: 0 }}>
                    <item.icon className="w-5 h-5" />
                  </span>
                  <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, flex: 1 }}>
                    {item.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="mb-3 px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-sidebar-foreground">{userName || (isAdmin ? 'Administrator' : 'Staff')}</p>
            <p className="truncate text-sm text-sidebar-foreground/70">{userRoleLabel}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left"
          style={{
            background: 'transparent',
            border: '1px solid transparent',
            color: '#64748b',
            cursor: 'pointer',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.12)';
            (e.currentTarget as HTMLElement).style.color = '#ef4444';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'transparent';
            (e.currentTarget as HTMLElement).style.color = '#64748b';
          }}
        >
          <span style={{ flexShrink: 0 }}>
            <LogOut className="w-5 h-5" />
          </span>
          <span style={{ fontSize: 13, fontWeight: 400, flex: 1 }}>
            Logout
          </span>
        </button>
      </div>
    </div>
  );
}
