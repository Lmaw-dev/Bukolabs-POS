import { useState, useEffect } from 'react';
import { Sidebar } from '../../shared/components/Sidebar';
import { Page } from '../../shared/App';
import { Clock, Edit2, X, Users, Bell, CheckCircle, MoreVertical, Save, Plus, Trash2, History, Eye, CreditCard } from 'lucide-react';
import { useOrders, Order } from '../../shared/context/OrderContext';
import { useTables } from '../../shared/context/TableContext';
import { TableAssignmentNotification } from '../../shared/components/TableAssignmentNotification';

interface TableManagementProps {
  onNavigate: (page: Page) => void;
  currentOrder: any;
}

export function TableManagement({ onNavigate, currentOrder }: TableManagementProps) {
  const { orders, updateOrder, queuedOrders, removeFromQueue } = useOrders();
  const {
    tables: contextTables,
    setTableStatus,
    notifications,
    dismissNotification,
    addTable,
    deleteTable,
    updateTable,
    queueHistory,
    tableHistory,
    assignmentNotification,
    dismissAssignmentNotification,
    assignToTable,
    skipQueueCustomer,
    getTableHistory,
  } = useTables();
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [tables, setTables] = useState(contextTables);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTable, setEditingTable] = useState<any>(null);
  const [editTableNumber, setEditTableNumber] = useState('');
  const [editSeats, setEditSeats] = useState('');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableSeats, setNewTableSeats] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingTable, setDeletingTable] = useState<any>(null);
  const [showQueueHistory, setShowQueueHistory] = useState(false);
  const [showTableHistory, setShowTableHistory] = useState(false);
  const [selectedTableForHistory, setSelectedTableForHistory] = useState<number | null>(null);

  // Sync with context tables
  useEffect(() => {
    setTables(contextTables);
  }, [contextTables]);

  // Close dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (openMenuId !== null) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openMenuId]);

  // Note: Queue management is handled in CreateOrder component
  // Queued orders automatically show here from OrderContext

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'available': return 'bg-emerald-100 text-emerald-700';
      case 'occupied': return 'bg-orange-100 text-orange-700';
      case 'maintenance': return 'bg-gray-200 text-gray-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available': return 'Available';
      case 'occupied': return 'Occupied';
      case 'maintenance': return 'Maintenance';
      default: return status;
    }
  };

  const handleTableClick = (table: typeof tables[0]) => {
    if (table.status === 'occupied') {
      // Select/deselect occupied table
      if (selectedTableId === table.id) {
        setSelectedTableId(null);
      } else {
        setSelectedTableId(table.id);
      }
    }
  };

  const handleStatusChange = (tableNumber: number, newStatus: 'available' | 'occupied' | 'reserved' | 'maintenance') => {
    // Check if table has an active order
    const table = tables.find(t => t.number === tableNumber);
    if (table?.orderId && newStatus !== 'occupied') {
      alert('Cannot change status: Table has an active order. Please process payment first.');
      return;
    }

    // Cannot manually set to occupied - must create order
    if (newStatus === 'occupied' && !table?.orderId) {
      alert('Cannot set to Occupied manually. Create an order to occupy a table.');
      return;
    }

    // Update table status through context
    if (newStatus !== 'occupied') {
      setTableStatus(tableNumber, newStatus);
    }
  };

  const handlePaymentComplete = (tableId: number) => {
    const table = tables.find(t => t.id === tableId);
    if (table?.orderId) {
      // Update order to paid status
      updateOrder(table.orderId, { paymentStatus: 'Paid' });
      setSelectedTableId(null);
    }
  };

  const getTableOrder = (table: typeof tables[0]): Order | undefined => {
    if (!table.orderId) return undefined;
    return orders.find(o => o.id === table.orderId);
  };

  const getTableColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-gradient-to-br from-green-400 to-green-600';
      case 'occupied': return 'bg-gradient-to-br from-orange-400 to-orange-600';
      case 'reserved': return 'bg-gradient-to-br from-blue-400 to-blue-600';
      case 'maintenance': return 'bg-gradient-to-br from-gray-400 to-gray-600';
      default: return 'bg-gradient-to-br from-gray-400 to-gray-600';
    }
  };

  const handleOpenEditModal = (table: any) => {
    setEditingTable(table);
    setEditTableNumber(String(table.number));
    setEditSeats(String(table.seats));
    setShowEditModal(true);
    setOpenMenuId(null);
  };

  const handleSaveEdit = () => {
    if (!editingTable) return;

    const newNumber = parseInt(editTableNumber);
    const newSeats = parseInt(editSeats);

    if (isNaN(newNumber) || newNumber < 1) {
      alert('Please enter a valid table number');
      return;
    }
    if (isNaN(newSeats) || newSeats < 1) {
      alert('Please enter a valid number of seats');
      return;
    }

    // Use context function to update
    const success = updateTable(editingTable.id, newNumber, newSeats);

    if (!success) {
      alert(`Table ${newNumber} already exists. Please choose a different number.`);
      return;
    }

    setShowEditModal(false);
    setEditingTable(null);
  };

  const handleAddTable = () => {
    const tableNumber = parseInt(newTableNumber);
    const seats = parseInt(newTableSeats);

    if (isNaN(tableNumber) || tableNumber < 1) {
      alert('Please enter a valid table number');
      return;
    }
    if (isNaN(seats) || seats < 1 || seats > 20) {
      alert('Please enter a valid number of seats (1-20)');
      return;
    }

    const success = addTable(tableNumber, seats);

    if (!success) {
      alert(`Table ${tableNumber} already exists. Please choose a different number.`);
      return;
    }

    // Clear form and close modal
    setNewTableNumber('');
    setNewTableSeats('');
    setShowAddModal(false);
  };

  const handleOpenDeleteConfirm = (table: any) => {
    setDeletingTable(table);
    setShowDeleteConfirm(true);
    setOpenMenuId(null);
  };

  const handleConfirmDelete = () => {
    if (!deletingTable) return;

    const success = deleteTable(deletingTable.id);

    if (!success) {
      alert('Cannot delete table with an active order. Please complete the order first.');
      setShowDeleteConfirm(false);
      setDeletingTable(null);
      return;
    }

    setShowDeleteConfirm(false);
    setDeletingTable(null);
  };

  return (
    <div className="flex h-screen">
      <Sidebar currentPage="table-management" onNavigate={onNavigate} onLogout={() => onNavigate('login')} />

      <div className="flex-1 overflow-auto bg-background p-8">
        <h1 className="text-primary mb-6">Table Management</h1>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="mb-6 space-y-3">
            {notifications.map(notification => (
              <div
                key={notification.id}
                className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4 flex items-start justify-between shadow-sm animate-slide-in"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <Bell className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-green-900 text-sm mb-1">Table Available!</h3>
                    <p className="text-sm text-green-800">{notification.message}</p>
                  </div>
                </div>
                <button
                  onClick={() => dismissNotification(notification.id)}
                  className="text-green-600 hover:text-green-800 transition-colors p-1"
                  title="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className={`grid grid-cols-1 ${queuedOrders.length > 0 ? 'lg:grid-cols-3' : ''} gap-6`}>
          {/* Tables Grid */}
          <div className={queuedOrders.length > 0 ? 'lg:col-span-2' : ''}>
            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base">Tables</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowQueueHistory(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors text-sm font-medium"
                  >
                    <History className="w-4 h-4" />
                    Queue History
                  </button>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Add Table
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-6">
                {tables.map(table => {
                  const order = getTableOrder(table);
                  return (
                    <div
                      key={table.id}
                      className={`bg-white rounded-xl shadow-sm border-2 transition-all p-4 flex flex-col items-center gap-3 relative ${
                        selectedTableId === table.id
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-gray-200'
                      }`}
                    >
                      {/* Three-dot menu button */}
                      <div className="absolute top-2 right-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === table.id ? null : table.id);
                          }}
                          className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-600" />
                        </button>

                        {/* Dropdown menu */}
                        {openMenuId === table.id && (
                          <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 min-w-[160px]">
                            <button
                              onClick={() => {
                                setSelectedTableForHistory(table.number);
                                setShowTableHistory(true);
                                setOpenMenuId(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                            >
                              <History className="w-3.5 h-3.5" />
                              View History
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(table)}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              Edit Table
                            </button>
                            <button
                              onClick={() => handleOpenDeleteConfirm(table)}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete Table
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Circular badge with table number - color based on status */}
                      <button
                        onClick={() => handleTableClick(table)}
                        className="relative focus:outline-none"
                      >
                        <div className={`w-20 h-20 rounded-full ${getTableColor(table.status)} shadow-lg flex items-center justify-center text-white text-2xl font-bold transition-transform hover:scale-105`}>
                          {table.number}
                        </div>
                      </button>

                      {/* Table label */}
                      <div className="text-center w-full">
                        <p className="font-semibold text-gray-800">Table {table.number}</p>
                        <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mt-1">
                          <Users className="w-3 h-3" />
                          <span>{table.seats} seats</span>
                        </div>
                      </div>

                      {/* Status Dropdown */}
                      <select
                        value={table.status}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleStatusChange(table.number, e.target.value as any);
                        }}
                        className={`w-full px-3 py-2 rounded-lg text-sm font-medium border-2 focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                          table.status === 'available' ? 'border-green-200 bg-green-50 text-green-700' :
                          table.status === 'occupied' ? 'border-orange-200 bg-orange-50 text-orange-700 cursor-not-allowed' :
                          table.status === 'reserved' ? 'border-blue-200 bg-blue-50 text-blue-700' :
                          'border-gray-200 bg-gray-50 text-gray-700'
                        }`}
                        disabled={table.status === 'occupied'}
                      >
                        <option value="available">Available</option>
                        <option value="occupied">Occupied</option>
                        <option value="reserved">Reserved</option>
                        <option value="maintenance">Maintenance</option>
                      </select>

                      {/* Show order info if occupied */}
                      {order && (
                        <div className="w-full text-center text-xs text-gray-600 mt-1">
                          <p className="font-medium truncate">{order.customer}</p>
                          {order.partySize ? (
                            <p className="text-primary">{order.partySize} {order.partySize === 1 ? 'person' : 'people'}</p>
                          ) : (
                            <p className="text-gray-400">—</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Selected Table Details */}
              {selectedTableId && (() => {
                const selectedTable = tables.find(t => t.id === selectedTableId);
                const selectedOrder = selectedTable ? getTableOrder(selectedTable) : undefined;
                return selectedOrder ? (
                  <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium">Table {selectedTable?.number} - {selectedOrder.customer}</h3>
                        <p className="text-sm text-muted-foreground">Order {selectedOrder.id}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        selectedOrder.orderStatus === 'Served' ? 'bg-green-100 text-green-700' :
                        selectedOrder.orderStatus === 'Preparing' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {selectedOrder.orderStatus}
                      </span>
                    </div>
                    <div className="space-y-1 mb-3">
                      {selectedOrder.items.map((item, idx) => (
                        <div key={idx} className="text-sm flex justify-between">
                          <span>{item.quantity}x {item.name}</span>
                          <span>₱{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-orange-200 pt-2 mb-3">
                      <div className="flex justify-between font-medium">
                        <span>Total</span>
                        <span>₱{selectedOrder.amountNumber.toFixed(2)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handlePaymentComplete(selectedTableId)}
                      className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg transition-colors"
                    >
                      Mark as Paid & Free Table
                    </button>
                  </div>
                ) : null;
              })()}

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Status Legend</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                      #
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">Available</p>
                      <p className="text-xs text-gray-500">Ready</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                      #
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">Occupied</p>
                      <p className="text-xs text-gray-500">Has order</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                      #
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">Reserved</p>
                      <p className="text-xs text-gray-500">Booked</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                      #
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">Maintenance</p>
                      <p className="text-xs text-gray-500">Out of service</p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                💡 Use the dropdown on each table to change its status. Occupied tables cannot be changed until payment is processed.
              </p>
            </div>
          </div>

          {/* Queue List - Only show when there are queued orders */}
          {queuedOrders.length > 0 && (
            <div className="lg:col-span-1">
              <div className="bg-card rounded-lg shadow-sm border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base">Queue</h2>
                  <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs">
                    {queuedOrders.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {queuedOrders.map((order, index) => (
                    <div
                      key={order.id}
                      className={`border border-border rounded-lg p-3 ${
                        index === 0 ? 'bg-orange-50 border-orange-200' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="bg-orange-500 text-white px-1.5 py-0.5 rounded text-xs font-medium">
                              #{order.queuePosition}
                            </span>
                            <p className="text-sm font-medium">{order.customerName}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{order.orderNumber}</p>
                        </div>
                        <button
                          onClick={() => removeFromQueue(order.id)}
                          className="text-muted-foreground hover:text-destructive p-1"
                          title="Remove from queue"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{order.items} items</span>
                        <span className="text-orange-600 font-medium">₱{order.total.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                        <Clock className="w-3 h-3" />
                        <span>Waiting for table...</span>
                      </div>
                      {index === 0 && (
                        <div className="mt-2 pt-2 border-t border-orange-200">
                          <p className="text-xs text-orange-600 font-medium">Next to be seated</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground mt-4 text-center">
                  💡 Customers waiting for available tables
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Table Modal */}
      {showEditModal && editingTable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Edit Table Settings</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingTable(null);
                }}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Current Table Preview */}
              <div className="flex items-center justify-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className={`w-16 h-16 rounded-full ${getTableColor(editingTable.status)} shadow-lg flex items-center justify-center text-white text-xl font-bold`}>
                  {editTableNumber || editingTable.number}
                </div>
                <div className="text-left">
                  <p className="text-sm text-gray-500">Current Status</p>
                  <p className="font-medium text-gray-900 capitalize">{editingTable.status}</p>
                </div>
              </div>

              {/* Table Number Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Table Number
                </label>
                <input
                  type="number"
                  value={editTableNumber}
                  onChange={(e) => setEditTableNumber(e.target.value)}
                  min="1"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Enter table number"
                />
                <p className="text-xs text-gray-500 mt-1">This will be displayed on the table badge</p>
              </div>

              {/* Seats Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Seats
                </label>
                <input
                  type="number"
                  value={editSeats}
                  onChange={(e) => setEditSeats(e.target.value)}
                  min="1"
                  max="20"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Enter number of seats"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum capacity for this table</p>
              </div>

              {/* Info Note */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  <strong>Note:</strong> Table status can be changed using the dropdown on the table card.
                  This dialog is for editing table number and seating capacity.
                </p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingTable(null);
                }}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Table Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Add New Table</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewTableNumber('');
                  setNewTableSeats('');
                }}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Preview */}
              <div className="flex items-center justify-center gap-4 p-4 bg-green-50 rounded-lg border-2 border-green-200">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-lg flex items-center justify-center text-white text-xl font-bold">
                  {newTableNumber || '?'}
                </div>
                <div className="text-left">
                  <p className="text-sm text-gray-500">New Table</p>
                  <p className="font-medium text-gray-900">Status: Available</p>
                  <p className="text-xs text-gray-600">{newTableSeats ? `${newTableSeats} seats` : 'Enter seats'}</p>
                </div>
              </div>

              {/* Table Number Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Table Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  min="1"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Enter table number"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">Must be unique</p>
              </div>

              {/* Seats Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Seats <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={newTableSeats}
                  onChange={(e) => setNewTableSeats(e.target.value)}
                  min="1"
                  max="20"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="Enter number of seats"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum 20 seats</p>
              </div>

              {/* Info Note */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  <strong>Info:</strong> New tables are automatically set to "Available" status.
                  You can change the status later using the dropdown on the table card.
                </p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewTableNumber('');
                  setNewTableSeats('');
                }}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTable}
                className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Table
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && deletingTable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-red-600">Delete Table</h2>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletingTable(null);
                }}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Warning */}
              <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Trash2 className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-red-900 text-sm mb-1">Warning: This action cannot be undone</h3>
                    <p className="text-sm text-red-700">
                      You are about to permanently delete this table. All configuration will be lost.
                    </p>
                  </div>
                </div>
              </div>

              {/* Table Preview */}
              <div className="flex items-center justify-center gap-4 p-4 bg-gray-50 rounded-lg border-2 border-gray-300">
                <div className={`w-16 h-16 rounded-full ${getTableColor(deletingTable.status)} shadow-lg flex items-center justify-center text-white text-xl font-bold`}>
                  {deletingTable.number}
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900">Table {deletingTable.number}</p>
                  <p className="text-sm text-gray-600">{deletingTable.seats} seats</p>
                  <p className="text-xs text-gray-500 capitalize">Status: {deletingTable.status}</p>
                </div>
              </div>

              {/* Confirmation Text */}
              <p className="text-sm text-gray-700 text-center">
                Are you sure you want to delete <strong>Table {deletingTable.number}</strong>?
              </p>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletingTable(null);
                }}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Table
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Notification Modal */}
      {assignmentNotification && (
        <TableAssignmentNotification
          notification={assignmentNotification}
          onAssign={() => {
            assignToTable(
              assignmentNotification.queuedCustomer.orderId,
              [assignmentNotification.availableTable.number]
            );
          }}
          onCheckNext={() => {
            skipQueueCustomer(assignmentNotification.queuedCustomer.orderId);
          }}
          onCancel={dismissAssignmentNotification}
        />
      )}

      {/* Queue History Modal */}
      {showQueueHistory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-border">
              <h2 className="text-lg font-semibold text-primary">Queue History</h2>
              <button onClick={() => setShowQueueHistory(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-5">
              {queueHistory.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No queue history yet</p>
              ) : (
                <div className="space-y-3">
                  {queueHistory.map(entry => (
                    <div key={entry.id} className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="bg-primary text-white px-2 py-1 rounded text-xs font-medium">
                            Queue #{entry.queueNumber}
                          </span>
                          <h3 className="font-semibold">{entry.customerName}</h3>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          entry.status === 'Assigned' ? 'bg-green-100 text-green-800' :
                          entry.status === 'Skipped' ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {entry.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <p><strong>Party Size:</strong> {entry.partySize} people</p>
                        <p><strong>Required Seats:</strong> {entry.requiredSeats}</p>
                        <p><strong>Queue Time:</strong> {new Date(entry.queueTime).toLocaleTimeString()}</p>
                        {entry.timeAssigned && (
                          <p><strong>Time Assigned:</strong> {new Date(entry.timeAssigned).toLocaleTimeString()}</p>
                        )}
                        {entry.assignedTables && entry.assignedTables.length > 0 && (
                          <p><strong>Assigned Tables:</strong> {entry.assignedTables.map(t => `#${t}`).join(', ')}</p>
                        )}
                        <p className="col-span-2"><strong>Staff Action:</strong> {entry.staffAction}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Table History Modal */}
      {showTableHistory && selectedTableForHistory !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-border">
              <h2 className="text-lg font-semibold text-primary">Table {selectedTableForHistory} - History</h2>
              <button onClick={() => { setShowTableHistory(false); setSelectedTableForHistory(null); }} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-5">
              {(() => {
                const history = getTableHistory(selectedTableForHistory);
                return history.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No history for this table yet</p>
                ) : (
                  <div className="space-y-3">
                    {history.map(entry => (
                      <div key={entry.id} className="border border-border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold">{entry.customerName}</h3>
                            <p className="text-xs text-muted-foreground">Order ID: {entry.orderId}</p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            entry.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                          }`}>
                            {entry.paymentStatus}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                          <p><strong>Party Size:</strong> {entry.partySize} people</p>
                          <p><strong>Total Amount:</strong> ₱{entry.totalAmount.toFixed(2)}</p>
                          <p><strong>Time Occupied:</strong> {new Date(entry.timeOccupied).toLocaleString()}</p>
                          {entry.timeReleased && (
                            <p><strong>Time Released:</strong> {new Date(entry.timeReleased).toLocaleString()}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
