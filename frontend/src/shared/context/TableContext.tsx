import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useOrders } from './OrderContext';

export interface Table {
  id: number;
  number: number;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  orderId?: string;
  seats: number;
}

export interface TableNotification {
  id: string;
  message: string;
}

export interface QueueHistoryEntry {
  id: string;
  queueNumber: number;
  customerName: string;
  partySize: number;
  requiredSeats: number;
  queueTime: Date;
  assignedTables?: number[];
  timeAssigned?: Date;
  status: 'Waiting' | 'Assigned' | 'Cancelled' | 'Skipped';
  staffAction: string;
  orderId: string;
}

export interface TableHistoryEntry {
  id: string;
  tableNumber: number;
  customerName: string;
  orderId: string;
  partySize: number;
  timeOccupied: Date;
  timeReleased?: Date;
  paymentStatus: 'Paid' | 'Not Paid';
  totalAmount: number;
}

export interface AssignmentNotification {
  availableTable: Table;
  queuedCustomer: {
    id: string;
    name: string;
    partySize: number;
    queuePosition: number;
    orderId: string;
  };
}

interface TableContextType {
  tables: Table[];
  setTableStatus: (tableNumber: number, status: 'available' | 'maintenance' | 'reserved') => void;
  getAvailableTablesCount: () => number;
  notifications: TableNotification[];
  dismissNotification: (id: string) => void;
  addTable: (tableNumber: number, seats: number) => boolean;
  deleteTable: (tableId: number) => boolean;
  updateTable: (tableId: number, tableNumber: number, seats: number) => boolean;
  queueHistory: QueueHistoryEntry[];
  tableHistory: TableHistoryEntry[];
  assignmentNotification: AssignmentNotification | null;
  dismissAssignmentNotification: () => void;
  assignToTable: (orderId: string, tableNumbers: number[]) => void;
  skipQueueCustomer: (orderId: string) => void;
  getTableHistory: (tableNumber: number) => TableHistoryEntry[];
}

const TableContext = createContext<TableContextType | null>(null);

