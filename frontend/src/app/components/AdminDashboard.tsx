import { useEffect, useState, type FormEvent } from 'react';
import { Sidebar } from './Sidebar';
import { UserPlus, X } from 'lucide-react';
import { Page, type StoreBrand } from '../App';
import { getApiBaseUrl } from '../services/auth';
import type { AuthenticatedUser, StaffType } from '../types/auth';

interface StaffUser {
  id: number;
  full_name: string;
  email: string;
  role: string;
  store_id: number | null;
  store_type: string | null;
  staff_type: StaffType;
}

interface AdminDashboardProps {
  currentUser: AuthenticatedUser | null;
  storeBrand?: StoreBrand;
  onLogout: () => void;
  onNavigate: (page: Page) => void;
}

export function AdminDashboard({ currentUser, storeBrand, onLogout, onNavigate }: AdminDashboardProps) {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formStaffType, setFormStaffType] = useState<Exclude<StaffType, null>>('POS_STAFF');

  useEffect(() => {
    const loadStaff = async () => {
      if (!currentUser?.id) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${getApiBaseUrl()}/admin/staff?admin_user_id=${currentUser.id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.message ?? 'Unable to load staff accounts.');
        }

        setUsers(data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load staff accounts.');
      } finally {
        setLoading(false);
      }
    };

    void loadStaff();
  }, [currentUser?.id]);

  const handleAddUser = () => {
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormStaffType('POS_STAFF');
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!currentUser?.id) {
      setError('No admin session was found.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch(`${getApiBaseUrl()}/admin/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          admin_user_id: currentUser.id,
          full_name: formName,
          email: formEmail,
          password: formPassword,
          staff_type: formStaffType,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message ?? 'Unable to create staff account.');
      }

      setUsers((current) => [...current, data]);
      setShowModal(false);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Unable to create staff account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar currentPage="admin-dashboard" onNavigate={onNavigate} onLogout={onLogout} isAdmin storeBrand={storeBrand} userName={currentUser?.full_name} />

      <div className="flex-1 overflow-auto bg-background">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-primary mb-2">User Management</h1>
              <p className="text-muted-foreground">Manage staff accounts for {currentUser?.store_name ?? 'this restaurant store'}</p>
            </div>
            <button
              onClick={handleAddUser}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
            >
              <UserPlus className="w-5 h-5" />
              Add Staff
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-4 text-left">User ID</th>
                  <th className="px-6 py-4 text-left">Full Name</th>
                  <th className="px-6 py-4 text-left">Email</th>
                  <th className="px-6 py-4 text-left">Role</th>
                  <th className="px-6 py-4 text-left">Staff Type</th>
                  <th className="px-6 py-4 text-left">Store ID</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-muted-foreground">
                      Loading staff accounts...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-muted-foreground">
                      No staff accounts have been created for this store yet.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="border-t border-border hover:bg-muted/50">
                      <td className="px-6 py-4">{user.id}</td>
                      <td className="px-6 py-4">{user.full_name}</td>
                      <td className="px-6 py-4">{user.email}</td>
                      <td className="px-6 py-4">{user.role}</td>
                      <td className="px-6 py-4">{user.staff_type === 'INVENTORY_STAFF' ? 'Inventory Staff' : 'POS Staff'}</td>
                      <td className="px-6 py-4">{user.store_id}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-primary">Add Staff Account</h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block mb-2 font-medium">Full Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formName}
                  onChange={(event) => setFormName(event.target.value)}
                  required
                  placeholder="Enter full name"
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
                />
              </div>
              <div>
                <label className="block mb-2 font-medium">Email <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(event) => setFormEmail(event.target.value)}
                  required
                  placeholder="staff@example.com"
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
                />
              </div>
              <div>
                <label className="block mb-2 font-medium">Password <span className="text-red-500">*</span></label>
                <input
                  type="password"
                  value={formPassword}
                  onChange={(event) => setFormPassword(event.target.value)}
                  required
                  placeholder="Enter password"
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
                />
              </div>
              <div>
                <label className="block mb-2 font-medium">Staff Type <span className="text-red-500">*</span></label>
                <select
                  value={formStaffType}
                  onChange={(event) => setFormStaffType(event.target.value as Exclude<StaffType, null>)}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
                >
                  <option value="POS_STAFF">POS Staff</option>
                  <option value="INVENTORY_STAFF">Inventory Staff</option>
                </select>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  Staff will automatically inherit store ID {currentUser?.store_id ?? 'N/A'} and store type {currentUser?.store_type ?? 'N/A'}.
                </p>
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-60"
                >
                  {submitting ? 'Creating...' : 'Create Staff'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
