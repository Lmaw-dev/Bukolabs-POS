import { useEffect, useState, type FormEvent } from 'react';
import type { AuthenticatedUser } from '../../auth/types/auth';
import { getApiBaseUrl } from '../../auth/services/auth';
import { Pencil, Trash2, UserPlus } from 'lucide-react';

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

      setAdmins((current) => editingAdmin ? current.map((admin) => (admin.id === data.id ? data : admin)) : [...current, data.user]);
      if (!editingAdmin) {
        setCreatedPassword(data.temporary_password || formPassword);
      }
      setEditingAdmin(null);
      setFormFullName('');
      setFormEmail('');
      setFormPassword('');
      setFormStoreType('RESTAURANT');
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
  };

  const handleCancelEdit = () => {
    setEditingAdmin(null);
    setFormFullName('');
    setFormEmail('');
    setFormPassword('');
    setFormStoreType('RESTAURANT');
    setCreateError('');
    setCreatedPassword('');
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

  return (
    <div
      className="min-h-screen text-slate-100 p-6 md:p-10"
      style={{ background: 'linear-gradient(135deg, #003534 0%, #005656 100%)' }}
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-emerald-300/80">Superadmin</p>
              <h1 className="mt-2 text-3xl font-semibold">Admin Management</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                View admin accounts across stores and prepare new admin assignments by store type.
              </p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
              style={{ background: 'rgba(255,255,255,0.12)' }}
            >
              Sign Out
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-400">Current user</p>
            <p className="mt-2 text-lg font-semibold">{currentUser?.full_name ?? 'Superadmin'}</p>
            <p className="text-sm text-slate-300">{currentUser?.email ?? 'No session data'}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-400">Store types</p>
            <p className="mt-2 text-lg font-semibold">Restaurant</p>
            <p className="text-sm text-slate-300">Retail Store</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-slate-400">Admin creation</p>
            <p className="mt-2 text-lg font-semibold">Enabled</p>
            <p className="text-sm text-slate-300">Each Admin gets a linked store automatically.</p>
          </div>
        </div>

        <form onSubmit={handleCreateAdmin} className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div>
            <h2 className="text-xl font-semibold">{editingAdmin ? 'Edit Admin Account' : 'Create Admin Account'}</h2>
            <p className="text-sm text-slate-400">Select the store type and manage the account that can log in immediately.</p>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="text-slate-300">Full Name</span>
              <input
                value={formFullName}
                onChange={(event) => setFormFullName(event.target.value)}
                required
                className="w-full rounded-xl border border-white/10 px-4 py-3 text-white outline-none transition focus:border-emerald-300"
                style={{ background: 'rgba(50,59,66,0.15)' }}
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="text-slate-300">Email</span>
              <input
                type="email"
                value={formEmail}
                onChange={(event) => setFormEmail(event.target.value)}
                required
                className="w-full rounded-xl border border-white/10 px-4 py-3 text-white outline-none transition focus:border-emerald-300"
                style={{ background: 'rgba(50,59,66,0.15)' }}
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="text-slate-300">Password</span>
              <input
                type="password"
                value={formPassword}
                onChange={(event) => setFormPassword(event.target.value)}
                placeholder={editingAdmin ? 'Leave blank to keep current password' : 'Leave blank to generate'}
                className="w-full rounded-xl border border-white/10 px-4 py-3 text-white outline-none transition focus:border-emerald-300"
                style={{ background: 'rgba(50,59,66,0.15)' }}
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="text-slate-300">Store Type</span>
              <select
                value={formStoreType}
                onChange={(event) => setFormStoreType(event.target.value as 'RESTAURANT' | 'RETAIL_STORE')}
                className="w-full rounded-xl border border-white/10 px-4 py-3 text-white outline-none transition focus:border-emerald-300"
                style={{ background: 'rgba(50,59,66,0.15)' }}
              >
                <option value="RESTAURANT">Restaurant</option>
                <option value="RETAIL_STORE">Retail Store</option>
              </select>
            </label>
          </div>

          {createError && <p className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">{createError}</p>}
          {createdPassword && <p className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-200">Admin created. Login password: {createdPassword}</p>}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #00a7a5 0%, #009ba5 100%)' }}
              onMouseEnter={(e) => {
                if (!creating) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg, #00cfcf 0%, #00b6b6 100%)';
                }
              }}
              onMouseLeave={(e) => {
                if (!creating) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg, #00a7a5 0%, #009ba5 100%)';
                }
              }}
            >
              <UserPlus className="h-4 w-4" />
              {creating ? 'Saving...' : editingAdmin ? 'Save Changes' : 'Create Admin'}
            </button>
            {editingAdmin && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Admin accounts</h2>
              <p className="text-sm text-slate-400">Loaded from the PostgreSQL-backed NestJS API.</p>
            </div>
            <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
              {admins.length} accounts
            </span>
          </div>

          {loading && <p className="mt-6 text-sm text-slate-400">Loading admin accounts...</p>}

          {error && !loading && (
            <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-200">
              {error}
            </div>
          )}

          {!loading && !error && (
            <div className="mt-6 overflow-hidden rounded-2xl border border-white/10" style={{ background: 'rgba(50,59,66,0.15)' }}>
              <table className="w-full text-left text-sm" style={{ background: 'rgba(50,59,66,0.15)' }}>
                <thead className="bg-white/5 text-slate-300">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Store Type</th>
                    <th className="px-4 py-3 font-medium">Store</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-slate-400">
                        No admin accounts were returned by the database yet.
                      </td>
                    </tr>
                  ) : (
                    admins.map((admin) => (
                      <tr key={admin.id} className="border-t border-white/10">
                        <td className="px-4 py-3">{admin.full_name}</td>
                        <td className="px-4 py-3 text-slate-300">{admin.email}</td>
                        <td className="px-4 py-3 text-slate-300">{admin.store_type ?? 'Unassigned'}</td>
                        <td className="px-4 py-3 text-slate-300">{admin.store_name ?? 'Unassigned'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditAdmin(admin)}
                              className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-emerald-200 transition hover:bg-white/10"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteAdmin(admin)}
                              disabled={deletingAdminId === admin.id}
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-400/20 px-3 py-1.5 text-xs font-medium text-rose-200 transition hover:bg-rose-400/10 disabled:opacity-60"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              {deletingAdminId === admin.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