export function TableProvider({ children }: { children: ReactNode }) {
  const { orders, queuedOrders, updateOrder } = useOrders();
  const [notifications, setNotifications] = useState<Array<{ id: string; message: string }>>([]);
  const [queueHistory, setQueueHistory] = useState<QueueHistoryEntry[]>([]);
  const [tableHistory, setTableHistory] = useState<TableHistoryEntry[]>([]);
  const [assignmentNotification, setAssignmentNotification] = useState<AssignmentNotification | null>(null);

  // Refs to avoid stale closures in transition detector
  const prevTablesRef = useRef<Table[]>([]);
  const queuedOrdersRef = useRef(queuedOrders);
  const assignmentNotificationRef = useRef(assignmentNotification);
  const knownQueuedOrderIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => { queuedOrdersRef.current = queuedOrders; }, [queuedOrders]);
  useEffect(() => { assignmentNotificationRef.current = assignmentNotification; }, [assignmentNotification]);

  // Initialize 20 tables with varying seat counts
  const [tables, setTables] = useState<Table[]>(
    Array.from({ length: 20 }, (_, i) => {
      // Distribute seats: 2-seaters, 4-seaters, and 6-seaters
      const seatCounts = [2, 4, 4, 6, 2, 4, 4, 4, 2, 6, 4, 4, 2, 4, 6, 4, 2, 4, 4, 6];
      return {
        id: i + 1,
        number: i + 1,
        status: 'available' as const,
        seats: seatCounts[i],
      };
    })
  );

  // Sync tables with orders
  useEffect(() => {
    setTables(prevTables => {
      const newTables = prevTables.map(table => {
        // Find active order for this table
        const order = orders.find(o =>
          o.table === `Table ${table.number}` &&
          o.orderStatus !== 'Completed'
        );

        // Preserve manually set maintenance and reserved status
        if ((table.status === 'maintenance' || table.status === 'reserved') && !order) {
          return table;
        }

        if (order) {
          return {
            ...table,
            status: 'occupied' as const,
            orderId: order.id,
            seats: table.seats, // Preserve seats count
          };
        } else {
          // If was occupied, make available; otherwise keep current status
          return table.status === 'occupied'
            ? { ...table, status: 'available' as const, orderId: undefined, seats: table.seats }
            : table;
        }
      });

      // Update table history with release time for newly available tables
      newTables.forEach((newTable, idx) => {
        const oldTable = prevTables[idx];
        if (oldTable.status === 'occupied' && newTable.status === 'available' && oldTable.orderId) {
          // Update table history entries for this table's last order
          setTableHistory(prevHistory =>
            prevHistory.map(entry =>
              entry.orderId === oldTable.orderId && entry.tableNumber === newTable.number && !entry.timeReleased
                ? { ...entry, timeReleased: new Date(), paymentStatus: 'Paid' }
                : entry
            )
          );
        }
      });

      return newTables;
    });
  }, [orders, queuedOrders, updateOrder]);

  // Record customers as soon as they enter the queue, not only after assignment.
  useEffect(() => {
    const newQueuedOrders = queuedOrders.filter(order => !knownQueuedOrderIdsRef.current.has(order.id));
    if (newQueuedOrders.length === 0) return;

    newQueuedOrders.forEach(order => knownQueuedOrderIdsRef.current.add(order.id));
    const newEntries: QueueHistoryEntry[] = newQueuedOrders.map(order => ({
      id: `queue-waiting-${order.id}-${Date.now()}`,
      queueNumber: order.queuePosition || 0,
      customerName: order.customerName,
      partySize: order.partySize || 0,
      requiredSeats: order.requiredSeats || order.partySize || 0,
      queueTime: order.timestamp,
      status: 'Waiting',
      staffAction: 'Joined queue',
      orderId: order.id,
    }));

    setQueueHistory(prev => [...newEntries, ...prev]);
  }, [queuedOrders]);

  // Detect occupied → available transitions and trigger queue assignment notification
  useEffect(() => {
    const prevTables = prevTablesRef.current;

    // Skip on initial mount (no previous state to compare)
    if (prevTables.length === 0) {
      prevTablesRef.current = tables;
      return;
    }

    const newlyAvailable = tables.filter(t => {
      const prev = prevTables.find(p => p.id === t.id);
      return prev?.status === 'occupied' && t.status === 'available';
    });

    prevTablesRef.current = tables;

    if (newlyAvailable.length === 0) return;
    const currentQueued = queuedOrdersRef.current;
    if (currentQueued.length === 0) return;
    if (assignmentNotificationRef.current) return; // already showing one

    const firstInQueue = currentQueued[0];

    // Find the smallest fitting table among newly freed tables for the first queued customer
    const fittingTable = newlyAvailable
      .filter(t => t.seats >= (firstInQueue.partySize || 0))
      .sort((a, b) => a.seats - b.seats)[0];

    if (fittingTable) {
      setAssignmentNotification({
        availableTable: fittingTable,
        queuedCustomer: {
          id: firstInQueue.id,
          name: firstInQueue.customerName,
          partySize: firstInQueue.partySize || 0,
          queuePosition: firstInQueue.queuePosition || 0,
          orderId: firstInQueue.id,
        },
      });
    } else {
      // First in queue doesn't fit any freed table — find any compatible pair
      for (const table of newlyAvailable) {
        const compatible = currentQueued.find(o => (o.partySize || 0) <= table.seats);
        if (compatible) {
          setAssignmentNotification({
            availableTable: table,
            queuedCustomer: {
              id: compatible.id,
              name: compatible.customerName,
              partySize: compatible.partySize || 0,
              queuePosition: compatible.queuePosition || 0,
              orderId: compatible.id,
            },
          });
          break;
        }
      }
    }
  }, [tables]);

  // Also notify when a suitable table is already available or becomes available from reserved/maintenance.
  useEffect(() => {
    if (assignmentNotification) return;
    if (queuedOrders.length === 0) return;

    const availableTables = tables
      .filter(table => table.status === 'available')
      .sort((a, b) => a.seats - b.seats);
    if (availableTables.length === 0) return;

    const firstInQueue = queuedOrders[0];
    const fittingTable = availableTables.find(table => table.seats >= (firstInQueue.partySize || 0));
    if (fittingTable) {
      setAssignmentNotification({
        availableTable: fittingTable,
        queuedCustomer: {
          id: firstInQueue.id,
          name: firstInQueue.customerName,
          partySize: firstInQueue.partySize || 0,
          queuePosition: firstInQueue.queuePosition || 0,
          orderId: firstInQueue.id,
        },
      });
      return;
    }

    for (const table of availableTables) {
      const compatible = queuedOrders.find(order => (order.partySize || 0) <= table.seats);
      if (compatible) {
        setAssignmentNotification({
          availableTable: table,
          queuedCustomer: {
            id: compatible.id,
            name: compatible.customerName,
            partySize: compatible.partySize || 0,
            queuePosition: compatible.queuePosition || 0,
            orderId: compatible.id,
          },
        });
        return;
      }
    }
  }, [tables, queuedOrders, assignmentNotification]);

  const setTableStatus = (tableNumber: number, status: 'available' | 'maintenance' | 'reserved') => {
    setTables(prevTables =>
      prevTables.map(t =>
        t.number === tableNumber ? { ...t, status } : t
      )
    );
  };

  const getAvailableTablesCount = () => {
    return tables.filter(t => t.status === 'available').length;
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const addTable = (tableNumber: number, seats: number): boolean => {
    // Check if table number already exists
    const numberExists = tables.some(t => t.number === tableNumber);
    if (numberExists) {
      return false;
    }

    // Find max ID to generate new ID
    const maxId = Math.max(...tables.map(t => t.id), 0);

    const newTable: Table = {
      id: maxId + 1,
      number: tableNumber,
      status: 'available',
      seats: seats,
    };

    setTables(prev => [...prev, newTable]);
    return true;
  };

  const deleteTable = (tableId: number): boolean => {
    // Check if table has active order
    const table = tables.find(t => t.id === tableId);
    if (table?.orderId) {
      return false; // Cannot delete table with active order
    }

    setTables(prev => prev.filter(t => t.id !== tableId));
    return true;
  };

  const updateTable = (tableId: number, tableNumber: number, seats: number): boolean => {
    // Check if new table number already exists (excluding current table)
    const numberExists = tables.some(t => t.id !== tableId && t.number === tableNumber);
    if (numberExists) {
      return false;
    }

    setTables(prevTables =>
      prevTables.map(t =>
        t.id === tableId
          ? { ...t, number: tableNumber, seats: seats }
          : t
      )
    );
    return true;
  };

  const dismissAssignmentNotification = () => {
    setAssignmentNotification(null);
  };

  const assignToTable = (orderId: string, tableNumbers: number[]) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const tableLabels = tableNumbers.map(n => `Table ${n}`).join(' + ');

    // Update order with table assignment
    updateOrder(orderId, {
      table: tableLabels,
      isQueued: false,
      queuePosition: undefined,
      orderStatus: order.paymentStatus === 'Paid' ? 'Served' : 'Preparing',
    });

    // Add to queue history
    const queueEntry: QueueHistoryEntry = {
      id: `queue-${Date.now()}`,
      queueNumber: order.queuePosition || 0,
      customerName: order.customer,
      partySize: order.partySize || 0,
      requiredSeats: order.partySize || 0,
      queueTime: new Date(order.date),
      assignedTables: tableNumbers,
      timeAssigned: new Date(),
      status: 'Assigned',
      staffAction: `Assigned to ${tableLabels}`,
      orderId: orderId,
    };
    setQueueHistory(prev => [queueEntry, ...prev]);

    // Add to table history
    tableNumbers.forEach(tableNum => {
      const historyEntry: TableHistoryEntry = {
        id: `table-history-${Date.now()}-${tableNum}`,
        tableNumber: tableNum,
        customerName: order.customer,
        orderId: orderId,
        partySize: order.partySize || 0,
        timeOccupied: new Date(),
        paymentStatus: order.paymentStatus as 'Paid' | 'Not Paid',
        totalAmount: order.amountNumber,
      };
      setTableHistory(prev => [historyEntry, ...prev]);
    });

    // Show confirmation notification
    const notificationId = `notify-${Date.now()}`;
    setNotifications(prev => [...prev, {
      id: notificationId,
      message: `${order.customer} has been assigned to ${tableLabels}.`
    }]);

    // Auto-remove notification
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    }, 5000);

    // Dismiss assignment modal
    dismissAssignmentNotification();
  };

  const skipQueueCustomer = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    // Add to queue history as skipped
    const queueEntry: QueueHistoryEntry = {
      id: `queue-${Date.now()}`,
      queueNumber: order.queuePosition || 0,
      customerName: order.customer,
      partySize: order.partySize || 0,
      requiredSeats: order.partySize || 0,
      queueTime: new Date(order.date),
      timeAssigned: new Date(),
      status: 'Skipped',
      staffAction: 'Skipped - table capacity mismatch',
      orderId: orderId,
    };
    setQueueHistory(prev => [queueEntry, ...prev]);

    // Dismiss current notification and check next
    dismissAssignmentNotification();

    // Try to find next compatible customer
    const availableTable = tables.find(t => t.status === 'available');
    if (availableTable) {
      const nextCompatible = queuedOrders
        .filter(o => o.id !== orderId)
        .find(o => (o.partySize || 0) <= availableTable.seats);

      if (nextCompatible) {
        setAssignmentNotification({
          availableTable,
          queuedCustomer: {
            id: nextCompatible.id,
            name: nextCompatible.customerName,
            partySize: nextCompatible.partySize || 0,
            queuePosition: nextCompatible.queuePosition || 0,
            orderId: nextCompatible.id,
          },
        });
      }
    }
  };

  const getTableHistory = (tableNumber: number): TableHistoryEntry[] => {
    return tableHistory.filter(h => h.tableNumber === tableNumber);
  };

  return (
    <TableContext.Provider value={{
      tables,
      setTableStatus,
      getAvailableTablesCount,
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
    }}>
      {children}
    </TableContext.Provider>
  );
}

export function useTables() {
  const ctx = useContext(TableContext);
  if (!ctx) throw new Error('useTables must be used within TableProvider');
  return ctx;
}
