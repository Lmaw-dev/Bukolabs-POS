# User Roles Simplified

## Overview

The User Management system has been simplified to only include two user roles: **Admin** and **Cashier**. The "Staff" role has been removed.

## Changes Made

### ❌ **Removed**
- **Staff** role option from role dropdown
- Staff role from all sample data
- Staff references in documentation

### ✅ **Updated**
- **Default role** changed from "Staff" to "Cashier"
- Sample user "John Doe" changed from Staff to Cashier
- Sample username changed from "staff" to "johndoe"

## Available User Roles

### 1. **Admin** 👑
- Full system access
- User management capabilities
- All administrative functions
- Can view reports and analytics

### 2. **Cashier** 💰
- Order management
- Payment processing
- Table management
- Customer order history
- Basic POS functions

## Role Dropdown

### Before:
```
┌────────────────┐
│ Admin      ▼   │
│ Staff          │ ← Removed
│ Cashier        │
└────────────────┘
```

### After:
```
┌────────────────┐
│ Admin      ▼   │
│ Cashier        │
└────────────────┘
```

## Sample Users Updated

### Original Sample Data:
```
1. Admin User   → admin    → Admin    → Active
2. John Doe     → staff    → Staff    → Active
3. Jane Smith   → cashier  → Cashier  → Active
4. Mark Johnson → cashier2 → Cashier  → Inactive
```

### Updated Sample Data:
```
1. Admin User   → admin    → Admin    → Active
2. John Doe     → johndoe  → Cashier  → Active    ← Changed
3. Jane Smith   → cashier  → Cashier  → Active
4. Mark Johnson → cashier2 → Cashier  → Inactive
```

## Default Settings

### Add User Form Defaults:
- **Role**: Cashier (previously Staff)
- **Status**: Active
- **Name**: Empty
- **Username**: Empty

## Form Updates

### Add User Modal:
```
┌─────────────────────────────────┐
│  Add New User              [X]  │
├─────────────────────────────────┤
│  Name *                         │
│  [Enter full name            ]  │
│                                 │
│  Username *                     │
│  [Enter username             ]  │
│                                 │
│  Role *                         │
│  [Admin ▼                    ]  │ ← Only Admin
│   Cashier                       │   and Cashier
│                                 │
│  ℹ️ Note: User status can be   │
│     changed in the table.       │
│                                 │
│         [Cancel]  [Add User]    │
└─────────────────────────────────┘
```

### Edit User Modal:
```
┌─────────────────────────────────┐
│  Edit User                 [X]  │
├─────────────────────────────────┤
│  Name *                         │
│  [John Doe                   ]  │
│                                 │
│  Username *                     │
│  [johndoe                    ]  │
│                                 │
│  Role *                         │
│  [Admin ▼                    ]  │ ← Only Admin
│   Cashier                       │   and Cashier
│                                 │
│  ℹ️ Note: User status can be   │
│     changed in the table.       │
│                                 │
│    [Cancel]  [Save Changes]     │
└─────────────────────────────────┘
```

## Use Cases

### Admin Role - Typical Users:
- Restaurant Manager
- Owner
- System Administrator
- Supervisor

### Cashier Role - Typical Users:
- Front desk staff
- Order takers
- Cashiers
- POS operators
- Waiters/Waitresses

## Permission Implications

### Admin Can:
✅ Manage users (add, edit, delete)  
✅ View and modify all orders  
✅ Access all reports  
✅ Configure system settings  
✅ Manage table configurations  
✅ Override discounts  
✅ Process refunds  

### Cashier Can:
✅ Create new orders  
✅ Process payments  
✅ View order history  
✅ Manage tables  
✅ Apply standard discounts  
✅ Handle customer orders  
❌ Cannot manage users  
❌ Cannot access admin dashboard  

## Migration Notes

### For Existing Systems:
If you have existing users with "Staff" role, they should be migrated to one of the two new roles based on their permissions:
- **High-level permissions** → Migrate to Admin
- **Standard operations** → Migrate to Cashier

### Code Changes:
```typescript
// Before
const [formRole, setFormRole] = useState('Staff');

// After
const [formRole, setFormRole] = useState('Cashier');
```

```typescript
// Before
<option value="Admin">Admin</option>
<option value="Staff">Staff</option>
<option value="Cashier">Cashier</option>

// After
<option value="Admin">Admin</option>
<option value="Cashier">Cashier</option>
```

## Benefits

### For System:
✅ **Simplified role management** - Only two clear roles  
✅ **Easier to understand** - Clear distinction between admin and operator  
✅ **Less complexity** - Fewer permission combinations to manage  
✅ **Better security** - Clear separation of privileges  

### For Administrators:
✅ **Faster user setup** - Choose between two roles only  
✅ **Clear responsibilities** - Everyone knows their role  
✅ **Easier training** - Simpler role structure to explain  

### For Development:
✅ **Simpler role checks** - Fewer conditions to handle  
✅ **Cleaner code** - Less role-based branching  
✅ **Future-proof** - Easy to add specific roles if needed later  

## Future Considerations

If additional roles are needed in the future, they could be added based on specific needs:
- **Manager** (between Admin and Cashier)
- **Kitchen Staff** (order preparation)
- **Waiter** (table service)
- **Delivery** (delivery management)

However, the current two-role system covers most restaurant POS needs effectively.

---

**Updated**: 2026-05-29  
**Component**: `/src/app/components/AdminDashboard.tsx`  
**Documentation**: `/USER_ROLES_SIMPLIFIED.md`
