import { Boxes } from 'lucide-react';
import { Sidebar } from '../../shared/components/Sidebar';
import { Page, type StoreBrand } from '../../shared/App';
import type { StaffType, StoreType } from '../../auth/types/auth';

interface InventoryDashboardProps {
  onLogout: () => void;
  onNavigate: (page: Page) => void;
  storeBrand?: StoreBrand;
  userName?: string | null;
  storeType?: StoreType;
  staffType?: StaffType;
}

export function InventoryDashboard({ onLogout, onNavigate, storeBrand, userName, storeType, staffType = 'INVENTORY_STAFF' }: InventoryDashboardProps) {
  return (
    <div className="flex h-screen">
      <Sidebar
        currentPage="inventory-dashboard"
        onNavigate={onNavigate}
        onLogout={onLogout}
        storeBrand={storeBrand}
        userName={userName}
        storeType={storeType}
        staffType={staffType}
      />

      <div className="flex-1 overflow-auto bg-background">
        <main className="p-8">
          <div>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Boxes className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-primary">Inventory Dashboard</h1>
                <p className="text-sm text-muted-foreground">Inventory workflows can be added here next.</p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <p className="text-sm text-muted-foreground">Store</p>
              <h2 className="mt-2 text-xl text-primary">{storeBrand?.name ?? 'Inventory Store'}</h2>
              <p className="mt-1 text-sm text-muted-foreground">Signed in as {userName ?? 'Inventory Staff'}</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
