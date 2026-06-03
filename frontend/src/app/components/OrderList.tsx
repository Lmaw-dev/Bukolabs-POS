import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Page } from '../App';
import { X, Search, Eye, CreditCard, Printer, RotateCcw, CheckCircle, ChevronDown, Download, Users } from 'lucide-react';
import { useOrders, Order } from '../context/OrderContext';
import { ThermalReceipt } from './ThermalReceipt';

interface OrderListProps {
  onNavigate: (page: Page) => void;
  onLogout: () => void;
  isAdmin?: boolean;
}

type ActiveModal = 'details' | 'payment' | 'payment-success' | 'receipt' | 'refund' | null;

const ORDER_STATUSES = ['Pending', 'Preparing', 'Ready', 'Served', 'Completed'];
const ORDER_TYPES = ['Dine-In', 'Takeout', 'Mixed'];
const PAYMENT_STATUSES = ['Paid', 'Not Paid'];

function generateId(prefix: string) {
  return `${prefix}-${Date.now().toString().slice(-6)}`;
}

export function OrderList({ onNavigate, onLogout, isAdmin = false }: OrderListProps) {
  const { orders, updateOrder, removeOrder, completePayment } = useOrders();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [cashReceived, setCashReceived] = useState('');
  const [changeAmount, setChangeAmount] = useState(0);
  const [currentPaymentId, setCurrentPaymentId] = useState('');
  const [currentReceiptId, setCurrentReceiptId] = useState('');
  const [refundReason, setRefundReason] = useState('');

  const openModal = (order: Order, modal: ActiveModal) => {
    setSelectedOrder(order);
    setActiveModal(modal);
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedOrder(null);
    setCashReceived('');
    setChangeAmount(0);
    setRefundReason('');
  };

  const handleConfirmPayment = () => {
    if (!selectedOrder) return;
    const cash = parseFloat(cashReceived);
    if (cash < selectedOrder.amountNumber) return;

    const change = cash - selectedOrder.amountNumber;
    const pId = generateId('PAY');
    const rId = generateId('REC');

    setChangeAmount(change);
    setCurrentPaymentId(pId);
    setCurrentReceiptId(rId);

    // Use completePayment to trigger table release and queue notifications
    completePayment(selectedOrder.id, { cashReceived: cash, changeGiven: change });

    const updates = { paymentStatus: 'Paid' as const, orderStatus: 'Completed' as const, paymentId: pId, receiptId: rId, cashReceived: cash, changeGiven: change };
    setSelectedOrder(prev => prev ? { ...prev, ...updates } : null);
    setActiveModal('payment-success');
  };

  const handleCloseReceiptAfterPayment = () => {
    closeModal();
  };

  const handleRefundSubmit = () => {
    if (!selectedOrder || !refundReason.trim()) return;
    removeOrder(selectedOrder.id);
    closeModal();
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const cashFloat = parseFloat(cashReceived) || 0;
  const isEnough = selectedOrder ? cashFloat >= selectedOrder.amountNumber : false;

  const filteredOrders = orders.filter(order => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term ||
      order.id.toLowerCase().includes(term) ||
      order.customer.toLowerCase().includes(term);
    const matchesType = typeFilter === 'All' || order.type === typeFilter;
    const matchesPayment = paymentFilter === 'All' || order.paymentStatus === paymentFilter;
    const matchesStatus = statusFilter === 'All' || order.orderStatus === statusFilter;
    const matchesDate = !dateFilter || order.date === dateFilter;
    return matchesSearch && matchesType && matchesPayment && matchesStatus && matchesDate;
  });

  const getPaymentBadge = (status: string) => {
    if (status === 'Paid') return 'bg-[#dcfce7] text-[#15803d]';
    return 'bg-[#fef2f2] text-[#ef4444]';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-[#dcfce7] text-[#15803d]';
      case 'Served': return 'bg-[#f0fdf4] text-[#10b981]';
      case 'Ready': return 'bg-[#f0fdf4] text-[#10b981]';
      case 'Preparing': return 'bg-[#f5f3ff] text-[#8b5cf6]';
      case 'Pending': return 'bg-[#fffbeb] text-[#f59e0b]';
      default: return 'bg-[#f1f5f9] text-[#64748b]';
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'Dine-In': return 'bg-[#eff6ff] text-[#3b82f6]';
      case 'Takeout': return 'bg-[#fff7ed] text-[#d97706]';
      case 'Mixed': return 'bg-[#f5f3ff] text-[#8b5cf6]';
      default: return 'bg-[#f1f5f9] text-[#64748b]';
    }
  };

  const dineInItems = selectedOrder?.items.filter(i => i.itemType === 'dine-in') ?? [];
  const takeoutItems = selectedOrder?.items.filter(i => i.itemType === 'takeout') ?? [];
  const isMixed = selectedOrder?.type === 'Mixed';

  return (
    <div className="flex h-screen bg-background">
      <Sidebar currentPage="order-list" onNavigate={onNavigate} onLogout={onLogout} isAdmin={isAdmin} />

      <div className="flex-1 overflow-auto p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-[28px] text-primary" style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, letterSpacing: '0.04em' }}>
            ORDER LIST
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage and track all restaurant orders</p>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-5">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search by Order ID or Customer..."
                className="w-full pl-9 pr-4 py-2.5 bg-muted border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            {/* Type Filter */}
            <div className="relative">
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2.5 bg-muted border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
              >
                <option value="All">All Types</option>
                {ORDER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>

            {/* Payment Filter */}
            <div className="relative">
              <select
                value={paymentFilter}
                onChange={e => setPaymentFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2.5 bg-muted border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
              >
                <option value="All">All Payments</option>
                {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2.5 bg-muted border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
              >
                <option value="All">All Statuses</option>
                {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>

            {/* Date Filter */}
            <div className="relative">
              <input
                type="date"
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                className="pl-3 pr-3 py-2.5 bg-muted border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
              />
            </div>

            <span className="text-xs text-gray-400 ml-auto">{filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="bg-primary">
                  <th className="text-left px-5 py-3.5 text-xs text-white/80 uppercase tracking-wider">Order #</th>
                  <th className="text-left px-4 py-3.5 text-xs text-white/80 uppercase tracking-wider">Customer</th>
                  <th className="text-left px-4 py-3.5 text-xs text-white/80 uppercase tracking-wider">Type</th>
                  <th className="text-left px-4 py-3.5 text-xs text-white/80 uppercase tracking-wider">Table</th>
                  <th className="text-left px-4 py-3.5 text-xs text-white/80 uppercase tracking-wider">Party</th>
                  <th className="text-left px-4 py-3.5 text-xs text-white/80 uppercase tracking-wider">Queue</th>
                  <th className="text-left px-4 py-3.5 text-xs text-white/80 uppercase tracking-wider">Total</th>
                  <th className="text-left px-4 py-3.5 text-xs text-white/80 uppercase tracking-wider">Payment</th>
                  <th className="text-left px-4 py-3.5 text-xs text-white/80 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3.5 text-xs text-white/80 uppercase tracking-wider">Date & Time</th>
                  <th className="text-center px-4 py-3.5 text-xs text-white/80 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center py-16 text-gray-400 text-sm">
                      No orders found matching your filters.
                    </td>
                  </tr>
                ) : filteredOrders.map((order, idx) => {
                  const waitingTime = order.isQueued ? Math.floor((new Date().getTime() - new Date(`${order.date} ${order.time}`).getTime()) / 60000) : 0;

                  return (<tr key={order.id} className={`hover:bg-[#f4f6fb]/60 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-[#fafbfd]'}`}>
                    <td className="px-5 py-4">
                      <span className="text-sm text-primary font-medium">{order.orderNumber || order.id}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-800">{order.customer}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${getTypeBadge(order.type)}`}>
                        {order.type}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-600">{order.table}</span>
                    </td>
                    <td className="px-4 py-4">
                      {order.partySize ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                          <Users className="w-3 h-3" />
                          {order.partySize}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {order.isQueued ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="inline-flex items-center justify-center w-fit px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-medium rounded-full">
                            #{order.queuePosition}
                          </span>
                          <span className="text-xs text-gray-500">{waitingTime} min</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-900 font-medium">₱{order.amountNumber.toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${getPaymentBadge(order.paymentStatus)}`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(order.orderStatus)}`}>
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-xs text-gray-600">{order.date}</div>
                      <div className="text-xs text-gray-400">{order.time}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* View Details - always */}
                        <button
                          onClick={() => openModal(order, 'details')}
                          title="View Details"
                          className="p-1.5 bg-gray-100 hover:bg-primary hover:text-white text-gray-600 rounded-lg transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Process Payment - only if Not Paid */}
                        {order.paymentStatus === 'Not Paid' && (
                          <button
                            onClick={() => openModal(order, 'payment')}
                            title="Process Payment"
                            className="p-1.5 bg-primary/10 hover:bg-primary hover:text-white text-primary rounded-lg transition-colors"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Receipt - only if Paid */}
                        {order.paymentStatus === 'Paid' && (
                          <button
                            onClick={() => openModal(order, 'receipt')}
                            title="View Receipt"
                            className="p-1.5 bg-primary/10 hover:bg-primary hover:text-white text-primary rounded-lg transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Refund - only if Paid */}
                        {order.paymentStatus === 'Paid' && (
                          <button
                            onClick={() => openModal(order, 'refund')}
                            title="Process Refund"
                            className="p-1.5 bg-red-50 hover:bg-red-500 hover:text-white text-red-500 rounded-lg transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>);
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── MODAL: View Details ── */}
      {activeModal === 'details' && selectedOrder && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-base text-gray-900" style={{ fontWeight: 600 }}>Order Details</h2>
                <p className="text-xs text-gray-400">{selectedOrder.orderNumber || selectedOrder.id}</p>
              </div>
              <button onClick={closeModal} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Customer</p>
                  <p className="text-sm text-gray-800" style={{ fontWeight: 600 }}>{selectedOrder.customer}</p>
                </div>
                <div className="bg-muted rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Order Type</p>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getTypeBadge(selectedOrder.type)}`}>
                    {selectedOrder.type}
                  </span>
                </div>
                <div className="bg-muted rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Table</p>
                  <p className="text-sm text-gray-800">{selectedOrder.table}</p>
                </div>
                <div className="bg-muted rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Date & Time</p>
                  <p className="text-sm text-gray-800">{selectedOrder.date} · {selectedOrder.time}</p>
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentBadge(selectedOrder.paymentStatus)}`}>
                  {selectedOrder.paymentStatus}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedOrder.orderStatus)}`}>
                  {selectedOrder.orderStatus}
                </span>
              </div>

              {/* Items */}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Order Items</p>
                {isMixed ? (
                  <>
                    {dineInItems.length > 0 && (
                      <>
                        <p className="text-xs text-blue-600 font-medium mb-1.5">Dine-In</p>
                        <div className="space-y-2 mb-3">
                          {dineInItems.map((item, i) => (
                            <div key={i} className="flex justify-between text-sm text-gray-700">
                              <span>{item.quantity}× {item.name}</span>
                              <span>₱{(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                    {takeoutItems.length > 0 && (
                      <>
                        <p className="text-xs text-amber-600 font-medium mb-1.5">Takeout</p>
                        <div className="space-y-2">
                          {takeoutItems.map((item, i) => (
                            <div key={i} className="flex justify-between text-sm text-gray-700">
                              <span>{item.quantity}× {item.name}</span>
                              <span>₱{(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="space-y-2">
                    {selectedOrder.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm text-gray-700 border-b border-gray-50 pb-2">
                        <span>{item.quantity}× {item.name}</span>
                        <span>₱{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="bg-muted rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>₱{selectedOrder.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Service Fee (1%)</span>
                  <span>₱{selectedOrder.serviceFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Tax (12%)</span>
                  <span>₱{selectedOrder.tax.toFixed(2)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-xs text-red-500">
                    <span>Discount ({selectedOrder.discountType} 20%)</span>
                    <span>− ₱{selectedOrder.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-primary border-t border-gray-200 pt-2" style={{ fontWeight: 700 }}>
                  <span>Total</span>
                  <span>₱{selectedOrder.amountNumber.toFixed(2)}</span>
                </div>
              </div>

              {selectedOrder.paymentStatus === 'Not Paid' && (
                <button
                  onClick={() => setActiveModal('payment')}
                  className="w-full py-3 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                  style={{ fontWeight: 600 }}
                >
                  <CreditCard className="w-4 h-4" />
                  Process Payment
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Payment ── */}
      {activeModal === 'payment' && selectedOrder && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h2 className="text-base text-gray-900" style={{ fontWeight: 600 }}>Process Payment</h2>
              <button onClick={closeModal} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Order Summary */}
              <div className="bg-muted rounded-xl p-4 space-y-2">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Order {selectedOrder.id} — {selectedOrder.customer}</p>
                {selectedOrder.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-xs text-gray-600">
                    <span>{item.quantity}× {item.name}</span>
                    <span>₱{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t border-gray-200 pt-2 space-y-1">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Subtotal</span>
                    <span>₱{selectedOrder.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Service Fee (1%)</span>
                    <span>₱{selectedOrder.serviceFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Tax (12%)</span>
                    <span>₱{selectedOrder.tax.toFixed(2)}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between text-xs text-red-500">
                      <span>Discount ({selectedOrder.discountType} 20%)</span>
                      <span>− ₱{selectedOrder.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-primary pt-1" style={{ fontWeight: 700 }}>
                    <span>Total Amount Due</span>
                    <span>₱{selectedOrder.amountNumber.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Cash Input */}
              <div>
                <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 500 }}>Cash Received</label>
                <input
                  type="number"
                  value={cashReceived}
                  onChange={e => setCashReceived(e.target.value)}
                  placeholder="Enter amount"
                  autoFocus
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-muted"
                />
              </div>

              {/* Change Preview */}
              {cashReceived && isEnough && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                  <p className="text-xs text-emerald-600 mb-1">Change</p>
                  <p className="text-2xl text-emerald-700" style={{ fontWeight: 700 }}>₱{(cashFloat - selectedOrder.amountNumber).toFixed(2)}</p>
                </div>
              )}
              {cashReceived && !isEnough && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                  <p className="text-xs text-red-500">Insufficient amount. Need ₱{(selectedOrder.amountNumber - cashFloat).toFixed(2)} more.</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={closeModal}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmPayment}
                  disabled={!isEnough}
                  className="flex-1 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ fontWeight: 600 }}
                >
                  Confirm Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Payment Successful ── */}
      {activeModal === 'payment-success' && selectedOrder && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col">
            <div className="flex justify-end px-6 pt-4">
              <button onClick={closeModal} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="px-6 pb-6 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-lg text-gray-900 mb-1" style={{ fontWeight: 700 }}>Payment Successful!</h2>
              <p className="text-sm text-gray-400 mb-6">Order {selectedOrder.id} has been paid and marked as completed.</p>

              <div className="bg-muted rounded-xl p-4 text-left space-y-2 mb-6">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Payment ID</span>
                  <span className="text-gray-800 font-medium">{currentPaymentId}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Receipt ID</span>
                  <span className="text-gray-800 font-medium">{currentReceiptId}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Order ID</span>
                  <span className="text-gray-800 font-medium">{selectedOrder.id}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 space-y-1">
                  <div className="flex justify-between text-sm text-gray-700">
                    <span>Total Amount Due</span>
                    <span style={{ fontWeight: 600 }}>₱{selectedOrder.amountNumber.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-700">
                    <span>Amount Received</span>
                    <span>₱{(selectedOrder.cashReceived ?? cashFloat).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span style={{ fontWeight: 600 }}>Change</span>
                    <span style={{ fontWeight: 700 }}>₱{changeAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={closeModal}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => setActiveModal('receipt')}
                  className="flex-1 py-3 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                  style={{ fontWeight: 600 }}
                >
                  <Printer className="w-4 h-4" />
                  Print Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Receipt (Thermal Style) ── */}
      {activeModal === 'receipt' && selectedOrder && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl flex flex-col my-8">
            <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm text-gray-700" style={{ fontWeight: 600 }}>Receipt Preview</h2>
              <button onClick={handleCloseReceiptAfterPayment} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <ThermalReceipt
              orderNumber={selectedOrder.id}
              customerName={selectedOrder.customer}
              orderType={selectedOrder.type as 'Dine-In' | 'Takeout' | 'Mixed'}
              table={selectedOrder.table !== '—' ? selectedOrder.table : undefined}
              items={selectedOrder.items.map(item => ({
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                itemType: item.itemType,
              }))}
              subtotal={selectedOrder.subtotal}
              serviceFee={selectedOrder.serviceFee}
              tax={selectedOrder.tax}
              discount={selectedOrder.discount}
              discountType={selectedOrder.discountType}
              total={selectedOrder.amountNumber}
              cashReceived={selectedOrder.cashReceived ?? cashFloat}
              changeGiven={selectedOrder.changeGiven ?? changeAmount}
              date={selectedOrder.date}
              time={selectedOrder.time}
              receiptId={selectedOrder.receiptId || currentReceiptId}
              paymentId={selectedOrder.paymentId || currentPaymentId}
            />

            {/* Actions */}
            <div className="px-5 py-4 border-t border-gray-100 flex gap-2">
              <button
                onClick={handleCloseReceiptAfterPayment}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={handlePrintReceipt}
                className="flex-1 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                style={{ fontWeight: 600 }}
              >
                <Printer className="w-3.5 h-3.5" />
                Print
              </button>
              <button
                onClick={handlePrintReceipt}
                title="Download Receipt"
                className="py-2.5 px-3 border border-primary/20 text-primary hover:bg-primary/10 rounded-xl text-sm transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Refund ── */}
      {activeModal === 'refund' && selectedOrder && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
              <h2 className="text-base text-red-600" style={{ fontWeight: 600 }}>Process Refund</h2>
              <button onClick={closeModal} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                <p className="text-sm text-red-700 mb-1" style={{ fontWeight: 600 }}>⚠ Refund Warning</p>
                <p className="text-xs text-red-500">This will process a full refund for this order. This action cannot be undone.</p>
              </div>

              <div className="bg-muted rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Order #</span>
                  <span className="text-gray-800 font-medium">{selectedOrder.id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Customer</span>
                  <span className="text-gray-800">{selectedOrder.customer}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Refund Amount</span>
                  <span className="text-red-600" style={{ fontWeight: 700 }}>₱{selectedOrder.amountNumber.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-2" style={{ fontWeight: 500 }}>Reason for Refund *</label>
                <textarea
                  value={refundReason}
                  onChange={e => setRefundReason(e.target.value)}
                  placeholder="Enter the reason for this refund..."
                  autoFocus
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 bg-muted resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={closeModal}
                  className="flex-1 py-3 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRefundSubmit}
                  disabled={!refundReason.trim()}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ fontWeight: 600 }}
                >
                  Process Refund
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
