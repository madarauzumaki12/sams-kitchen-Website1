-- =====================================================
-- SAM'S KITCHEN - Database Schema
-- =====================================================

-- Create Database
CREATE DATABASE IF NOT EXISTS samskitchen CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE samskitchen;

-- =====================================================
-- PRODUCTS TABLE
-- =====================================================
CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255),
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    half_dozen_price DECIMAL(10, 2) NOT NULL,
    image VARCHAR(500),
    category VARCHAR(100),
    badge VARCHAR(50),
    rating DECIMAL(2, 1) DEFAULT 5.0,
    reviews INT DEFAULT 0,
    in_stock BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================================
-- DEALS TABLE
-- =====================================================
CREATE TABLE deals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    original_price DECIMAL(10, 2) NOT NULL,
    image VARCHAR(500),
    badge VARCHAR(100),
    badge_color VARCHAR(20),
    rating DECIMAL(2, 1) DEFAULT 5.0,
    items JSON,
    progress INT DEFAULT 0,
    progress_text VARCHAR(255),
    featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- CUSTOMERS TABLE
-- =====================================================
CREATE TABLE customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    area VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_phone (phone),
    INDEX idx_email (email)
);

-- =====================================================
-- ORDERS TABLE (Main)
-- =====================================================
CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INT,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(255),
    address TEXT NOT NULL,
    area VARCHAR(100) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    delivery_charge DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'confirmed', 'preparing', 'out-for-delivery', 'delivered', 'cancelled') DEFAULT 'pending',
    payment_method VARCHAR(50) DEFAULT 'cash_on_delivery',
    notes TEXT,
    email_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_order_number (order_number),
    INDEX idx_customer_phone (customer_phone),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

-- =====================================================
-- ORDER ITEMS TABLE
-- =====================================================
CREATE TABLE order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    item_type ENUM('product', 'deal', 'bundle') DEFAULT 'product',
    variant VARCHAR(50),
    deal_items JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_order_id (order_id)
);

-- =====================================================
-- WISHLIST TABLE
-- =====================================================
CREATE TABLE wishlist (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT,
    product_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    UNIQUE KEY unique_wishlist (customer_id, product_id)
);

-- =====================================================
-- INSERT SAMPLE PRODUCTS
-- =====================================================
INSERT INTO products (id, name, subtitle, description, price, half_dozen_price, image, category, badge, rating, reviews) VALUES
(1, 'Malai Boti Samosa', 'A Royal Delight', 'Enjoy the rich and flavorful taste of creamy malai boti wrapped in a crispy golden crust.', 60, 360, '/images/samosa.jpg', 'samosas', 'Bestseller', 4.9, 328),
(2, 'Chicken Rolls', 'Crispy Perfection', 'Savor the irresistible taste with a crispy golden coating and delicious filling.', 50, 300, '/images/roll.jpg', 'rolls', 'Popular', 4.8, 256),
(3, 'Peri Bites', 'For Spice Lovers', 'Perfect blend of bold spice and creamy cheese wrapped in crispy golden coating.', 100, 600, '/images/peri.jpg', 'bites', 'Spicy', 4.7, 189),
(4, 'Cheese Balls', 'Cheese Lover\'s Dream', 'Golden crunch cheese balls with rich, creamy, stretchy melted cheese center.', 60, 360, '/images/cheese.jpg', 'bites', 'New', 4.9, 412),
(5, 'Chicken Pockets', 'Savory Sensation', 'Crispy pockets wrapped in golden flaky crust with juicy seasoned chicken.', 75, 450, '/images/chicken.jpg', 'pockets', 'Classic', 4.8, 275),
(6, 'Pizza Samosa', 'East Meets West', 'Fusion of Italian and Pakistani flavors with melted cheese and chicken.', 75, 450, '/images/samosa1.jpg', 'samosas', 'Fusion', 4.6, 156),
(7, 'Chicken Cheesy Fajita Pockets', 'Mexican Inspired', 'Tender chicken strips marinated in fajita spices with melted cheese.', 100, 600, '/images/chicken.jpg', 'pockets', 'Premium', 4.8, 198);

-- =====================================================
-- INSERT SAMPLE DEALS
-- =====================================================
INSERT INTO deals (id, title, description, price, original_price, image, badge, badge_color, rating, items, progress, progress_text, featured) VALUES
(1, 'Snack Feast Box', 'The ultimate snack box for your cravings!', 600, 750, '/images/deal1.jpg', 'Best Value', '#27ae60', 5.0, '["2 Cheese Balls", "1 Chicken Cheesy Fajita Pocket", "1 Chicken Pocket", "2 Chicken Rolls", "1 Litre Cold Drink FREE!"]', 75, '75% claimed - Hurry up!', TRUE),
(2, 'Moonlight Munch', 'Perfect for late night cravings!', 500, 650, '/images/deal2.jpg', 'Midnight', '#e74c3c', 4.9, '["3 Cheese Balls", "2 Pizza Samosa", "3 Chicken Rolls", "345ml Cold Drink"]', 60, '60% claimed', FALSE),
(3, 'Premium Snack Box', 'Our most premium collection!', 700, 900, '/images/deal1.jpg', 'Premium', '#9b59b6', 4.8, '["2 Chicken Cheesy Fajita Pockets", "2 Malai Boti Samosa", "2 Peri Bites", "2 Cheese Balls", "1 Chicken Roll", "Chocolate FREE!"]', 45, '45% claimed', FALSE),
(4, 'Night Owl Snack Box', 'For the night owls!', 500, 650, '/images/deal2.jpg', 'Night Deal', '#e74c3c', 4.7, '["2 Malai Boti Samosa", "2 Chicken Cheesy Fajita Pockets", "2 Chicken Creamy Pockets", "1 Cheese Ball"]', 55, '55% claimed', FALSE);

