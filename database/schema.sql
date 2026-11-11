-- ============================================================================
-- MSME SAHAYAK - DATABASE SCHEMA DEFINITION
-- Database Engine: MySQL 8.0+
-- Database Name: msme_sahayak
-- Tagline: Empowering MSMEs. Strengthening India's Economy.
-- ============================================================================

-- 1. DATABASE CREATION
CREATE DATABASE IF NOT EXISTS msme_sahayak
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE msme_sahayak;

-- ============================================================================
-- 2. TABLE DEFINITIONS
-- ============================================================================

-- Table 1: businesses
-- Stores registered Micro, Small, and Medium Enterprises
CREATE TABLE IF NOT EXISTS businesses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_name VARCHAR(150) NOT NULL,
    owner_name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    category VARCHAR(80) NOT NULL COMMENT 'e.g., Manufacturing, Textile, Precision Engineering, Food Processing, IT Services',
    msme_type ENUM('Micro', 'Small', 'Medium') NOT NULL DEFAULT 'Micro' COMMENT 'Classification per Government of India turnover/investment norms',
    udyam_reg_number VARCHAR(30) UNIQUE NULL COMMENT 'Official Udyam Registration Number format: UDYAM-XX-00-0000000',
    location VARCHAR(100) NOT NULL COMMENT 'City, State (e.g., Pune, Maharashtra)',
    address TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_phone_not_empty CHECK (LENGTH(TRIM(phone)) >= 10)
) ENGINE=InnoDB;

-- Table 2: invoices
-- Stores invoices raised by MSMEs with delayed payment tracking & statutory 45-day calculation
CREATE TABLE IF NOT EXISTS invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    business_id INT NOT NULL,
    buyer_name VARCHAR(150) NOT NULL,
    buyer_gstin VARCHAR(20) NULL COMMENT 'Buyer 15-character GST Identification Number',
    invoice_amount DECIMAL(12, 2) NOT NULL,
    amount_paid DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    outstanding_amount DECIMAL(12, 2) NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    payment_status ENUM('PAID', 'PENDING', 'PARTIAL', 'OVERDUE') NOT NULL DEFAULT 'PENDING',
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_invoices_business FOREIGN KEY (business_id) 
        REFERENCES businesses(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT chk_invoice_amount_positive CHECK (invoice_amount > 0),
    CONSTRAINT chk_amount_paid_valid CHECK (amount_paid >= 0 AND amount_paid <= invoice_amount),
    CONSTRAINT chk_due_date_valid CHECK (due_date >= invoice_date)
) ENGINE=InnoDB;

-- Table 3: payments
-- Stores payment transactions recorded against invoices (partial or full)
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    payment_date DATE NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    payment_mode ENUM('NEFT/RTGS', 'UPI', 'Cheque', 'Bank Transfer', 'Cash') NOT NULL DEFAULT 'NEFT/RTGS',
    reference_number VARCHAR(80) NULL COMMENT 'UTR, Transaction ID, or Cheque number',
    notes VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payments_invoice FOREIGN KEY (invoice_id) 
        REFERENCES invoices(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT chk_payment_amount_positive CHECK (amount > 0)
) ENGINE=InnoDB;

-- Table 4: inventory
-- Tracks raw materials and finished products with safety buffer levels
CREATE TABLE IF NOT EXISTS inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    product_name VARCHAR(150) NOT NULL,
    product_category VARCHAR(80) NOT NULL COMMENT 'Raw Material, Finished Goods, Packaging, Spare Parts',
    available_quantity INT NOT NULL DEFAULT 0,
    min_stock_level INT NOT NULL DEFAULT 10 COMMENT 'Threshold below which low-stock alert triggers',
    unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    unit_of_measure VARCHAR(30) NOT NULL DEFAULT 'Units' COMMENT 'Units, Meters, Kg, Liters, Boxes',
    supplier_name VARCHAR(150) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_inventory_business FOREIGN KEY (business_id) 
        REFERENCES businesses(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT chk_quantity_non_negative CHECK (available_quantity >= 0),
    CONSTRAINT chk_unit_price_non_negative CHECK (unit_price >= 0)
) ENGINE=InnoDB;

