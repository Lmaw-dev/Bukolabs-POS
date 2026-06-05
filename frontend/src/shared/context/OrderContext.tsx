import { createContext, useContext, useState, useRef, ReactNode } from 'react';

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  itemType?: 'dine-in' | 'takeout';
}

export interface Order {
  id: string;
  orderNumber?: string;
  customer: string;
  type: 'Dine-In' | 'Takeout' | 'Mixed';
  table: string;
  amountNumber: number;
  subtotal: number;
  serviceFee: number;
  tax: number;
  discount: number;
  discountType?: string;
  paymentStatus: 'Paid' | 'Not Paid';
  orderStatus: 'Pending' | 'Preparing' | 'Ready' | 'Served' | 'Completed';
  date: string;
  time: string;
  items: OrderItem[];
  paymentId?: string;
  receiptId?: string;
  cashReceived?: number;
  changeGiven?: number;
  cashier?: string;
  queuePosition?: number;
  isQueued?: boolean;
  partySize?: number;
  tableNumbers?: number[];
  requiredSeats?: number;
}

export interface QueuedOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  items: number;
  total: number;
  timestamp: Date;
  queuePosition: number;
  partySize?: number;
  requiredSeats?: number;
}

export interface TableStatus {
  number: number;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  orderId?: string;
}

const initialOrders: Order[] = [
  {
    id: '000001',
    customer: 'Juan Dela Cruz',
    type: 'Dine-In',
    table: 'Table 5',
    amountNumber: 1430.00,
    subtotal: 1250.00,
    serviceFee: 12.50,
    tax: 150.00,
    discount: 0,
    paymentStatus: 'Paid',
    orderStatus: 'Completed',
    date: '2026-05-28',
    time: '10:30 AM',
    items: [
      { name: 'Truffle Pasta', quantity: 2, price: 380, itemType: 'dine-in' },
      { name: 'Grilled Salmon', quantity: 1, price: 490, itemType: 'dine-in' },
    ],
    partySize: 3,
    paymentId: 'PAY-001234',
    receiptId: 'REC-001234',
    cashReceived: 1500,
    changeGiven: 70,
  },
  {
    id: '000002',
    customer: 'Maria Santos',
    type: 'Dine-In',
    table: 'Table 3',
    amountNumber: 2850.00,
    subtotal: 2700.00,
    serviceFee: 27.00,
    tax: 324.00,
    discount: 540.00,
    discountType: 'Senior Citizen',
    paymentStatus: 'Paid',
    orderStatus: 'Completed',
    date: '2026-05-28',
    time: '11:15 AM',
    items: [
      { name: 'Wagyu Steak', quantity: 2, price: 890, itemType: 'dine-in' },
      { name: 'Lobster Thermidor', quantity: 1, price: 650, itemType: 'dine-in' },
      { name: 'Tiramisu', quantity: 2, price: 135, itemType: 'dine-in' },
    ],
    partySize: 5,
    paymentId: 'PAY-001235',
    receiptId: 'REC-001235',
    cashReceived: 3000,
    changeGiven: 150,
  },
  {
    id: '000003',
    customer: 'Mark Reyes',
    type: 'Takeout',
    table: '—',
    amountNumber: 320.00,
    subtotal: 285.00,
    serviceFee: 2.85,
    tax: 34.20,
    discount: 0,
    paymentStatus: 'Paid',
    orderStatus: 'Completed',
    date: '2026-05-28',
    time: '12:00 PM',
    items: [
      { name: 'Caesar Salad', quantity: 1, price: 180, itemType: 'takeout' },
      { name: 'Lemonade', quantity: 1, price: 105, itemType: 'takeout' },
    ],
    paymentId: 'PAY-001236',
    receiptId: 'REC-001236',
    cashReceived: 350,
    changeGiven: 30,
  },
  {
    id: '000004',
    customer: 'Anna Lim',
    type: 'Takeout',
    table: '—',
    amountNumber: 215.00,
    subtotal: 190.00,
    serviceFee: 1.90,
    tax: 22.80,
    discount: 0,
    paymentStatus: 'Not Paid',
    orderStatus: 'Ready',
    date: '2026-05-28',
    time: '01:20 PM',
    items: [
      { name: 'Mushroom Soup', quantity: 1, price: 120, itemType: 'takeout' },
      { name: 'Iced Tea', quantity: 1, price: 70, itemType: 'takeout' },
    ],
  },
  {
    id: '000005',
    customer: 'Angel Cruize',
    type: 'Dine-In',
    table: 'Table 7',
    amountNumber: 1850.00,
    subtotal: 1640.00,
    serviceFee: 16.40,
    tax: 196.80,
    discount: 0,
    partySize: 4,
    paymentStatus: 'Not Paid',
    orderStatus: 'Served',
    date: '2026-05-28',
    time: '02:45 PM',
    items: [
      { name: 'Chicken Burger', quantity: 3, price: 320, itemType: 'dine-in' },
      { name: 'Spring Rolls', quantity: 2, price: 130, itemType: 'dine-in' },
      { name: 'Sparkling Water', quantity: 2, price: 85, itemType: 'dine-in' },
    ],
  },
  {
    id: '000006',
    customer: 'Jely Gomez',
    type: 'Mixed',
    table: 'Table 2',
    amountNumber: 1280.00,
    subtotal: 1130.00,
    serviceFee: 11.30,
    tax: 135.60,
    discount: 0,
    partySize: 2,
    paymentStatus: 'Not Paid',
    orderStatus: 'Preparing',
    date: '2026-05-28',
    time: '03:10 PM',
    items: [
      { name: 'Wagyu Steak', quantity: 1, price: 890, itemType: 'dine-in' },
      { name: 'Caesar Salad', quantity: 1, price: 180, itemType: 'takeout' },
      { name: 'Lemonade', quantity: 1, price: 105, itemType: 'takeout' },
    ],
  },
  {
    id: '000007',
    customer: 'Sophie Alvarez',
    type: 'Dine-In',
    table: 'Table 9',
    amountNumber: 980.00,
    subtotal: 870.00,
    serviceFee: 8.70,
    tax: 104.40,
    discount: 0,
    partySize: 2,
    paymentStatus: 'Not Paid',
    orderStatus: 'Pending',
    date: '2026-05-28',
    time: '04:30 PM',
    items: [
      { name: 'Red Wine', quantity: 2, price: 350, itemType: 'dine-in' },
      { name: 'Cheese Platter', quantity: 1, price: 170, itemType: 'dine-in' },
    ],
  },
];

