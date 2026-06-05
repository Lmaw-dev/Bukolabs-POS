import { useState } from 'react';
import { ChevronDown, Home, ShoppingCart, List, BarChart3, LogOut, Users, UtensilsCrossed, Store, ShoppingBag, Archive, Info, SlidersHorizontal, Tags, Package } from 'lucide-react';
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

type MenuItem = {
  icon: typeof Home;
  label: string;
  page?: Page;
  children?: Array<{
    icon: typeof Home;
    label: string;
    page: Page;
  }>;
};

export function Sidebar({ currentPage, onNavigate, onLogout, isAdmin = false, storeBrand, userName, storeType = 'RESTAURANT', staffType = 'POS_STAFF' }: SidebarProps) {
  const isRetail = storeType === 'RETAIL_STORE';
  const { settings } = useStoreSettings();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Store: true,
    Temporary: true,
  });

  const storeItems = [
    { icon: Info, label: 'Store Information', page: 'store-information' as Page },
    { icon: SlidersHorizontal, label: 'Store Settings', page: 'store-settings' as Page },
  ];

  const temporaryItems = [
    { icon: Tags, label: 'Categories', page: 'category-management' as Page },
    { icon: Package, label: 'Products', page: 'product-management' as Page },
    { icon: UtensilsCrossed, label: 'Ingredients', page: 'ingredient-management' as Page },
  ];
  const retailTemporaryItems = temporaryItems.filter((item) => item.page !== 'ingredient-management');

  const restaurantAdminMenuItems: MenuItem[] = [
    { icon: Home, label: 'Dashboard', page: 'pos-dashboard' as Page },
    { icon: Users, label: 'Staff Accounts', page: 'admin-dashboard' as Page },
    { icon: List, label: 'Transaction', page: 'order-list' as Page },
    { icon: BarChart3, label: 'Reports', page: 'reports' as Page },
  ];

  const retailAdminMenuItems: MenuItem[] = [
    { icon: Home, label: 'Dashboard', page: 'retail-pos-dashboard' as Page },
    { icon: Users, label: 'Staff Accounts', page: 'admin-dashboard' as Page },
    { icon: List, label: 'Transactions', page: 'retail-transactions' as Page },
    { icon: BarChart3, label: 'Reports', page: 'retail-reports' as Page },
  ];

  const restaurantStaffMenuItems: MenuItem[] = [
    { icon: Home, label: 'Dashboard', page: 'pos-dashboard' as Page },
    { icon: ShoppingCart, label: 'Create Order', page: 'create-order' as Page },
    { icon: List, label: 'Transaction', page: 'order-list' as Page },
    { icon: UtensilsCrossed, label: 'Tables', page: 'table-management' as Page },
    { icon: BarChart3, label: 'Reports', page: 'reports' as Page },
  ];

  const retailStaffMenuItems: MenuItem[] = [
    { icon: Home, label: 'Dashboard', page: 'retail-pos-dashboard' as Page },
    { icon: ShoppingBag, label: 'Create Order', page: 'retail-sales' as Page },
    { icon: List, label: 'Transactions', page: 'retail-transactions' as Page },
    { icon: BarChart3, label: 'Reports', page: 'retail-reports' as Page },
  ];

  const menuItems = isAdmin
    ? (isRetail ? retailAdminMenuItems : restaurantAdminMenuItems)
    : (isRetail ? retailStaffMenuItems : restaurantStaffMenuItems);
  const managementItems: MenuItem[] = isAdmin
    ? [
        { icon: Store, label: 'Store', children: storeItems },
        { icon: Archive, label: 'Temporary', children: isRetail ? retailTemporaryItems : temporaryItems },
      ]
    : [];
  const visibleMenuItems = menuItems.filter((item) => item.page !== 'table-management' || settings.enable_table_management);
  const defaultTitle = isRetail ? 'Retail Store' : 'The Restaurant';
  const headerTitle = storeBrand?.name || defaultTitle;
  const userRoleLabel = isAdmin ? 'Admin' : 'POS Staff';

  return (
    <div
      className="sticky top-0 flex h-screen w-80 shrink-0 flex-col overflow-hidden text-white"
      style={{ background: 'linear-gradient(180deg, #003534 0%, #007a5e 100%)' }}
    >
      <div className="shrink-0 border-b border-white/10 px-6 pb-4 pt-5">
        <div className="text-center">
          <div className="mx-auto mb-2 flex h-9 w-12 items-center justify-center overflow-hidden bg-transparent p-1 text-[#008967]">
            {storeBrand?.logo ? (
              <img src={storeBrand.logo} alt={headerTitle} className="h-full w-full object-contain" />
            ) : isRetail ? (
              <ShoppingBag className="h-9 w-9" strokeWidth={1.6} />
            ) : (
              <UtensilsCrossed className="h-9 w-9" strokeWidth={1.6} />
            )}
          </div>
          <h2 className="truncate text-lg font-semibold tracking-tight text-white">{headerTitle}</h2>
          <p className="mt-0.5 text-sm leading-tight text-slate-200">{userRoleLabel}</p>
        </div>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
        <ul className="space-y-0.5">
          {visibleMenuItems.map((item) => {
            const childActive = item.children?.some((child) => child.page === currentPage) ?? false;
            const active = currentPage === item.page || childActive;
            return (
              <li key={item.page ?? item.label}>
                <button
                  onClick={() => {
                    if (item.children) {
                      setOpenGroups((current) => ({ ...current, [item.label]: !current[item.label] }));
                      return;
                    }
                    item.page && onNavigate(item.page);
                  }}
                  className={`flex h-8 w-full items-center gap-3 rounded-lg border px-4 text-left transition ${
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
                  <span className={`flex-1 text-[14px] ${active ? 'font-semibold' : 'font-medium'}`}>
                    {item.label}
                  </span>
                  {item.children && (
                    <ChevronDown className={`h-4 w-4 transition ${openGroups[item.label] ? 'rotate-180' : ''}`} strokeWidth={1.8} />
                  )}
                </button>
                {item.children && openGroups[item.label] && (
                  <ul className="space-y-0.5 py-1 pl-8">
                    {item.children.map((child) => {
                      const childIsActive = currentPage === child.page;
                      return (
                        <li key={child.page}>
                          <button
                            onClick={() => onNavigate(child.page)}
                            className={`flex h-7 w-full items-center gap-3 rounded-md px-3 text-left transition ${
                              childIsActive ? 'text-white' : 'text-slate-200 hover:text-white'
                            }`}
                          >
                            <child.icon className={`h-3.5 w-3.5 shrink-0 ${childIsActive ? 'text-[#b5fff1]' : 'text-slate-300/70'}`} strokeWidth={1.8} />
                            <span className="truncate text-[13px] font-medium">{child.label}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>

        {managementItems.length > 0 && (
          <div className="mt-2">
            <ul className="space-y-0.5">
              {managementItems.map((item) => {
                const childActive = item.children?.some((child) => child.page === currentPage) ?? false;
                const active = currentPage === item.page || childActive;
                return (
                  <li key={item.page ?? item.label}>
                    <button
                      onClick={() => {
                        if (item.children) {
                          setOpenGroups((current) => ({ ...current, [item.label]: !current[item.label] }));
                          return;
                        }
                        item.page && onNavigate(item.page);
                      }}
                      className={`flex h-8 w-full items-center gap-3 rounded-lg border px-4 text-left transition ${
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
                      <span className={`flex-1 text-[14px] ${active ? 'font-semibold' : 'font-medium'}`}>
                        {item.label}
                      </span>
                      {item.children && (
                        <ChevronDown className={`h-4 w-4 transition ${openGroups[item.label] ? 'rotate-180' : ''}`} strokeWidth={1.8} />
                      )}
                    </button>
                    {item.children && openGroups[item.label] && (
                      <ul className="space-y-0.5 py-1 pl-8">
                        {item.children.map((child) => {
                          const childIsActive = currentPage === child.page;
                          return (
                            <li key={child.page}>
                              <button
                                onClick={() => onNavigate(child.page)}
                                className={`flex h-7 w-full items-center gap-3 rounded-md px-3 text-left transition ${
                                  childIsActive ? 'text-white' : 'text-slate-200 hover:text-white'
                                }`}
                              >
                                <child.icon className={`h-3.5 w-3.5 shrink-0 ${childIsActive ? 'text-[#b5fff1]' : 'text-slate-300/70'}`} strokeWidth={1.8} />
                                <span className="truncate text-[13px] font-medium">{child.label}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </nav>

      <div className="shrink-0 border-t border-white/10 px-5 py-2 text-white">
        <div className="mb-1 px-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight text-white">{userName || (isAdmin ? 'Administrator' : 'Staff')}</p>
            <p className="truncate text-sm leading-tight text-slate-200">{userRoleLabel}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex h-8 w-full items-center gap-3 rounded-lg border border-transparent px-4 text-left text-white transition hover:bg-red-500/10 hover:text-red-200"
        >
          <span className="shrink-0">
            <LogOut className="h-4 w-4" strokeWidth={1.8} />
          </span>
          <span className="flex-1 text-[14px] font-medium">
            Logout
          </span>
        </button>
      </div>
    </div>
  );
}
