import { Home, ShoppingCart, List, BarChart3, LogOut, Users, UtensilsCrossed } from 'lucide-react';
import { Page } from '../App';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  isAdmin?: boolean;
}

export function Sidebar({ currentPage, onNavigate, onLogout, isAdmin = false }: SidebarProps) {
  const adminMenuItems = [
    { icon: Home, label: 'Dashboard', page: 'pos-dashboard' as Page },
    { icon: List, label: 'Order List', page: 'order-list' as Page },
    { icon: BarChart3, label: 'Reports', page: 'reports' as Page },
    { icon: Users, label: 'User Management', page: 'admin-dashboard' as Page },
  ];

  const staffMenuItems = [
    { icon: Home, label: 'Dashboard', page: 'pos-dashboard' as Page },
    { icon: ShoppingCart, label: 'Create Order', page: 'create-order' as Page },
    { icon: List, label: 'Order List', page: 'order-list' as Page },
    { icon: UtensilsCrossed, label: 'Table Management', page: 'table-management' as Page },
    { icon: BarChart3, label: 'Reports', page: 'reports' as Page },
  ];

  const menuItems = isAdmin ? adminMenuItems : staffMenuItems;

  return (
    <div className="w-64 bg-sidebar text-sidebar-foreground h-screen flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <h2 className="text-xl text-sidebar-foreground">N&Ns POS System</h2>
        <p className="text-sm text-sidebar-foreground/70 mt-1">
          {isAdmin ? 'Admin Panel' : 'Staff Panel'}
        </p>
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

      <div className="p-4 border-t border-sidebar-border">
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
