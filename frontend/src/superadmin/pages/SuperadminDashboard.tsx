import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { AuthenticatedUser } from '../../auth/types/auth';
import { getApiBaseUrl } from '../../auth/services/auth';
import {
  CalendarDays,
  ChevronRight,
  Eye,
  EyeOff,
  LogOut,
  MoreHorizontal,
  Pencil,
  Plus,
  Store,
  StoreIcon,
  Trash2,
  UserPlus,
  Utensils,
} from 'lucide-react';

interface AdminSummary {
  id: number;
  full_name: string;
  email: string;
  role: string;
  store_id: number | null;
  store_type: string | null;
  store_name: string | null;
}

interface SuperadminDashboardProps {
  currentUser: AuthenticatedUser | null;
  onLogout: () => void;
}

type StoreFilter = 'ALL' | 'RETAIL_STORE' | 'RESTAURANT';
type DashboardSection = 'stores' | 'admins';

const storeTypeLabel = (storeType: string | null | undefined) =>
  storeType === 'RETAIL_STORE' ? 'Retail Store' : storeType === 'RESTAURANT' ? 'Restaurant' : 'Unassigned';

const storeTypeStyles = (storeType: string | null | undefined) =>
  storeType === 'RETAIL_STORE'
    ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
    : storeType === 'RESTAURANT'
      ? 'border-violet-100 bg-violet-50 text-violet-700'
      : 'border-slate-100 bg-slate-50 text-slate-500';

const formatStoreCount = (count: number, total: number) => (total === 0 ? '0 (0%)' : `${count} (${((count / total) * 100).toFixed(1)}%)`);

