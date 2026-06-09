import { useState } from 'react';
import { ChevronDown, Home, ShoppingCart, List, BarChart3, LogOut, Users, UtensilsCrossed, Store, ShoppingBag, Archive, Info, SlidersHorizontal, Tags, Package, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Page, type StoreBrand } from '../App';
import type { StaffType } from '../../auth/types/auth';
import { useStoreSettings } from '../context/StoreSettingsContext';
import { getDefaultStoreLogo } from '../utils/defaultStoreLogo';

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
    Store: false,
    Temporary: false,
  });
  const [isCollapsed, setIsCollapsed] = useState(false);

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
  const defaultLogo = getDefaultStoreLogo(storeType);
  const userRoleLabel = isAdmin ? 'Admin' : 'POS Staff';
  const closeManagementGroups = () => {
    setOpenGroups({
      Store: false,
      Temporary: false,
    });
  };

  return (
    <div
      className={`sticky top-0 flex h-screen shrink-0 flex-col overflow-hidden text-white transition-[width] duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-80'}`}
      style={{ background: 'linear-gradient(180deg, #003534 0%, #007a5e 100%)' }}
    >
      <div className={`relative shrink-0 border-b border-white/10 transition-all duration-300 ease-in-out ${isCollapsed ? 'px-3 pb-14 pt-4' : 'px-6 pb-4 pt-5'}`}>
        <button
          type="button"
          onClick={() => setIsCollapsed((value) => !value)}
          className={`absolute z-10 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-white transition hover:bg-white/15 ${
            isCollapsed ? 'bottom-3 left-1/2 -translate-x-1/2' : 'right-3 top-3'
          }`}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <PanelLeftOpen className="h-5 w-5" strokeWidth={1.8} /> : <PanelLeftClose className="h-5 w-5" strokeWidth={1.8} />}
        </button>
        <div className="text-center">
          <div className={`mx-auto flex items-center justify-center overflow-hidden bg-transparent transition-all duration-300 ease-in-out ${isCollapsed ? 'mb-0 h-10 w-10' : 'mb-2 h-16 w-16'}`}>
            <img src={storeBrand?.logo || defaultLogo} alt={headerTitle} className="h-full w-full object-contain" />
          </div>
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-14 opacity-100'}`}>
            <h2 className="truncate text-lg font-semibold tracking-tight text-white">{headerTitle}</h2>
            <p className="mt-0.5 text-sm leading-tight text-slate-200">{userRoleLabel}</p>
          </div>
        </div>
      </div>

      <nav className={`min-h-0 flex-1 overflow-y-auto py-3 transition-all duration-300 ease-in-out ${isCollapsed ? 'px-3' : 'px-5'}`}>
        <ul className="space-y-0.5">
          {visibleMenuItems.map((item) => {
            const childActive = item.children?.some((child) => child.page === currentPage) ?? false;
            const active = currentPage === item.page || childActive;
            return (
              <li key={item.page ?? item.label}>
                <button
                  onClick={() => {
                    if (item.children) {
                      setOpenGroups((current) => ({
                        Store: item.label === 'Store' ? !current.Store : false,
                        Temporary: item.label === 'Temporary' ? !current.Temporary : false,
                      }));
                      return;
                    }

                    closeManagementGroups();
                    item.page && onNavigate(item.page);
                  }}
                  className={`flex h-[52px] w-full items-center rounded-lg border transition ${
                    isCollapsed ? 'justify-center gap-0 px-0' : 'gap-4 px-4 text-left'
                  } ${
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
                    <item.icon className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <span className={`overflow-hidden whitespace-nowrap text-base transition-all duration-300 ease-in-out ${isCollapsed ? 'w-0 opacity-0' : 'flex-1 opacity-100'} ${active ? 'font-semibold' : 'font-medium'}`}>
                    {!isCollapsed && item.label}
                  </span>
                  {item.children && !isCollapsed && (
                    <ChevronDown className={`h-4 w-4 transition ${openGroups[item.label] ? 'rotate-180' : ''}`} strokeWidth={1.8} />
                  )}
                </button>
                {item.children && openGroups[item.label] && (
                  <ul className={`space-y-0.5 py-1 transition-all duration-300 ease-in-out ${isCollapsed ? 'pl-0' : 'pl-8'}`}>
                    {item.children.map((child) => {
                      const childIsActive = currentPage === child.page;
                      return (
                        <li key={child.page}>
                          <button
                            onClick={() => {
                              onNavigate(child.page);
                            }}
                            className={`flex h-10 w-full items-center rounded-md transition ${
                              isCollapsed ? 'justify-center gap-0 px-0' : 'gap-4 px-4 text-left'
                            } ${
                              childIsActive ? 'text-white' : 'text-slate-200 hover:text-white'
                            }`}
                          >
                            <child.icon className={`h-4 w-4 shrink-0 ${childIsActive ? 'text-[#b5fff1]' : 'text-slate-300/70'}`} strokeWidth={1.8} />
                            <span className={`truncate text-sm font-medium transition-all duration-300 ease-in-out ${isCollapsed ? 'w-0 opacity-0' : 'opacity-100'}`}>{!isCollapsed && child.label}</span>
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
                          setOpenGroups((current) => ({
                            Store: item.label === 'Store' ? !current.Store : false,
                            Temporary: item.label === 'Temporary' ? !current.Temporary : false,
                          }));
                          return;
                        }

                        closeManagementGroups();
                        item.page && onNavigate(item.page);
                      }}
                      className={`flex h-[52px] w-full items-center rounded-lg border transition ${
                        isCollapsed ? 'justify-center gap-0 px-0' : 'gap-4 px-4 text-left'
                      } ${
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
                        <item.icon className="h-5 w-5" strokeWidth={1.8} />
                      </span>
                      <span className={`overflow-hidden whitespace-nowrap text-base transition-all duration-300 ease-in-out ${isCollapsed ? 'w-0 opacity-0' : 'flex-1 opacity-100'} ${active ? 'font-semibold' : 'font-medium'}`}>
                        {!isCollapsed && item.label}
                      </span>
                      {item.children && !isCollapsed && (
                        <ChevronDown className={`h-4 w-4 transition ${openGroups[item.label] ? 'rotate-180' : ''}`} strokeWidth={1.8} />
                      )}
                    </button>
                    {item.children && openGroups[item.label] && (
                      <ul className={`space-y-0.5 py-1 transition-all duration-300 ease-in-out ${isCollapsed ? 'pl-0' : 'pl-8'}`}>
                        {item.children.map((child) => {
                          const childIsActive = currentPage === child.page;
                          return (
                            <li key={child.page}>
                              <button
                                    onClick={() => {
                                      onNavigate(child.page);
                                    }}
                                className={`flex h-10 w-full items-center rounded-md transition ${
                                  isCollapsed ? 'justify-center gap-0 px-0' : 'gap-4 px-4 text-left'
                                } ${
                                  childIsActive ? 'text-white' : 'text-slate-200 hover:text-white'
                                }`}
                              >
                                <child.icon className={`h-4 w-4 shrink-0 ${childIsActive ? 'text-[#b5fff1]' : 'text-slate-300/70'}`} strokeWidth={1.8} />
                                <span className={`truncate text-sm font-medium transition-all duration-300 ease-in-out ${isCollapsed ? 'w-0 opacity-0' : 'opacity-100'}`}>{!isCollapsed && child.label}</span>
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

      <div className={`shrink-0 border-t border-white/10 py-2 text-white transition-all duration-300 ease-in-out ${isCollapsed ? 'px-3' : 'px-5'}`}>
        <button
          onClick={onLogout}
          className={`flex h-[52px] w-full items-center rounded-lg border border-transparent text-white transition hover:bg-red-500/10 hover:text-red-200 ${
            isCollapsed ? 'justify-center gap-0 px-0' : 'gap-4 px-4 text-left'
          }`}
        >
          <span className="shrink-0">
            <LogOut className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <span className={`overflow-hidden whitespace-nowrap text-base font-medium transition-all duration-300 ease-in-out ${isCollapsed ? 'w-0 opacity-0' : 'flex-1 opacity-100'}`}>
            {!isCollapsed && 'Logout'}
          </span>
        </button>
      </div>
    </div>
  );
}