-- Table 5: schemes
-- Central repository of Indian Government Financial & Subsidy Schemes for MSMEs
CREATE TABLE IF NOT EXISTS schemes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(180) NOT NULL,
    ministry VARCHAR(150) NOT NULL,
    category VARCHAR(80) NOT NULL COMMENT 'Delayed Payments, Credit Guarantee, Technology Upgradation, Capital Subsidy, Export',
    purpose TEXT NOT NULL,
    eligibility_summary TEXT NOT NULL,
    eligible_msme_types VARCHAR(60) NOT NULL DEFAULT 'Micro, Small, Medium',
    max_subsidy_loan VARCHAR(100) NOT NULL,
    required_documents TEXT NOT NULL,
    official_url VARCHAR(255) NOT NULL,
    helpline VARCHAR(50) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Table 6: support_resources
-- Government Facilitation Centers, DICs, and MSME-DFOs
CREATE TABLE IF NOT EXISTS support_resources (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(180) NOT NULL,
    entity_type VARCHAR(100) NOT NULL COMMENT 'MSME-DFO, District Industries Centre (DIC), Facilitation Council, Testing Centre',
    city_state VARCHAR(120) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    website_url VARCHAR(255) NOT NULL,
    services_offered TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================================
-- 3. PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX idx_invoices_status_due ON invoices(payment_status, due_date);
CREATE INDEX idx_invoices_business ON invoices(business_id);
CREATE INDEX idx_inventory_business ON inventory(business_id);
CREATE INDEX idx_inventory_stock ON inventory(available_quantity, min_stock_level);
CREATE INDEX idx_payments_invoice ON payments(invoice_id);

-- ============================================================================
-- 4. ANALYTICAL DATABASE VIEWS
-- ============================================================================

-- View 1: view_overdue_invoices_summary
-- Calculates days overdue and estimated penal interest under Section 16 of MSMED Act 2006
-- (Compound interest with monthly rests at 3 times the RBI Bank Rate)
CREATE OR REPLACE VIEW view_overdue_invoices_summary AS
SELECT 
    i.id AS invoice_id,
    i.invoice_number,
    b.business_name,
    b.owner_name,
    b.phone AS seller_phone,
    i.buyer_name,
    i.invoice_amount,
    i.amount_paid,
    i.outstanding_amount,
    i.invoice_date,
    i.due_date,
    DATEDIFF(CURRENT_DATE, i.due_date) AS days_overdue,
    ROUND(i.outstanding_amount * (0.195 / 365) * GREATEST(0, DATEDIFF(CURRENT_DATE, i.due_date)), 2) AS estimated_penal_interest_inr
FROM invoices i
JOIN businesses b ON i.business_id = b.id
WHERE i.payment_status != 'PAID' AND i.due_date < CURRENT_DATE;

-- View 2: view_business_cashflow_summary
-- Aggregated cash flow, recovery percentage, and blocked working capital per enterprise
CREATE OR REPLACE VIEW view_business_cashflow_summary AS
SELECT 
    b.id AS business_id,
    b.business_name,
    b.msme_type,
    COUNT(i.id) AS total_invoices_raised,
    COALESCE(SUM(i.invoice_amount), 0) AS total_billed_amount,
    COALESCE(SUM(i.amount_paid), 0) AS total_recovered_amount,
    COALESCE(SUM(i.outstanding_amount), 0) AS total_outstanding_amount,
    COALESCE(SUM(CASE WHEN i.due_date < CURRENT_DATE AND i.payment_status != 'PAID' THEN i.outstanding_amount ELSE 0 END), 0) AS total_overdue_amount,
    ROUND(CASE 
        WHEN SUM(i.invoice_amount) > 0 THEN (SUM(i.amount_paid) / SUM(i.invoice_amount)) * 100 
        ELSE 0 
    END, 2) AS recovery_percentage
FROM businesses b
LEFT JOIN invoices i ON b.id = i.business_id
GROUP BY b.id, b.business_name, b.msme_type;
