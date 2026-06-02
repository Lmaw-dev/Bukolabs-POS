import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { UserPlus, Edit, Trash2, Eye, X } from 'lucide-react';
import { Page } from '../App';

interface User {
  id: number;
  name: string;
  username: string;
  role: string;
  status: 'Active' | 'Inactive';
}

interface AdminDashboardProps {
  onLogout: () => void;
  onNavigate: (page: Page) => void;
}

export function AdminDashboard({ onLogout, onNavigate }: AdminDashboardProps) {
  const [users, setUsers] = useState<User[]>([
    { id: 1, name: 'Admin User', username: 'admin', role: 'Admin', status: 'Active' },
    { id: 2, name: 'John Doe', username: 'johndoe', role: 'Cashier', status: 'Active' },
    { id: 3, name: 'Jane Smith', username: 'cashier', role: 'Cashier', status: 'Active' },
    { id: 4, name: 'Mark Johnson', username: 'cashier2', role: 'Cashier', status: 'Inactive' },
  ]);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view' | 'delete'>('add');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formRole, setFormRole] = useState('Cashier');
  const [formStatus, setFormStatus] = useState<'Active' | 'Inactive'>('Active');

  const handleAddUser = () => {
    setModalMode('add');
    setSelectedUser(null);
    // Clear form for new user
    setFormName('');
    setFormUsername('');
    setFormRole('Cashier');
    setFormStatus('Active');
    setShowModal(true);
  };

  const handleEditUser = (user: User) => {
    setModalMode('edit');
    setSelectedUser(user);
    // Populate form with user data
    setFormName(user.name);
    setFormUsername(user.username);
    setFormRole(user.role);
    setFormStatus(user.status);
    setShowModal(true);
  };

  const handleViewUser = (user: User) => {
    setModalMode('view');
    setSelectedUser(user);
    // Populate form with user data for viewing
    setFormName(user.name);
    setFormUsername(user.username);
    setFormRole(user.role);
    setFormStatus(user.status);
    setShowModal(true);
  };

  const handleDeleteUser = (user: User) => {
    setModalMode('delete');
    setSelectedUser(user);
    setShowModal(true);
  };

  const confirmDelete = () => {
    if (selectedUser) {
      setUsers(users.filter(u => u.id !== selectedUser.id));
      setShowModal(false);
    }
  };

  const handleStatusChange = (userId: number, newStatus: 'Active' | 'Inactive') => {
    setUsers(users.map(u =>
      u.id === userId ? { ...u, status: newStatus } : u
    ));
  };

  const handleSubmit = () => {
    // Validation
    if (!formName.trim()) {
      alert('Please enter a name');
      return;
    }
    if (!formUsername.trim()) {
      alert('Please enter a username');
      return;
    }

    if (modalMode === 'add') {
      // Check if username already exists
      if (users.some(u => u.username.toLowerCase() === formUsername.toLowerCase())) {
        alert('Username already exists. Please choose a different username.');
        return;
      }

      // Generate new ID
      const newId = Math.max(...users.map(u => u.id), 0) + 1;

      // Add new user
      const newUser: User = {
        id: newId,
        name: formName.trim(),
        username: formUsername.trim(),
        role: formRole,
        status: formStatus
      };

      setUsers([...users, newUser]);
      setShowModal(false);

      // Show success message
      alert(`User "${formName}" has been added successfully!`);
    } else if (modalMode === 'edit' && selectedUser) {
      // Check if username already exists (excluding current user)
      if (users.some(u => u.id !== selectedUser.id && u.username.toLowerCase() === formUsername.toLowerCase())) {
        alert('Username already exists. Please choose a different username.');
        return;
      }

      // Update user (preserve existing status - only changeable in table)
      setUsers(users.map(u =>
        u.id === selectedUser.id
          ? {
              ...u,
              name: formName.trim(),
              username: formUsername.trim(),
              role: formRole,
              // Keep existing status - status can only be changed in table
            }
          : u
      ));
      setShowModal(false);

      // Show success message
      alert(`User "${formName}" has been updated successfully!`);
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar currentPage="admin-dashboard" onNavigate={onNavigate} onLogout={onLogout} isAdmin />

      <div className="flex-1 overflow-auto bg-background">
        <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-primary mb-2">User Management</h1>
              <p className="text-muted-foreground">Manage system users and permissions</p>
            </div>
            <button
              onClick={handleAddUser}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
            >
              <UserPlus className="w-5 h-5" />
              Add User
            </button>
          </div>

          <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-4 text-left">User ID</th>
                  <th className="px-6 py-4 text-left">Name</th>
                  <th className="px-6 py-4 text-left">Username</th>
                  <th className="px-6 py-4 text-left">Role</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t border-border hover:bg-muted/50">
                    <td className="px-6 py-4">{user.id}</td>
                    <td className="px-6 py-4">{user.name}</td>
                    <td className="px-6 py-4">{user.username}</td>
                    <td className="px-6 py-4">{user.role}</td>
                    <td className="px-6 py-4">
                      <select
                        value={user.status}
                        onChange={(e) => handleStatusChange(user.id, e.target.value as 'Active' | 'Inactive')}
                        className={`pl-2.5 pr-6 py-1 rounded-full text-sm font-medium border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                          user.status === 'Active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                        style={{
                          backgroundPosition: 'right 0.5rem center',
                          backgroundSize: '0.875em 0.875em',
                          width: 'min-content',
                          minWidth: '90px',
                          maxWidth: '110px'
                        }}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewUser(user)}
                          className="p-2 text-primary hover:bg-primary/10 rounded transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditUser(user)}
                          className="p-2 text-secondary hover:bg-secondary/10 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="p-2 text-destructive hover:bg-destructive/10 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-primary">
                {modalMode === 'add' && 'Add New User'}
                {modalMode === 'edit' && 'Edit User'}
                {modalMode === 'view' && 'View User'}
                {modalMode === 'delete' && 'Confirm Delete'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalMode === 'delete' ? (
              <div>
                <p className="mb-6">Are you sure you want to delete user "{selectedUser?.name}"?</p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block mb-2 font-medium">Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    disabled={modalMode === 'view'}
                    placeholder="Enter full name"
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
                  />
                </div>
                <div>
                  <label className="block mb-2 font-medium">Username <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    disabled={modalMode === 'view'}
                    placeholder="Enter username"
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
                  />
                </div>
                <div>
                  <label className="block mb-2 font-medium">Role <span className="text-red-500">*</span></label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    disabled={modalMode === 'view'}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Cashier">Cashier</option>
                  </select>
                </div>
                {/* Show status field only in View mode (read-only) */}
                {modalMode === 'view' && (
                  <div>
                    <label className="block mb-2 font-medium">Status</label>
                    <select
                      value={formStatus}
                      disabled={true}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                )}
                {/* Info note for Add and Edit modes */}
                {(modalMode === 'add' || modalMode === 'edit') && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-800">
                      <strong>Note:</strong> User status can be changed directly in the table using the status dropdown.
                    </p>
                  </div>
                )}
                {modalMode !== 'view' && (
                  <div className="flex gap-3 justify-end pt-4">
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                    >
                      {modalMode === 'add' ? 'Add User' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
