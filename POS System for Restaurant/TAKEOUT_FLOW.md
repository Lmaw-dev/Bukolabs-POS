# Takeout Order Flow Documentation

## Complete Flow for Takeout Orders

### Step-by-Step Process:

#### 1. **Create Order**
- Navigate to **Create Order** page
- Enter customer name
- Add items to cart
- Select **Takeout** as order type
- Click **Preview Order**

#### 2. **Order Preview**
- Review order details:
  - Order Number (6-digit format, e.g., 100001)
  - Customer Name
  - Order Type: Takeout
  - Items with quantities and prices
  - Subtotal, Service Fee (1%), Tax (12%)
  - Discount (if applicable)
  - Total Amount
- Click **Confirm Order**

#### 3. **Payment Page** (Opens automatically for takeout)
- Shows order summary
- Enter cash amount received
- System calculates change automatically
- Shows insufficient amount warning if needed
- Click **Confirm Payment** when ready

#### 4. **Receipt Preview** (Opens automatically after payment)
- **This is the NEW step added**
- Shows complete thermal receipt with:
  - Restaurant header (N&Ns RESTAURANT)
  - Order number (6-digit)
  - Date and time
  - Customer name
  - Order items with quantities and prices
  - Subtotal
  - Service Fee (1%)
  - Tax (12%)
  - Discount (if applicable)
  - **Total Amount**
  - **Cash Received** (actual amount entered)
  - **Change** (calculated)
- Two buttons available:
  - **Print Receipt** (primary button, blue) - Opens browser print dialog
  - **Continue** (secondary button) - Proceeds to success message

#### 5. **Payment Successful** (Shows after clicking Continue)
- Green checkmark icon
- Message: "Payment Successful!"
- Order details summary:
  - Order Number
  - Customer Name
  - Order Type: Takeout
  - Total Amount
  - Payment Status: Paid
  - Order Status: Pending
  - Amount Received
  - Change
- Two buttons:
  - **Close** - Returns to Create Order page with clean form
  - **View Receipt** - Shows receipt preview again if needed

---

## Key Features:

### ✅ Receipt Preview Benefits:
1. **Cashier can verify** all details before finalizing
2. **Customer can see** their receipt immediately
3. **Print option** available right after payment
4. **Smooth transition** from payment to completion

### ✅ Data Flow:
```
Order Confirmation
    ↓
Payment Modal (enter cash)
    ↓
Calculate Change
    ↓
Save Order to Order List (with paid status)
    ↓
Receipt Preview (show thermal receipt)
    ↓ (click Continue)
Payment Successful Modal
    ↓ (click Close)
Clean Form / New Order
```

### ✅ Amount Tracking:
- **Cash Received**: Stored in `successOrderDetails.cashReceived`
- **Change**: Stored in `successOrderDetails.changeGiven`
- **Both values** passed through the entire flow
- **Receipt shows actual amounts** entered during payment

---

## Comparison: Dine-In vs Takeout

### **Dine-In Orders:**
1. Create Order → Preview → Confirm
2. Order saved as "Not Paid"
3. Success message shows "Order Successfully Created!"
4. Payment happens later from Order List or Table Management

### **Takeout Orders:**
1. Create Order → Preview → Confirm
2. **Payment Modal opens immediately**
3. Enter payment → **Receipt Preview shown first**
4. Click Continue → Success message shows "Payment Successful!"
5. Order saved as "Paid" immediately

---

## Testing Checklist:

### Test Scenario 1: Simple Takeout Order
- [ ] Add items to cart
- [ ] Select Takeout
- [ ] Preview order shows correct totals
- [ ] Confirm order opens payment modal
- [ ] Enter exact amount (no change)
- [ ] Receipt preview shows correctly
- [ ] Click Print Receipt works
- [ ] Click Continue shows success
- [ ] Order appears in Order List as Paid

### Test Scenario 2: Takeout with Change
- [ ] Create order with total ₱250.00
- [ ] Enter cash ₱500.00
- [ ] Change calculated as ₱250.00
- [ ] Receipt shows ₱500.00 received
- [ ] Receipt shows ₱250.00 change
- [ ] Success modal shows same amounts
- [ ] Values match in Order List

### Test Scenario 3: Takeout with Discount
- [ ] Add senior citizen discount
- [ ] Verify discount reflected in totals
- [ ] Receipt shows discount line item
- [ ] Payment based on discounted total
- [ ] All amounts correct throughout flow

### Test Scenario 4: Receipt Re-view
- [ ] Complete payment flow
- [ ] On success modal, click "View Receipt"
- [ ] Receipt opens again with same data
- [ ] Can print again if needed

---

## Print Functionality:

When **Print Receipt** button is clicked:
- Browser's native print dialog opens
- Receipt appears in printer-friendly format
- Thermal receipt styling optimized for 80mm paper
- Can save as PDF or send to thermal printer

---

## Technical Notes:

### State Management:
```typescript
successOrderDetails: {
  orderNumber: string,
  customerName: string,
  items: CartItem[],
  total: number,
  paid: boolean,
  cashReceived: number,    // NEW: actual cash amount
  changeGiven: number,     // NEW: calculated change
  // ... other fields
}
```

### Modal Flow:
```typescript
setShowPayment(false)           // Close payment
setShowReceiptPreview(true)     // Open receipt first
// User clicks Continue
setShowReceiptPreview(false)    // Close receipt
setShowSuccess(true)            // Then show success
```

---

## Common Issues & Solutions:

### Issue: Receipt doesn't show payment amounts
**Solution**: Ensure `cashReceived` and `changeGiven` are saved in `successOrderDetails` during payment submission.

### Issue: Success modal shows before receipt
**Solution**: The flow explicitly opens receipt preview first, then success modal only when Continue is clicked.

### Issue: Order not in Order List
**Solution**: Verify `addOrder()` is called with paid status set to true in `handlePaymentSubmit()`.

---

This documentation reflects the improved takeout order flow that ensures cashiers see the receipt immediately after payment, can print it, and then proceed to complete the transaction.