export function SuperadminDashboard({ currentUser, onLogout }: SuperadminDashboardProps) {
  const [admins, setAdmins] = useState<AdminSummary[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminSummary | null>(null);
  const [deletingAdminId, setDeletingAdminId] = useState<number | null>(null);
  const [createError, setCreateError] = useState('');
  const [createdPassword, setCreatedPassword] = useState('');
  const [formFullName, setFormFullName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formStoreType, setFormStoreType] = useState<'RESTAURANT' | 'RETAIL_STORE'>('RESTAURANT');
  const [storeFilter, setStoreFilter] = useState<StoreFilter>('ALL');
  const [adminFilter, setAdminFilter] = useState<StoreFilter>('ALL');
  const [visiblePassword, setVisiblePassword] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<DashboardSection>('stores');

  useEffect(() => {
    const loadAdmins = async () => {
      try {
        const response = await fetch(`${getApiBaseUrl()}/superadmin/admins`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message ?? 'Unable to load admin accounts.');
        }

        setAdmins(data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load admin accounts.');
      } finally {
        setLoading(false);
      }
    };

    void loadAdmins();
  }, []);

  const stores = useMemo(() => {
    const byStore = new Map<number | string, AdminSummary>();

    admins.forEach((admin) => {
      const key = admin.store_id ?? `admin-${admin.id}`;
      if (!byStore.has(key)) {
        byStore.set(key, admin);
      }
    });

    return Array.from(byStore.values());
  }, [admins]);

  const retailStores = stores.filter((store) => store.store_type === 'RETAIL_STORE');
  const restaurantStores = stores.filter((store) => store.store_type === 'RESTAURANT');
  const filteredStores = stores.filter((store) => storeFilter === 'ALL' || store.store_type === storeFilter);
  const filteredAdmins = admins.filter((admin) => adminFilter === 'ALL' || admin.store_type === adminFilter);
  const retailAdmins = admins.filter((admin) => admin.store_type === 'RETAIL_STORE').length;
  const restaurantAdmins = admins.filter((admin) => admin.store_type === 'RESTAURANT').length;
  const retailPercent = stores.length === 0 ? 0 : Math.round((retailStores.length / stores.length) * 100);

  const handleCreateAdmin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreating(true);
    setCreateError('');
    setCreatedPassword('');

    try {
      const response = await fetch(`${getApiBaseUrl()}/superadmin/admins${editingAdmin ? `/${editingAdmin.id}` : ''}`, {
        method: editingAdmin ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: formFullName,
          email: formEmail,
          password: formPassword || undefined,
          store_type: formStoreType,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message ?? 'Unable to save admin account.');
      }

      const wasEditing = Boolean(editingAdmin);

      setAdmins((current) => (wasEditing ? current.map((admin) => (admin.id === data.id ? data : admin)) : [...current, data.user]));
      if (!wasEditing) {
        setCreatedPassword(data.temporary_password || formPassword);
      }
      setEditingAdmin(null);
      setFormFullName('');
      setFormEmail('');
      setFormPassword('');
      setFormStoreType('RESTAURANT');
      setVisiblePassword(false);
      setAdminModalOpen(false);
    } catch (createAdminError) {
      setCreateError(createAdminError instanceof Error ? createAdminError.message : 'Unable to save admin account.');
    } finally {
      setCreating(false);
    }
  };

  const handleEditAdmin = (admin: AdminSummary) => {
    setEditingAdmin(admin);
    setFormFullName(admin.full_name);
    setFormEmail(admin.email);
    setFormPassword('');
    setFormStoreType(admin.store_type === 'RETAIL_STORE' ? 'RETAIL_STORE' : 'RESTAURANT');
    setCreateError('');
    setCreatedPassword('');
    setAdminModalOpen(true);
  };

  const handleOpenCreateAdmin = () => {
    setEditingAdmin(null);
    setFormFullName('');
    setFormEmail('');
    setFormPassword('');
    setFormStoreType('RESTAURANT');
    setCreateError('');
    setCreatedPassword('');
    setVisiblePassword(false);
    setAdminModalOpen(true);
  };

  const handleCancelEdit = () => {
    setEditingAdmin(null);
    setFormFullName('');
    setFormEmail('');
    setFormPassword('');
    setFormStoreType('RESTAURANT');
    setCreateError('');
    setVisiblePassword(false);
    setAdminModalOpen(false);
  };

  const handleDeleteAdmin = async (admin: AdminSummary) => {
    if (!window.confirm(`Delete ${admin.full_name}?`)) {
      return;
    }

    setDeletingAdminId(admin.id);
    setError('');

    try {
      const response = await fetch(`${getApiBaseUrl()}/superadmin/admins/${admin.id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message ?? 'Unable to delete admin account.');
      }

      setAdmins((current) => current.filter((item) => item.id !== admin.id));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete admin account.');
    } finally {
      setDeletingAdminId(null);
    }
  };

  const summaryCards = [
    {
      title: 'Total Stores',
      value: stores.length,
      detail: `${retailStores.length} Retail - ${restaurantStores.length} Restaurant`,
      link: 'View all stores',
      icon: StoreIcon,
      tone: 'blue',
      onClick: () => setStoreFilter('ALL'),
    },
    {
      title: 'Total Admin Accounts',
      value: admins.length,
      detail: `${retailAdmins} Retail - ${restaurantAdmins} Restaurant`,
      link: 'View all admin accounts',
      icon: UserPlus,
      tone: 'green',
      onClick: () => setAdminFilter('ALL'),
    },
    {
      title: 'Retail Stores',
      value: retailStores.length,
      detail: ' ',
      link: 'View retail stores',
      icon: Store,
      tone: 'violet',
      onClick: () => setStoreFilter('RETAIL_STORE'),
    },
    {
      title: 'Restaurant Stores',
      value: restaurantStores.length,
      detail: ' ',
      link: 'View restaurant stores',
      icon: Utensils,
      tone: 'orange',
      onClick: () => setStoreFilter('RESTAURANT'),
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a]">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-80 flex-col overflow-y-auto bg-[#111827] text-white">
        <div className="border-b border-white/10 px-6 pb-8 pt-12">
          <div className="text-center">
            <div className="mx-auto mb-8 flex h-20 w-24 items-center justify-center text-slate-600">
              <StoreIcon className="h-16 w-16" strokeWidth={1.6} />
            </div>
            <h1 className="truncate text-2xl font-semibold tracking-tight text-white">Unified POS</h1>
            <p className="mt-1 text-lg leading-tight text-slate-200">Super Admin</p>
          </div>
        </div>

        <nav className="flex-1 px-5 py-7">
          <button
            type="button"
            onClick={() => {
              setActiveSection('stores');
              setStoreFilter('ALL');
            }}
            className={`mb-4 flex h-[52px] w-full items-center gap-4 rounded-lg border px-4 text-left transition ${
              activeSection === 'stores'
                ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400'
                : 'border-transparent text-slate-500 hover:bg-white/[0.04] hover:text-slate-300'
            }`}
          >
            <StoreIcon className="h-6 w-6 shrink-0" strokeWidth={1.8} />
            <span className={`flex-1 text-base ${activeSection === 'stores' ? 'font-semibold' : 'font-medium'}`}>Stores</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveSection('admins');
              setAdminFilter('ALL');
            }}
            className={`flex h-[52px] w-full items-center gap-4 rounded-lg border px-4 text-left transition ${
              activeSection === 'admins'
                ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400'
                : 'border-transparent text-slate-500 hover:bg-white/[0.04] hover:text-slate-300'
            }`}
          >
            <UserPlus className="h-6 w-6 shrink-0" strokeWidth={1.8} />
            <span className={`flex-1 text-base ${activeSection === 'admins' ? 'font-semibold' : 'font-medium'}`}>Admin Accounts</span>
          </button>
        </nav>

        <div className="border-t border-white/10 px-5 py-8">
          <div className="mb-8 px-4">
            <p className="truncate text-lg font-semibold leading-tight text-white">{currentUser?.full_name ?? 'Super Admin'}</p>
            <p className="truncate text-lg leading-tight text-slate-200">Super Admin</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="flex h-[52px] w-full items-center gap-4 rounded-lg border border-transparent px-4 text-left text-slate-500 transition hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-6 w-6 shrink-0" strokeWidth={1.8} />
            <span className="flex-1 text-base font-medium">Logout</span>
          </button>
        </div>
      </aside>

      <main className="ml-80 min-h-screen min-w-0">
        {activeSection === 'stores' && (
          <header className="flex min-h-[96px] items-center justify-between border-b border-slate-200 bg-white px-8 py-5">
            <div>
              <h2 className="text-[26px] font-extrabold leading-tight tracking-tight text-[#020617]">Store Management</h2>
              <p className="mt-1 text-base text-[#64748b]">Manage stores and admin accounts for the system.</p>
            </div>
            <div className="flex items-center gap-5">
              <button type="button" className="flex h-10 items-center gap-3 rounded-md border border-slate-200 bg-white px-4 text-base text-[#0f172a]">
                May 31, 2026
                <CalendarDays className="h-4 w-4 text-slate-500" />
              </button>
            </div>
          </header>
        )}

        <div className={`space-y-6 ${activeSection === 'admins' ? 'p-10' : 'p-8'}`}>
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {createdPassword && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Admin created. Login password: {createdPassword}
            </div>
          )}

          {activeSection === 'stores' && (
            <>
              <section className="grid gap-5 xl:grid-cols-4">
                {summaryCards.map((card) => {
                  const Icon = card.icon;
                  const tone =
                    card.tone === 'blue'
                      ? 'bg-blue-50 text-blue-600'
                      : card.tone === 'green'
                        ? 'bg-emerald-50 text-emerald-600'
                        : card.tone === 'violet'
                          ? 'bg-violet-50 text-violet-600'
                          : 'bg-orange-50 text-orange-500';

                  return (
                    <article key={card.title} className="min-h-[178px] rounded-lg border border-slate-200 bg-white p-6 shadow-md">
                      <div className="flex items-start gap-5">
                        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${tone}`}>
                          <Icon className="h-7 w-7" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-base font-bold text-[#334155]">{card.title}</p>
                          <p className="mt-2 text-[32px] font-extrabold leading-none text-[#020617]">{card.value}</p>
                          <p className="mt-2 min-h-5 text-base text-[#64748b]">{card.detail}</p>
                        </div>
                      </div>
                      <button type="button" onClick={card.onClick} className="mt-6 text-base font-bold text-[#0b5cff] hover:text-blue-700">
                        {card.link}
                      </button>
                    </article>
                  );
                })}
              </section>

              <section className="grid gap-6 xl:grid-cols-[minmax(0,1.85fr)_minmax(360px,1fr)]">
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-md">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <h3 className="text-xl font-extrabold text-[#0f172a]">Stores Overview</h3>
                    <select
                      value={storeFilter}
                      onChange={(event) => setStoreFilter(event.target.value as StoreFilter)}
                      className="h-10 rounded-md border border-slate-200 bg-white px-4 text-base font-medium text-[#334155] outline-none focus:border-blue-400"
                    >
                      <option value="ALL">All Store Types</option>
                      <option value="RETAIL_STORE">Retail Store</option>
                      <option value="RESTAURANT">Restaurant</option>
                    </select>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left text-sm">
                      <thead className="border-y border-slate-200 bg-slate-50 text-xs font-bold text-[#475569]">
                        <tr>
                          <th className="px-3 py-3">Store Name</th>
                          <th className="px-3 py-3">Store Type</th>
                          <th className="px-3 py-3">Admin Name</th>
                          <th className="px-3 py-3">Status</th>
                          <th className="px-3 py-3">Date Created</th>
                          <th className="px-3 py-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {loading ? (
                          <tr>
                            <td colSpan={6} className="px-3 py-8 text-center text-slate-500">Loading stores...</td>
                          </tr>
                        ) : filteredStores.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-3 py-8 text-center text-slate-500">No stores match this filter.</td>
                          </tr>
                        ) : (
                          filteredStores.slice(0, 6).map((store) => (
                            <tr key={`${store.store_id ?? store.id}-store`} className="text-slate-700">
                              <td className="px-3 py-3 font-medium text-[#0f172a]">{store.store_name ?? `${store.full_name}'s Store`}</td>
                              <td className="px-3 py-3">
                                <span className={`inline-flex rounded px-2.5 py-1 text-xs font-medium ${storeTypeStyles(store.store_type)}`}>
                                  {storeTypeLabel(store.store_type)}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-[#475569]">{store.full_name}</td>
                              <td className="px-3 py-3">
                                <span className="inline-flex rounded bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">Active</span>
                              </td>
                              <td className="px-3 py-3 text-[#64748b]">May 31, 2026</td>
                              <td className="px-3 py-3">
                                <div className="flex justify-end">
                                  <button type="button" onClick={() => handleEditAdmin(store)} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900" title="View or edit admin">
                                    <Eye className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm text-[#64748b]">
                    <span>Showing {filteredStores.length === 0 ? 0 : 1} to {Math.min(6, filteredStores.length)} of {stores.length} stores</span>
                    <div className="flex items-center gap-2">
                      <button type="button" className="h-8 w-8 rounded-md bg-blue-600 text-sm font-semibold text-white">1</button>
                      <button type="button" className="h-8 w-8 rounded-md text-sm font-semibold text-slate-600 hover:bg-slate-100">2</button>
                      <button type="button" className="h-8 w-8 rounded-md text-slate-600 hover:bg-slate-100">
                        <ChevronRight className="mx-auto h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-md">
                  <h3 className="text-xl font-extrabold text-[#0f172a]">Store Type Distribution</h3>
                  <div className="mt-8 flex items-center justify-center gap-8">
                    <div
                      className="relative h-56 w-56 rounded-full"
                      style={{ background: `conic-gradient(#10b981 0 ${retailPercent}%, #6d28d9 ${retailPercent}% 100%)` }}
                    >
                      <div className="absolute inset-8 flex flex-col items-center justify-center rounded-full bg-white">
                        <span className="text-3xl font-bold text-slate-900">{stores.length}</span>
                        <span className="text-sm text-slate-500">Total Stores</span>
                      </div>
                    </div>
                    <div className="space-y-5 text-sm">
                      <div>
                        <div className="flex items-center gap-3 font-semibold text-slate-700">
                          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                          Retail Store
                        </div>
                        <p className="mt-2 pl-6 text-slate-600">{formatStoreCount(retailStores.length, stores.length)}</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-3 font-semibold text-slate-700">
                          <span className="h-2.5 w-2.5 rounded-full bg-violet-700" />
                          Restaurant
                        </div>
                        <p className="mt-2 pl-6 text-slate-600">{formatStoreCount(restaurantStores.length, stores.length)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}

          {activeSection === 'admins' && (
            <section className="w-full">
              <div className="w-full rounded-lg border border-slate-200 bg-white p-7 shadow-md">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-2xl font-extrabold text-slate-900">Admin Accounts</h3>
                  <div className="flex items-center gap-3">
                    <select
                      value={adminFilter}
                      onChange={(event) => setAdminFilter(event.target.value as StoreFilter)}
                      className="h-12 rounded-md border border-slate-200 bg-white px-5 text-base font-medium text-slate-700 outline-none focus:border-blue-400"
                    >
                      <option value="ALL">All Store Types</option>
                      <option value="RETAIL_STORE">Retail Store</option>
                      <option value="RESTAURANT">Restaurant</option>
                    </select>
                    <button type="button" onClick={handleOpenCreateAdmin} className="inline-flex h-12 items-center gap-2 rounded-md bg-violet-700 px-6 text-base font-bold text-white hover:bg-violet-800">
                      <Plus className="h-5 w-5" />
                      Create Admin Account
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1120px] text-left text-base">
                    <thead className="border-y border-slate-200 bg-slate-50 text-sm font-bold text-slate-600">
                      <tr>
                        <th className="px-4 py-4">Admin Name</th>
                        <th className="px-4 py-4">Store Type</th>
                        <th className="px-4 py-4">Store Name</th>
                        <th className="px-4 py-4">Status</th>
                        <th className="px-4 py-4">Date Created</th>
                        <th className="px-4 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loading ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-10 text-center text-slate-500">Loading admin accounts...</td>
                        </tr>
                      ) : filteredAdmins.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-10 text-center text-slate-500">No admin accounts match this filter.</td>
                        </tr>
                      ) : (
                        filteredAdmins.slice(0, 6).map((admin) => (
                          <tr key={admin.id} className="text-slate-700">
                            <td className="px-4 py-4 font-medium text-slate-900">{admin.full_name}</td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex rounded px-3 py-1 text-sm font-medium ${storeTypeStyles(admin.store_type)}`}>
                                {storeTypeLabel(admin.store_type)}
                              </span>
                            </td>
                            <td className="px-4 py-4">{admin.store_name ?? 'Unassigned'}</td>
                            <td className="px-4 py-4">
                              <span className="inline-flex rounded bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">Active</span>
                            </td>
                            <td className="px-4 py-4 text-slate-500">May 31, 2026</td>
                            <td className="px-4 py-4">
                              <div className="flex justify-end gap-1">
                                <button type="button" onClick={() => handleEditAdmin(admin)} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900" title="Edit admin">
                                  <Pencil className="h-5 w-5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAdmin(admin)}
                                  disabled={deletingAdminId === admin.id}
                                  className="rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                  title="Delete admin"
                                >
                                  {deletingAdminId === admin.id ? <MoreHorizontal className="h-5 w-5" /> : <Trash2 className="h-5 w-5" />}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="mt-5 flex items-center justify-between text-base text-slate-500">
                  <span>Showing {filteredAdmins.length === 0 ? 0 : 1} to {Math.min(6, filteredAdmins.length)} of {admins.length} admin accounts</span>
                  <div className="flex items-center gap-2">
                    <button type="button" className="h-8 w-8 rounded-md bg-blue-600 text-sm font-semibold text-white">1</button>
                    <button type="button" className="h-8 w-8 rounded-md text-sm font-semibold text-slate-600 hover:bg-slate-100">2</button>
                    <button type="button" className="h-8 w-8 rounded-md text-sm font-semibold text-slate-600 hover:bg-slate-100">3</button>
                    <button type="button" className="h-8 w-8 rounded-md text-slate-600 hover:bg-slate-100">
                      <ChevronRight className="mx-auto h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          <footer className="text-sm text-slate-500">© 2026 Unified POS System. All rights reserved.</footer>
        </div>
      </main>

      {adminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-8 backdrop-blur-sm">
          <form onSubmit={handleCreateAdmin} className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{editingAdmin ? 'Edit Admin Account' : 'Create Admin Account'}</h3>
                <p className="mt-1 text-xs text-slate-500">Superadmin can only create admin accounts and assign store type.</p>
              </div>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="rounded-md px-2 py-1 text-xl leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Close admin account form"
              >
                ×
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <label className="block text-xs font-semibold text-slate-600">
                Full Name
                <input
                  value={formFullName}
                  onChange={(event) => setFormFullName(event.target.value)}
                  required
                  placeholder="Enter full name"
                  className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm font-normal text-slate-900 outline-none focus:border-blue-400"
                />
              </label>
              <label className="block text-xs font-semibold text-slate-600">
                Email Address
                <input
                  type="email"
                  value={formEmail}
                  onChange={(event) => setFormEmail(event.target.value)}
                  required
                  placeholder="Enter email address"
                  className="mt-1 h-10 w-full rounded-md border border-slate-200 px-3 text-sm font-normal text-slate-900 outline-none focus:border-blue-400"
                />
              </label>
              <label className="block text-xs font-semibold text-slate-600">
                Username
                <input
                  value={formEmail.split('@')[0] ?? ''}
                  readOnly
                  placeholder="Enter username"
                  className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-normal text-slate-500 outline-none"
                />
              </label>
              <label className="block text-xs font-semibold text-slate-600">
                Password
                <div className="relative mt-1">
                  <input
                    type={visiblePassword ? 'text' : 'password'}
                    value={formPassword}
                    onChange={(event) => setFormPassword(event.target.value)}
                    placeholder={editingAdmin ? 'Leave blank to keep current password' : 'Enter password'}
                    className="h-10 w-full rounded-md border border-slate-200 px-3 pr-10 text-sm font-normal text-slate-900 outline-none focus:border-blue-400"
                  />
                  <button
                    type="button"
                    onClick={() => setVisiblePassword((value) => !value)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:bg-slate-100"
                    title={visiblePassword ? 'Hide password' : 'Show password'}
                  >
                    {visiblePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>
            </div>

            <fieldset className="mt-4">
              <legend className="text-xs font-semibold text-slate-600">Store Type</legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormStoreType('RESTAURANT')}
                  className={`flex h-12 items-center justify-center gap-2 rounded-md border text-sm font-semibold ${
                    formStoreType === 'RESTAURANT'
                      ? 'border-violet-300 bg-violet-50 text-violet-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Utensils className="h-5 w-5" />
                  Restaurant
                </button>
                <button
                  type="button"
                  onClick={() => setFormStoreType('RETAIL_STORE')}
                  className={`flex h-12 items-center justify-center gap-2 rounded-md border text-sm font-semibold ${
                    formStoreType === 'RETAIL_STORE'
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Store className="h-5 w-5" />
                  Retail Store
                </button>
              </div>
            </fieldset>

            {createError && <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{createError}</p>}

            <div className="mt-5 flex gap-2">
              <button
                type="submit"
                disabled={creating}
                className="h-11 flex-1 rounded-md bg-violet-700 px-4 text-sm font-semibold text-white hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creating ? 'Saving...' : editingAdmin ? 'Save Changes' : 'Create Admin Account'}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="h-11 rounded-md border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
