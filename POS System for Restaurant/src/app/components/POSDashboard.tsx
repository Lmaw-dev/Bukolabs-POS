import { useState, useMemo } from 'react';
import { Sidebar } from './Sidebar';
import { Page } from '../App';
import { useOrders } from '../context/OrderContext';
import { useTables } from '../context/TableContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, UtensilsCrossed, X } from 'lucide-react';

interface POSDashboardProps {
  onLogout: () => void;
  onNavigate: (page: Page) => void;
  isAdmin?: boolean;
}

export function POSDashboard({ onLogout, onNavigate, isAdmin = false }: POSDashboardProps) {
  const { orders, queuedOrders } = useOrders();
  const { tables, getAvailableTablesCount } = useTables();
  const [dateFilter, setDateFilter] = useState('this-month');
  const [showTopItemsModal, setShowTopItemsModal] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const todayOrders = orders.filter(o => o.date === today);
  const totalSalesToday = todayOrders.filter(o => o.paymentStatus === 'Paid').reduce((sum, o) => sum + o.amountNumber, 0);
  const activeOrders = orders.filter(o => o.paymentStatus === 'Not Paid' && o.orderStatus !== 'Completed').length;
  const recentOrders = [...orders].slice(0, 5);

  // Get available tables from TableContext
  const availableTables = getAvailableTablesCount();
  const totalTables = tables.length;

  // Calculate queue statistics
  const customersWaiting = queuedOrders.length;
  const peopleWaiting = queuedOrders.reduce((sum, order) => sum + (order.partySize || 0), 0);

  // Calculate table status breakdown
  const occupiedTables = tables.filter(t => t.status === 'occupied').length;
  const maintenanceTables = tables.filter(t => t.status === 'maintenance').length;

  const salesDataByFilter = {
    'this-week': [
      { id: 'week-mon', label: 'Mon', sales: 8500 },
      { id: 'week-tue', label: 'Tue', sales: 9200 },
      { id: 'week-wed', label: 'Wed', sales: 8800 },
      { id: 'week-thu', label: 'Thu', sales: 11000 },
      { id: 'week-fri', label: 'Fri', sales: 12500 },
      { id: 'week-sat', label: 'Sat', sales: 14000 },
      { id: 'week-sun', label: 'Sun', sales: 13200 },
    ],
    'this-month': [
      { id: 'month-w1', label: 'Week 1', sales: 45000 },
      { id: 'month-w2', label: 'Week 2', sales: 52000 },
      { id: 'month-w3', label: 'Week 3', sales: 48000 },
      { id: 'month-w4', label: 'Week 4', sales: 61000 },
    ],
    'last-month': [
      { id: 'lastmonth-w1', label: 'Week 1', sales: 38000 },
      { id: 'lastmonth-w2', label: 'Week 2', sales: 42000 },
      { id: 'lastmonth-w3', label: 'Week 3', sales: 45000 },
      { id: 'lastmonth-w4', label: 'Week 4', sales: 51000 },
    ],
    'this-year': [
      { id: 'year-jan', label: 'Jan', sales: 165000 },
      { id: 'year-feb', label: 'Feb', sales: 178000 },
      { id: 'year-mar', label: 'Mar', sales: 192000 },
      { id: 'year-apr', label: 'Apr', sales: 205000 },
      { id: 'year-may', label: 'May', sales: 284500 },
    ],
  };

  const salesData = useMemo(() => {
    return salesDataByFilter[dateFilter as keyof typeof salesDataByFilter] || salesDataByFilter['this-month'];
  }, [dateFilter]);

  const allTopSellingItems = [
    {
      id: 'item-1',
      name: 'Chicken Adobo',
      sold: 145,
      revenue: '₱21,750',
      image: 'https://images.unsplash.com/photo-1596699917234-1c93c61a1083?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200&h=200'
    },
    {
      id: 'item-2',
      name: 'Pork Sinigang',
      sold: 128,
      revenue: '₱23,040',
      image: 'https://images.unsplash.com/photo-1583913459026-781129ce061f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200&h=200'
    },
    {
      id: 'item-3',
      name: 'Beef Caldereta',
      sold: 98,
      revenue: '₱21,560',
      image: 'https://images.unsplash.com/photo-1608500218861-01091cdc501e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200&h=200'
    },
    {
      id: 'item-4',
      name: 'Sisig',
      sold: 87,
      revenue: '₱10,440',
      image: 'https://images.unsplash.com/photo-1658713064117-51f51ecfaf69?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200&h=200'
    },
    {
      id: 'item-5',
      name: 'Spring Rolls',
      sold: 76,
      revenue: '₱6,080',
      image: 'https://images.unsplash.com/photo-1534674343483-e7df7f1c69c3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200&h=200'
    },
    {
      id: 'item-6',
      name: 'Halo-Halo',
      sold: 68,
      revenue: '₱6,460',
      image: 'https://images.unsplash.com/photo-1591921954568-c7358607c1c2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200&h=200'
    },
    {
      id: 'item-7',
      name: 'Pancit Canton',
      sold: 62,
      revenue: '₱7,440',
      image: 'https://images.unsplash.com/photo-1534674343483-e7df7f1c69c3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200&h=200'
    },
    {
      id: 'item-8',
      name: 'Lechon Kawali',
      sold: 55,
      revenue: '₱13,200',
      image: 'https://images.unsplash.com/photo-1596699917234-1c93c61a1083?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=200&h=200'
    },
  ];

  const topSellingItems = allTopSellingItems.slice(0, 4);


  return (
    <div className="flex h-screen">
      <Sidebar currentPage="pos-dashboard" onNavigate={onNavigate} onLogout={onLogout} isAdmin={isAdmin} />

      <div className="flex-1 overflow-auto bg-background">
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl text-primary mb-1">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Welcome back! Here's what's happening today.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-card rounded-xl shadow-sm border border-border p-5">
              <p className="text-sm text-muted-foreground mb-1">Total Sales Today</p>
              <h2 className="text-2xl text-primary">₱{totalSalesToday.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
            </div>
            <div className="bg-card rounded-xl shadow-sm border border-border p-5">
              <p className="text-sm text-muted-foreground mb-1">Orders Today</p>
              <h2 className="text-2xl text-primary">{todayOrders.length}</h2>
            </div>
            <div className="bg-card rounded-xl shadow-sm border border-border p-5">
              <p className="text-sm text-muted-foreground mb-1">Active Orders</p>
              <h2 className="text-2xl text-primary">{activeOrders}</h2>
            </div>
            <div className="bg-card rounded-xl shadow-sm border border-border p-5">
              <p className="text-sm text-muted-foreground mb-1">Available Tables</p>
              <h2 className="text-2xl text-primary">{availableTables} / {totalTables}</h2>
              <p className="text-xs text-muted-foreground mt-1">
                {occupiedTables} Occupied · {maintenanceTables} Maintenance
              </p>
            </div>
            <div className="bg-card rounded-xl shadow-sm border border-border p-5">
              <p className="text-sm text-muted-foreground mb-1">Customers Waiting</p>
              <h2 className="text-2xl text-primary">{customersWaiting}</h2>
              <p className="text-xs text-muted-foreground mt-1">
                {customersWaiting > 0 ? `Next: Queue #${queuedOrders[0]?.queuePosition || 1}` : 'No queue'}
              </p>
            </div>
            <div className="bg-card rounded-xl shadow-sm border border-border p-5">
              <p className="text-sm text-muted-foreground mb-1">People Waiting</p>
              <h2 className="text-2xl text-primary">{peopleWaiting}</h2>
              <p className="text-xs text-muted-foreground mt-1">
                {peopleWaiting > 0 ? `Total party sizes in queue` : 'No one waiting'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="lg:col-span-2 bg-card rounded-xl shadow-sm border border-border p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base text-primary">Sales Overview</h3>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="px-2.5 py-1 border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
                  >
                    <option value="this-week">This Week</option>
                    <option value="this-month">This Month</option>
                    <option value="last-month">Last Month</option>
                    <option value="this-year">This Year</option>
                  </select>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={salesData} key={dateFilter}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="label"
                    stroke="#6b7280"
                    style={{ fontSize: '11px' }}
                  />
                  <YAxis
                    stroke="#6b7280"
                    style={{ fontSize: '11px' }}
                    tickFormatter={(value) => `₱${value / 1000}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      fontSize: '12px'
                    }}
                    formatter={(value: number) => [`₱${value.toLocaleString()}`, 'Sales']}
                  />
                  <Line
                    key={`line-${dateFilter}`}
                    type="monotone"
                    dataKey="sales"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-card rounded-xl shadow-sm border border-border p-5">
              <h3 className="text-base text-primary mb-4">Top Selling Items</h3>
              <div className="space-y-2 mb-3">
                {topSellingItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-12 h-12 rounded-lg overflow-hidden shadow-sm border border-border flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-xs">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.sold} sold</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowTopItemsModal(true)}
                className="w-full text-xs text-primary hover:underline py-2"
              >
                See all
              </button>
            </div>
          </div>

          <div className="bg-card rounded-xl shadow-sm border border-border p-5 mb-4">
            <h3 className="text-base text-primary mb-3">Order Summary</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Dine-in</p>
                <p className="text-xl text-primary">{orders.filter(o => o.type === 'Dine-In').length}</p>
              </div>
              <div className="text-center border-x border-border">
                <p className="text-xs text-muted-foreground mb-1">Take-out</p>
                <p className="text-xl text-primary">{orders.filter(o => o.type === 'Takeout').length}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">Total Orders</p>
                <p className="text-xl text-primary">{orders.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl shadow-sm border border-border">
            <div className="p-5 border-b border-border flex justify-between items-center">
              <h3 className="text-base text-primary">Recent Orders</h3>
              <button
                onClick={() => onNavigate('create-order')}
                className="bg-secondary text-secondary-foreground px-5 py-2 rounded-lg hover:bg-secondary/90 transition-colors flex items-center gap-2 text-sm"
              >
                <UtensilsCrossed className="w-4 h-4" />
                Get Orders
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs">Order ID</th>
                    <th className="px-4 py-3 text-left text-xs">Customer Name</th>
                    <th className="px-4 py-3 text-left text-xs">Type</th>
                    <th className="px-4 py-3 text-left text-xs">Table</th>
                    <th className="px-4 py-3 text-left text-xs">Amount</th>
                    <th className="px-4 py-3 text-left text-xs">Time</th>
                    <th className="px-4 py-3 text-left text-xs">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-sm text-muted-foreground">No orders yet.</td>
                    </tr>
                  ) : recentOrders.map((order) => (
                    <tr key={order.id} className="border-t border-border hover:bg-muted/50">
                      <td className="px-4 py-3 text-sm">#{order.id}</td>
                      <td className="px-4 py-3 text-sm">{order.customer}</td>
                      <td className="px-4 py-3 text-sm">{order.type}</td>
                      <td className="px-4 py-3 text-sm">{order.table}</td>
                      <td className="px-4 py-3 text-sm">₱{order.amountNumber.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td className="px-4 py-3 text-sm">{order.time}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs ${
                          order.orderStatus === 'Completed' ? 'bg-green-100 text-green-800' :
                          order.orderStatus === 'Served' ? 'bg-blue-100 text-blue-800' :
                          order.orderStatus === 'Ready' ? 'bg-purple-100 text-purple-800' :
                          order.orderStatus === 'Preparing' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.orderStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {showTopItemsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-border">
              <h2 className="text-lg text-primary">All Top Selling Items</h2>
              <button
                onClick={() => setShowTopItemsModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(80vh-80px)]">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#0f172a]">
                    <th className="sticky top-0 bg-[#0f172a] px-4 py-3 text-left text-xs font-semibold text-emerald-400 uppercase tracking-widest z-10 shadow-[0_1px_0_0_#10b981]">Rank</th>
                    <th className="sticky top-0 bg-[#0f172a] px-4 py-3 text-left text-xs font-semibold text-emerald-400 uppercase tracking-widest z-10 shadow-[0_1px_0_0_#10b981]">Item</th>
                    <th className="sticky top-0 bg-[#0f172a] px-4 py-3 text-left text-xs font-semibold text-emerald-400 uppercase tracking-widest z-10 shadow-[0_1px_0_0_#10b981]">Sold</th>
                    <th className="sticky top-0 bg-[#0f172a] px-4 py-3 text-left text-xs font-semibold text-emerald-400 uppercase tracking-widest z-10 shadow-[0_1px_0_0_#10b981]">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {allTopSellingItems.map((item, index) => (
                    <tr key={item.id} className="border-t border-border hover:bg-muted/50">
                      <td className="px-3 py-3">
                        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs">
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-12 h-12 rounded-lg overflow-hidden shadow-sm border border-border flex-shrink-0">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="text-sm">{item.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-sm">{item.sold} orders</td>
                      <td className="px-3 py-3 text-sm text-primary">{item.revenue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
