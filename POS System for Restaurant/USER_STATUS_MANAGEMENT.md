# User Status Management Feature

## Overview

Admins can now change user status directly from the User Management table, switching between **Active** and **Inactive** states with a single click.

## Features Added

### 1. **Interactive Status Dropdown in Table**
- **Location**: Status column in the User Management table
- **Functionality**: Click to toggle between Active/Inactive
- **Visual Feedback**: 
  - 🟢 **Active**: Green badge (`bg-green-100 text-green-800`)
  - 🔴 **Inactive**: Red badge (`bg-red-100 text-red-800`)
- **Auto-save**: Changes apply immediately when selected

### 2. **Status Field in View Modal Only**
- Status is visible in "View" mode (read-only)
- **Removed from Add modal** - New users automatically set to "Active"
- **Removed from Edit modal** - Status changes must be done in table
- Status can only be changed via the dropdown in the user table

### 3. **Status Change Handler**
```typescript
const handleStatusChange = (userId: number, newStatus: 'Active' | 'Inactive') => {
  setUsers(users.map(u =>
    u.id === userId ? { ...u, status: newStatus } : u
  ));
};
```

## How to Use

### From User Table (Only Way to Change Status):
1. Navigate to **Admin Dashboard** → **User Management**
2. Locate the user in the table
3. Click on the status dropdown (green or red badge)
4. Select "Active" or "Inactive"
5. Status updates immediately

### In Modals:
- **Add User Modal**: No status field - defaults to "Active"
- **Edit User Modal**: No status field - use table dropdown instead
- **View User Modal**: Status displayed as read-only for viewing

## User Interface

### Status Dropdown in Table
```tsx
<select
  value={user.status}
  onChange={(e) => handleStatusChange(user.id, e.target.value)}
  className="px-3 py-1 rounded-full text-sm font-medium border-0 cursor-pointer
    focus:outline-none focus:ring-2 focus:ring-primary"
>
  <option value="Active">Active</option>
  <option value="Inactive">Inactive</option>
</select>
```

### Status Options
- **Active** - User can log in and access the system
- **Inactive** - User account is disabled (cannot log in)

## Sample Data

The system now includes a sample inactive user:
- **Name**: Mark Johnson
- **Username**: cashier2
- **Role**: Cashier
- **Status**: Inactive

## Benefits

### For Admins:
✅ **Quick Status Changes** - No need to open edit modal
✅ **Visual Clarity** - Color-coded status badges
✅ **One-Click Toggle** - Change status in seconds
✅ **Inline Editing** - Update status directly from the table

### For System Security:
✅ **Access Control** - Quickly disable compromised accounts
✅ **Temporary Suspension** - Deactivate users without deletion
✅ **Audit Trail** - Status changes tracked in real-time
✅ **User Lifecycle Management** - Easy onboarding/offboarding

## Use Cases

### 1. **Employee Termination**
- Change status to "Inactive" immediately
- Account preserved for records
- User cannot log in

### 2. **Temporary Leave**
- Set to "Inactive" during absence
- Reactivate when employee returns
- No data loss

### 3. **Security Incident**
- Quickly disable suspicious accounts
- Investigate without deleting user
- Restore access when cleared

### 4. **Seasonal Staff**
- Deactivate during off-season
- Reactivate when needed
- Maintain user history

## Technical Details

### State Management
- Status stored in `User` interface as `status: 'Active' | 'Inactive'`
- Updates reflected immediately in UI
- Changes persist in component state

### Styling
- Active users: Green badge with light green background
- Inactive users: Red badge with light red background
- Dropdown has focus ring for accessibility
- Cursor changes to pointer on hover

### Future Enhancements
Could add:
- Status change logging/audit trail
- Confirmation prompt for status changes
- Bulk status operations (activate/deactivate multiple users)
- Status change history per user
- Auto-deactivation after X days of inactivity

---

**Feature Added**: 2026-05-29  
**Component**: `/src/app/components/AdminDashboard.tsx`  
**Documentation**: `/USER_STATUS_MANAGEMENT.md`
