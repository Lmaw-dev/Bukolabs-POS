# POS System Testing Guide

This guide will help you verify that all the requested features are working correctly.

## 1. Testing the Confirm Order Button

### Steps to Test:
1. Go to **Create Order** page
2. Add a customer name (e.g., "John Doe")
3. Add items to cart
4. Select **Dine-In** or **Takeout**
5. If Dine-In, select a table
6. Click **Preview Order** button
7. In the preview modal, click **Confirm Order** button

### Expected Behavior:
- The preview modal should close
- For Takeout orders: Payment modal should open
- For Dine-In orders: Success message should appear
- Console should show: "Confirm Order clicked" and "Order data: {...}"

### Troubleshooting:
- If button doesn't respond, open browser console (F12) and check for errors
- Verify the order appears in Order List after confirmation

---

## 2. Testing Convert to Takeout Option

### Steps to Test:
1. Create multiple dine-in orders to occupy all 20 tables
2. Start a new order with dine-in items
3. Try to select a table - you'll see "No Tables Available" message

### Expected Behavior:
- Modal shows warning: "All tables are currently occupied..."
- Two buttons appear:
  - **WAIT IN QUEUE FOR TABLE** (orange button)
  - **CONVERT TO TAKEOUT ORDER** (blue button)
- Clicking "Convert to Takeout" changes all items to takeout and closes the modal
- Clicking "Wait in Queue" adds customer to queue

---

## 3. Testing Auto-Assignment to Tables

### Steps to Test:
1. Create a queued order (following steps in #2)
2. Go to **Order List**
3. Find an occupied table's order
4. Click the payment button and complete payment
5. Go to **Table Management**

### Expected Behavior:
- When table becomes available, the first customer in queue is automatically assigned
- Customer name appears under the newly available table
- Green notification appears at top: "Table X is now available for [Customer Name]"
- Console shows: "Auto-assigning [Customer] to Table X"

---

## 4. Testing Order List Updates

### Steps to Test:
1. Create a queued order
2. Go to **Order List** - order should show "Queue" in Table column
3. Go to **Table Management**
4. Pay for an occupied table to free it
5. Return to **Order List**

### Expected Behavior:
- The queued order's table column updates from "Queue" to "Table X"
- Order automatically updates when table is assigned
- No manual refresh needed

---

## 5. Testing Notification System

### Steps to Test:
1. Have at least one order in queue
2. Go to **Table Management**
3. Select an occupied table and click "Mark as Paid & Free Table"

### Expected Behavior:
- Green notification card appears at top of page
- Message: "Table X is now available for [Customer Name]"
- Notification has dismiss button (X)
- Notification auto-dismisses after 10 seconds
- Console shows: "Notification added: notify-[timestamp]"

---

## 6. Testing Recommendation System

### Steps to Test:
1. Complete several orders for a customer (e.g., "Juan Dela Cruz")
2. Make sure these orders include specific items (e.g., Wagyu Steak, Truffle Pasta)
3. Start a new order
4. Type the same customer name: "Juan Dela Cruz"

### Expected Behavior:
- Recommendations section appears below search bar
- Shows: "⭐ Recommended for Juan Dela Cruz"
- Displays top 4 most frequently ordered items
- Section has blue/purple gradient background
- Console shows:
  - "Checking history for: juan dela cruz"
  - "Found customer orders: X"
  - "Item frequency: {...}"
  - "Recommended products: X"

### Testing with Existing Data:
The system has sample orders for:
- **Juan Dela Cruz** - ordered Truffle Pasta, Grilled Salmon
- **Maria Santos** - ordered Wagyu Steak, Lobster Thermidor, Tiramisu

Type these names exactly to see recommendations based on their order history.

---

## Common Issues and Solutions

### Issue: Confirm Order button not responding
**Solution**: 
- Check browser console for errors
- Verify you're not in an error state (check for validation messages)
- Refresh the page and try again

### Issue: No recommendations showing
**Solution**:
- Verify customer name matches exactly (case-insensitive)
- Ensure there are past orders for this customer in Order List
- Check browser console for "Found customer orders: 0"
- If 0, create some orders first for that customer

### Issue: Auto-assignment not working
**Solution**:
- Verify there are queued orders (check Queue panel in Table Management)
- Make sure table becomes available (payment processed)
- Check console for: "Newly available tables: X" and "Queued orders: X"
- Both numbers should be > 0 for auto-assignment to trigger

### Issue: Notifications not appearing
**Solution**:
- Ensure auto-assignment conditions are met (see above)
- Check console for "Notification added: notify-[id]"
- Verify you're on Table Management page when assignment happens

---

## Debug Mode

All key functions now include console logging. Open browser console (F12) to see:

- **Order Confirmation**: "Confirm Order clicked", "Order data: {...}"
- **Auto-Assignment**: "Newly available tables: X", "Queued orders: X"
- **Notifications**: "Notification added: [id]", "Notification auto-dismissed: [id]"
- **Recommendations**: "Checking history for: [name]", "Found customer orders: X"

---

## Quick Test Scenario

1. **Setup**: Create orders for "Test Customer" with Wagyu Steak (x2 orders)
2. **Occupy Tables**: Create 20 dine-in orders to fill all tables
3. **Queue Test**: Create new order for "Test Customer"
   - Should see recommendations (Wagyu Steak)
   - Should see "Convert to Takeout" option
   - Click "Wait in Queue"
4. **Auto-Assign Test**: Go to Table Management, pay for any table
   - Should see notification
   - Queued order should move to that table
5. **Verify**: Check Order List - order shows correct table number

All systems should work together seamlessly!
