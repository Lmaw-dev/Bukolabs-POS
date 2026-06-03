interface RetailDashboardProps {
  title?: string;
  roleLabel?: string;
  currentUser?: {
    full_name: string;
    email: string;
    role: string;
    store_type: string | null;
    staff_type?: string | null;
    store_name: string | null;
  } | null;
  onLogout: () => void;
}

export function RetailDashboard({ title = 'Retail Dashboard', roleLabel = 'Retail Admin', currentUser, onLogout }: RetailDashboardProps) {
  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-100 md:p-10">
      <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-sky-300/80">{roleLabel}</p>
            <h1 className="mt-2 text-3xl font-semibold">{title}</h1>
            <p className="mt-2 text-xl font-semibold text-sky-200">Retail Module Coming Soon</p>
            <p className="mt-2 text-sm text-slate-300">This placeholder is shown while the retail UI is being built.</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Sign Out
          </button>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <p className="text-sm text-slate-400">User</p>
            <p className="mt-2 font-semibold">{currentUser?.full_name ?? 'Retail User'}</p>
            <p className="text-sm text-slate-300">{currentUser?.email ?? 'No email available'}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
            <p className="text-sm text-slate-400">Access</p>
            <p className="mt-2 font-semibold">{currentUser?.role ?? roleLabel}</p>
            <p className="text-sm text-slate-300">{currentUser?.store_type ?? 'RETAIL_STORE'} {currentUser?.staff_type ? `- ${currentUser.staff_type}` : ''}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