interface OrderContextType {
  orders: Order[];
  queuedOrders: QueuedOrder[];
  addOrder: (order: Omit<Order, 'id'>) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  removeOrder: (id: string) => void;
  removeFromQueue: (id: string) => void;
  completePayment: (orderId: string, paymentData: { cashReceived: number; changeGiven: number; cashier?: string }) => void;
  paymentCompletedSignal: number; // Signal for when payment is completed
}

const OrderContext = createContext<OrderContextType | null>(null);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const nextId = useRef(initialOrders.length + 1);
  const [paymentCompletedSignal, setPaymentCompletedSignal] = useState(0);

  // Derive queued orders from orders with isQueued = true
  const queuedOrders: QueuedOrder[] = orders
    .filter(o => o.isQueued && o.paymentStatus === 'Not Paid')
    .sort((a, b) => (a.queuePosition || 0) - (b.queuePosition || 0))
    .map(o => ({
      id: o.id,
      orderNumber: o.orderNumber || o.id,
      customerName: o.customer,
      items: o.items.length,
      total: o.amountNumber,
      timestamp: new Date(`${o.date} ${o.time}`),
      queuePosition: o.queuePosition || 0,
      partySize: o.partySize,
      requiredSeats: o.requiredSeats || o.partySize,
    }));

  const addOrder = (order: Omit<Order, 'id'>) => {
    const id = String(nextId.current).padStart(6, '0');
    nextId.current += 1;
    setOrders(prev => [{ ...order, id }, ...prev]);
  };

  const updateOrder = (id: string, updates: Partial<Order>) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  };

  const removeOrder = (id: string) => {
    setOrders(prev => prev.filter(o => o.id !== id));
  };

  const removeFromQueue = (id: string) => {
    setOrders(prev => prev.map(o =>
      o.id === id ? { ...o, isQueued: false, queuePosition: undefined } : o
    ));
  };

  const completePayment = (orderId: string, paymentData: { cashReceived: number; changeGiven: number; cashier?: string }) => {
    // Update order to paid status
    setOrders(prev => prev.map(o =>
      o.id === orderId
        ? {
            ...o,
            paymentStatus: 'Paid' as const,
            orderStatus: 'Completed' as const,
            cashReceived: paymentData.cashReceived,
            changeGiven: paymentData.changeGiven,
            cashier: paymentData.cashier,
            paymentId: `PAY-${Date.now()}`,
            receiptId: `REC-${Date.now()}`,
          }
        : o
    ));

    // Signal that payment was completed (triggers table release)
    setPaymentCompletedSignal(prev => prev + 1);
  };

  return (
    <OrderContext.Provider value={{
      orders,
      queuedOrders,
      addOrder,
      updateOrder,
      removeOrder,
      removeFromQueue,
      completePayment,
      paymentCompletedSignal,
    }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error('useOrders must be used within OrderProvider');
  return ctx;
}
