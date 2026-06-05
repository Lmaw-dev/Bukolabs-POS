CREATE TABLE IF NOT EXISTS store_settings (
  id BIGSERIAL PRIMARY KEY,
  store_id BIGINT UNIQUE REFERENCES stores(id) ON DELETE CASCADE,
  enable_customer_recommendation BOOLEAN DEFAULT TRUE,
  enable_table_management BOOLEAN DEFAULT TRUE,
  enable_refund BOOLEAN DEFAULT TRUE,
  enable_void BOOLEAN DEFAULT TRUE,
  enable_discount BOOLEAN DEFAULT TRUE,
  enable_service_charge BOOLEAN DEFAULT TRUE,
  service_charge_percentage DECIMAL(5,2) DEFAULT 0,
  enable_dine_in BOOLEAN DEFAULT TRUE,
  enable_takeout BOOLEAN DEFAULT TRUE,
  enable_ingredient_customization BOOLEAN DEFAULT TRUE,
  enable_receipt_printing BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS enable_dine_in BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS enable_takeout BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS enable_ingredient_customization BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS enable_receipt_printing BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS discount_types (
  id BIGSERIAL PRIMARY KEY,
  store_id BIGINT REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
  description TEXT,
  requires_reference_number BOOLEAN DEFAULT FALSE,
  is_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_categories (
  id BIGSERIAL PRIMARY KEY,
  store_id BIGINT REFERENCES stores(id) ON DELETE CASCADE,
  store_type VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  store_id BIGINT REFERENCES stores(id) ON DELETE CASCADE,
  category_id BIGINT REFERENCES product_categories(id) ON DELETE SET NULL,
  store_type VARCHAR(50) NOT NULL,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  meal_type VARCHAR(50),
  preparation_time_minutes INT,
  is_dine_in_available BOOLEAN DEFAULT TRUE,
  is_takeout_available BOOLEAN DEFAULT TRUE,
  sku VARCHAR(50),
  barcode VARCHAR(100),
  size VARCHAR(50),
  color VARCHAR(50),
  unit VARCHAR(50),
  stock_quantity INT DEFAULT 0,
  low_stock_limit INT DEFAULT 5,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_ingredients (
  id BIGSERIAL PRIMARY KEY,
  store_id BIGINT REFERENCES stores(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES products(id) ON DELETE CASCADE,
  ingredient_name VARCHAR(150) NOT NULL,
  default_quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit VARCHAR(50) NOT NULL,
  additional_cost DECIMAL(10,2) DEFAULT 0,
  is_required BOOLEAN DEFAULT TRUE,
  is_removable BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ingredient_alternatives (
  id BIGSERIAL PRIMARY KEY,
  product_ingredient_id BIGINT REFERENCES product_ingredients(id) ON DELETE CASCADE,
  alternative_name VARCHAR(150) NOT NULL,
  default_quantity DECIMAL(10,2),
  unit VARCHAR(50),
  additional_cost DECIMAL(10,2) DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS restaurant_tables (
  id BIGSERIAL PRIMARY KEY,
  store_id BIGINT REFERENCES stores(id) ON DELETE CASCADE,
  table_number VARCHAR(50) NOT NULL,
  capacity INT NOT NULL,
  status VARCHAR(50) DEFAULT 'AVAILABLE'
    CHECK (status IN ('AVAILABLE', 'OCCUPIED', 'RESERVED', 'MAINTENANCE')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  store_id BIGINT REFERENCES stores(id) ON DELETE CASCADE,
  cashier_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_name VARCHAR(150),
  order_type VARCHAR(50) NOT NULL
    CHECK (order_type IN ('DINE_IN', 'TAKEOUT', 'MIXED', 'RETAIL')),
  table_id BIGINT REFERENCES restaurant_tables(id) ON DELETE SET NULL,
  table_name VARCHAR(50),
  subtotal DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  discount_type VARCHAR(100),
  tax_amount DECIMAL(10,2) DEFAULT 0,
  service_charge DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) DEFAULT 0,
  order_status VARCHAR(50) DEFAULT 'PENDING'
    CHECK (order_status IN ('PENDING', 'PREPARING', 'READY', 'SERVED', 'COMPLETED', 'CANCELLED')),
  payment_status VARCHAR(50) DEFAULT 'NOT_PAID'
    CHECK (payment_status IN ('NOT_PAID', 'PAID', 'REFUNDED', 'PARTIALLY_REFUNDED', 'VOIDED')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(150) NOT NULL,
  category_name VARCHAR(100),
  size VARCHAR(50),
  color VARCHAR(50),
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  line_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  item_type VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_item_customizations (
  id BIGSERIAL PRIMARY KEY,
  order_item_id BIGINT REFERENCES order_items(id) ON DELETE CASCADE,
  product_ingredient_id BIGINT REFERENCES product_ingredients(id) ON DELETE SET NULL,
  ingredient_alternative_id BIGINT REFERENCES ingredient_alternatives(id) ON DELETE SET NULL,
  customization_type VARCHAR(50) NOT NULL
    CHECK (customization_type IN ('REMOVE', 'EXTRA', 'QUANTITY_CHANGE', 'REPLACE', 'NOTE')),
  original_ingredient_name VARCHAR(150),
  replacement_ingredient_name VARCHAR(150),
  original_quantity DECIMAL(10,2),
  new_quantity DECIMAL(10,2),
  unit VARCHAR(50),
  additional_cost DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_queue (
  id BIGSERIAL PRIMARY KEY,
  store_id BIGINT REFERENCES stores(id) ON DELETE CASCADE,
  order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
  customer_name VARCHAR(150) NOT NULL,
  party_size INT NOT NULL,
  required_seats INT,
  queue_number INT NOT NULL,
  assigned_table_id BIGINT REFERENCES restaurant_tables(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'WAITING'
    CHECK (status IN ('WAITING', 'ASSIGNED', 'SKIPPED', 'CANCELLED')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assigned_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS table_history (
  id BIGSERIAL PRIMARY KEY,
  store_id BIGINT REFERENCES stores(id) ON DELETE CASCADE,
  table_id BIGINT REFERENCES restaurant_tables(id) ON DELETE SET NULL,
  order_id BIGINT REFERENCES orders(id) ON DELETE SET NULL,
  customer_name VARCHAR(150),
  party_size INT,
  occupied_at TIMESTAMP,
  released_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'OCCUPIED',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
  id BIGSERIAL PRIMARY KEY,
  store_id BIGINT REFERENCES stores(id) ON DELETE CASCADE,
  order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
  processed_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  payment_number VARCHAR(50) UNIQUE NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  amount_due DECIMAL(10,2) NOT NULL DEFAULT 0,
  amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
  change_amount DECIMAL(10,2) DEFAULT 0,
  payment_status VARCHAR(50) DEFAULT 'PAID',
  paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS receipts (
  id BIGSERIAL PRIMARY KEY,
  store_id BIGINT REFERENCES stores(id) ON DELETE CASCADE,
  order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
  payment_id BIGINT REFERENCES payments(id) ON DELETE SET NULL,
  receipt_number VARCHAR(50) UNIQUE NOT NULL,
  receipt_data JSONB,
  printed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory_movements (
  id BIGSERIAL PRIMARY KEY,
  store_id BIGINT REFERENCES stores(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES products(id) ON DELETE SET NULL,
  created_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  movement_type VARCHAR(50) NOT NULL
    CHECK (movement_type IN ('STOCK_IN', 'SALE_DEDUCTION', 'ADJUSTMENT', 'REFUND_RETURN')),
  quantity INT NOT NULL,
  previous_quantity INT,
  new_quantity INT,
  reference_type VARCHAR(50),
  reference_id BIGINT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS refunds (
  id BIGSERIAL PRIMARY KEY,
  store_id BIGINT REFERENCES stores(id) ON DELETE CASCADE,
  order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
  refunded_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  refund_amount DECIMAL(10,2) DEFAULT 0,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS voided_transactions (
  id BIGSERIAL PRIMARY KEY,
  store_id BIGINT REFERENCES stores(id) ON DELETE CASCADE,
  order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
  voided_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS product_categories_store_id_idx ON product_categories(store_id);
CREATE INDEX IF NOT EXISTS discount_types_store_id_idx ON discount_types(store_id);
CREATE INDEX IF NOT EXISTS products_store_id_idx ON products(store_id);
CREATE INDEX IF NOT EXISTS product_ingredients_product_id_idx ON product_ingredients(product_id);
CREATE INDEX IF NOT EXISTS ingredient_alternatives_product_ingredient_id_idx ON ingredient_alternatives(product_ingredient_id);
CREATE INDEX IF NOT EXISTS restaurant_tables_store_id_idx ON restaurant_tables(store_id);
CREATE INDEX IF NOT EXISTS orders_store_id_idx ON orders(store_id);
CREATE INDEX IF NOT EXISTS orders_cashier_id_idx ON orders(cashier_id);
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items(order_id);
CREATE INDEX IF NOT EXISTS order_item_customizations_order_item_id_idx ON order_item_customizations(order_item_id);
CREATE INDEX IF NOT EXISTS order_queue_store_id_idx ON order_queue(store_id);
CREATE INDEX IF NOT EXISTS order_queue_order_id_idx ON order_queue(order_id);
CREATE INDEX IF NOT EXISTS table_history_store_id_idx ON table_history(store_id);
CREATE INDEX IF NOT EXISTS table_history_order_id_idx ON table_history(order_id);
CREATE INDEX IF NOT EXISTS payments_order_id_idx ON payments(order_id);
CREATE INDEX IF NOT EXISTS receipts_order_id_idx ON receipts(order_id);
CREATE INDEX IF NOT EXISTS inventory_movements_store_id_idx ON inventory_movements(store_id);
CREATE INDEX IF NOT EXISTS inventory_movements_product_id_idx ON inventory_movements(product_id);
