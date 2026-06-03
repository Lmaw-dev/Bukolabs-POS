interface InventoryDashboardProps {
  onLogout: () => void;
}

export function InventoryDashboard({ onLogout }: InventoryDashboardProps) {
  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-100 md:p-10">
      <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-amber-300/80">Inventory Staff</p>
            <h1 className="mt-2 text-3xl font-semibold">Inventory Dashboard</h1>
            <p className="mt-2 text-sm text-slate-300">Inventory workflows can be added here next.</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}