-- =====================================================
-- CREATE VIEWS FOR REPORTING
-- =====================================================

-- Daily Sales View
CREATE VIEW daily_sales AS
SELECT 
    DATE(created_at) as order_date,
    COUNT(*) as total_orders,
    SUM(total) as total_revenue,
    SUM(subtotal) as total_subtotal,
    SUM(delivery_charge) as total_delivery
FROM orders
GROUP BY DATE(created_at)
ORDER BY order_date DESC;

-- Popular Products View
CREATE VIEW popular_products AS
SELECT 
    oi.name,
    oi.item_type,
    SUM(oi.quantity) as total_quantity,
    SUM(oi.price * oi.quantity) as total_revenue
FROM order_items oi
GROUP BY oi.name, oi.item_type
ORDER BY total_quantity DESC;

-- Order Status Summary
CREATE VIEW order_status_summary AS
SELECT 
    status,
    COUNT(*) as count,
    SUM(total) as total_value
FROM orders
GROUP BY status;

-- =====================================================
-- STORED PROCEDURE: Create New Order
-- =====================================================
DELIMITER //

CREATE PROCEDURE CreateOrder(
    IN p_order_number VARCHAR(50),
    IN p_customer_name VARCHAR(255),
    IN p_customer_phone VARCHAR(20),
    IN p_customer_email VARCHAR(255),
    IN p_address TEXT,
    IN p_area VARCHAR(100),
    IN p_subtotal DECIMAL(10, 2),
    IN p_delivery_charge DECIMAL(10, 2),
    IN p_total DECIMAL(10, 2),
    IN p_payment_method VARCHAR(50),
    IN p_notes TEXT
)
BEGIN
    DECLARE v_customer_id INT;
    DECLARE v_order_id INT;
    
    -- Check if customer exists
    SELECT id INTO v_customer_id FROM customers WHERE phone = p_customer_phone LIMIT 1;
    
    -- If customer doesn't exist, create new customer
    IF v_customer_id IS NULL THEN
        INSERT INTO customers (name, phone, email, address, area)
        VALUES (p_customer_name, p_customer_phone, p_customer_email, p_address, p_area);
        SET v_customer_id = LAST_INSERT_ID();
    ELSE
        -- Update customer info
        UPDATE customers 
        SET name = p_customer_name, 
            email = p_customer_email, 
            address = p_address, 
            area = p_area,
            updated_at = NOW()
        WHERE id = v_customer_id;
    END IF;
    
    -- Create order
    INSERT INTO orders (
        order_number, customer_id, customer_name, customer_phone, customer_email,
        address, area, subtotal, delivery_charge, total, payment_method, notes
    ) VALUES (
        p_order_number, v_customer_id, p_customer_name, p_customer_phone, p_customer_email,
        p_address, p_area, p_subtotal, p_delivery_charge, p_total, p_payment_method, p_notes
    );
    
    SET v_order_id = LAST_INSERT_ID();
    
    SELECT v_order_id as order_id;
END //

DELIMITER ;

-- =====================================================
-- STORED PROCEDURE: Add Order Item
-- =====================================================
DELIMITER //

CREATE PROCEDURE AddOrderItem(
    IN p_order_id INT,
    IN p_product_id INT,
    IN p_name VARCHAR(255),
    IN p_price DECIMAL(10, 2),
    IN p_quantity INT,
    IN p_item_type VARCHAR(20),
    IN p_variant VARCHAR(50),
    IN p_deal_items JSON
)
BEGIN
    INSERT INTO order_items (
        order_id, product_id, name, price, quantity, item_type, variant, deal_items
    ) VALUES (
        p_order_id, p_product_id, p_name, p_price, p_quantity, p_item_type, p_variant, p_deal_items
    );
END //

DELIMITER ;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update order timestamp on status change
DELIMITER //

CREATE TRIGGER update_order_timestamp
BEFORE UPDATE ON orders
FOR EACH ROW
BEGIN
    SET NEW.updated_at = NOW();
END //

DELIMITER ;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_badge ON products(badge);
CREATE INDEX idx_deals_active ON deals(is_active);
CREATE INDEX idx_orders_status_created ON orders(status, created_at);
