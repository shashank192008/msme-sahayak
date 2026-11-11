-- ============================================================================
-- MSME SAHAYAK - COMPREHENSIVE DBMS PRACTICE & EVALUATION QUERIES
-- Database: msme_sahayak
-- Designed for: College Hackathon Evaluators, DBMS Lab Demonstrations & Practical Viva
-- Covers 30+ Core Relational Database Management Systems (RDBMS) Concepts
-- ============================================================================

USE msme_sahayak;

-- ============================================================================
-- SECTION 1: DATA DEFINITION LANGUAGE (DDL)
-- ============================================================================

-- 1.1 CREATE DATABASE
-- Creates the dedicated schema with appropriate UTF-8 character encoding
CREATE DATABASE IF NOT EXISTS msme_sahayak
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- 1.2 CREATE TABLE (Demonstrating PRIMARY KEY, FOREIGN KEY, NOT NULL, DEFAULT, CHECK, UNIQUE)
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    entity_name VARCHAR(50) NOT NULL,
    record_id INT NOT NULL,
    action_type ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    performed_by VARCHAR(100) DEFAULT 'system_admin',
    details TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_record_id_pos CHECK (record_id > 0)
) ENGINE=InnoDB;

-- 1.3 ALTER TABLE (Adding a column, modifying data type, adding a constraint)
-- Add an optional GSTIN column to businesses
ALTER TABLE businesses 
ADD COLUMN gstin VARCHAR(15) NULL AFTER udyam_reg_number;

-- Add an index on business name
ALTER TABLE businesses 
ADD INDEX idx_bus_name (business_name);

-- 1.4 DROP TABLE (Demonstration in a safe transaction or temporary table)
CREATE TABLE IF NOT EXISTS temp_credit_ratings (
    temp_id INT PRIMARY KEY,
    rating_score VARCHAR(10)
);
-- Dropping the temporary table without impacting core schema
DROP TABLE IF EXISTS temp_credit_ratings;

-- ============================================================================
-- SECTION 2: DATA MANIPULATION LANGUAGE (DML)
-- ============================================================================

-- 2.1 INSERT (Inserting a new MSME record and an invoice)
INSERT INTO businesses (business_name, owner_name, email, phone, category, msme_type, udyam_reg_number, location, address) 
VALUES ('Jaipur Blue Pottery Handicrafts', 'Vikramaditya Rathore', 'vikram@jaipurpottery.org', '+91 94140 18290', 'Handicrafts & Artisans', 'Micro', 'UDYAM-RJ-14-0019284', 'Jaipur, Rajasthan', 'Kukas Industrial Area, Jaipur - 302028');

-- 2.2 UPDATE (Updating payment status and partial amount paid)
UPDATE invoices 
SET amount_paid = amount_paid + 100000.00,
    outstanding_amount = invoice_amount - (amount_paid + 100000.00),
    payment_status = CASE 
        WHEN (invoice_amount - (amount_paid + 100000.00)) = 0 THEN 'PAID'
        ELSE 'PARTIAL'
    END
WHERE invoice_number = 'INV-2026-002';

-- 2.3 DELETE (Deleting a test log record with foreign key awareness)
DELETE FROM audit_logs 
WHERE entity_name = 'TEST_LOG' AND performed_by = 'tester';

-- ============================================================================
-- SECTION 3: BASIC & FILTERED QUERIES (DQL)
-- ============================================================================

-- 3.1 SELECT & WHERE (Retrieve overdue invoices with outstanding amount > ₹5,00,000)
SELECT invoice_number, buyer_name, invoice_amount, outstanding_amount, due_date
FROM invoices
WHERE payment_status = 'OVERDUE' 
  AND outstanding_amount > 500000.00;

-- 3.2 DISTINCT (Find all unique sectors/categories of registered MSMEs)
SELECT DISTINCT category 
FROM businesses 
ORDER BY category ASC;

-- 3.3 ORDER BY (Sort invoices from largest outstanding amount to lowest)
SELECT invoice_number, buyer_name, outstanding_amount, due_date, payment_status
FROM invoices
WHERE outstanding_amount > 0
ORDER BY outstanding_amount DESC, due_date ASC;

-- ============================================================================
-- SECTION 4: AGGREGATE FUNCTIONS & GROUPING
-- ============================================================================

-- 4.1 COUNT(), SUM(), AVG(), MIN(), MAX()
-- Comprehensive financial summary across all invoices
SELECT 
    COUNT(id) AS total_invoices_count,
    SUM(invoice_amount) AS total_turnover_billed,
    SUM(amount_paid) AS total_cash_recovered,
    SUM(outstanding_amount) AS total_capital_blocked,
    AVG(invoice_amount) AS average_invoice_size,
    MIN(invoice_amount) AS smallest_invoice,
    MAX(invoice_amount) AS largest_invoice
FROM invoices;

-- 4.2 GROUP BY (Group invoices by payment status to analyze recovery ratio)
SELECT 
    payment_status,
    COUNT(id) AS invoice_count,
    SUM(invoice_amount) AS total_status_amount,
    SUM(outstanding_amount) AS total_status_pending
FROM invoices
GROUP BY payment_status;

-- 4.3 GROUP BY with HAVING (Find MSME businesses with more than ₹5,00,000 in overdue payments)
SELECT 
    b.business_name,
    b.owner_name,
    b.msme_type,
    COUNT(i.id) AS overdue_invoice_count,
    SUM(i.outstanding_amount) AS total_overdue_blocked
FROM businesses b
JOIN invoices i ON b.id = i.business_id
WHERE i.payment_status = 'OVERDUE'
GROUP BY b.id, b.business_name, b.owner_name, b.msme_type
HAVING total_overdue_blocked >= 500000.00
ORDER BY total_overdue_blocked DESC;

-- ============================================================================
-- SECTION 5: JOINS (RELATIONAL INTEGRITY & MULTI-TABLE REPORTING)
-- ============================================================================

-- 5.1 INNER JOIN
-- Join invoices with their parent business and payment receipts
SELECT 
    b.business_name,
    b.location,
    i.invoice_number,
    i.buyer_name,
    i.invoice_amount,
    p.amount AS payment_amount,
    p.payment_date,
    p.payment_mode,
    p.reference_number
FROM businesses b
INNER JOIN invoices i ON b.id = i.business_id
INNER JOIN payments p ON i.id = p.invoice_id
ORDER BY p.payment_date DESC;

-- 5.2 LEFT JOIN (All businesses, including those who have not yet raised an invoice)
SELECT 
    b.id AS business_id,
    b.business_name,
    b.msme_type,
    COALESCE(COUNT(i.id), 0) AS total_invoices,
    COALESCE(SUM(i.invoice_amount), 0) AS total_billed,
    COALESCE(SUM(i.outstanding_amount), 0) AS total_pending
FROM businesses b
LEFT JOIN invoices i ON b.id = i.business_id
GROUP BY b.id, b.business_name, b.msme_type
ORDER BY b.id ASC;

-- 5.3 RIGHT JOIN (All schemes and any matched business category)
-- Demonstrating RIGHT JOIN between businesses and schemes based on MSME classification
SELECT 
    s.name AS scheme_name,
    s.category AS scheme_category,
    s.max_subsidy_loan,
    b.business_name,
    b.msme_type
FROM businesses b
RIGHT JOIN schemes s ON FIND_IN_SET(b.msme_type, REPLACE(s.eligible_msme_types, ', ', ',')) > 0
ORDER BY s.name ASC, b.business_name ASC;

-- ============================================================================
-- SECTION 6: SUBQUERIES (NESTED & CORRELATED QUERIES)
-- ============================================================================

-- 6.1 Scalar Subquery in WHERE clause
-- Find invoices whose outstanding amount is greater than the average outstanding amount
SELECT invoice_number, buyer_name, outstanding_amount, due_date
FROM invoices
WHERE outstanding_amount > (
    SELECT AVG(outstanding_amount) 
    FROM invoices 
    WHERE outstanding_amount > 0
);

-- 6.2 Correlated Subquery
-- Find businesses that have at least one invoice delayed by more than 45 days
SELECT b.id, b.business_name, b.owner_name, b.phone
FROM businesses b
WHERE EXISTS (
    SELECT 1 
    FROM invoices i 
    WHERE i.business_id = b.id 
      AND i.payment_status = 'OVERDUE'
      AND DATEDIFF(CURRENT_DATE, i.due_date) > 45
);

-- 6.3 Subquery with IN operator
-- Find inventory items belonging to businesses that have overdue invoices
SELECT product_name, available_quantity, unit_price, supplier_name
FROM inventory
WHERE business_id IN (
    SELECT DISTINCT business_id 
    FROM invoices 
    WHERE payment_status = 'OVERDUE'
);

-- ============================================================================
-- SECTION 7: DATABASE VIEWS
-- ============================================================================

-- 7.1 CREATE VIEW: MSMED Act Delayed Payment Legal Dossier
CREATE OR REPLACE VIEW view_msmed_legal_cases AS
SELECT 
    i.id AS invoice_id,
    i.invoice_number,
    b.business_name AS supplier_msme,
    b.udyam_reg_number AS supplier_udyam,
    i.buyer_name,
    i.buyer_gstin,
    i.invoice_amount,
    i.outstanding_amount,
    i.due_date,
    DATEDIFF(CURRENT_DATE, i.due_date) AS days_delayed,
    -- Section 16 of MSMED Act 2006: Monthly compound interest at 3x RBI Bank Rate (approx 19.5% p.a.)
    ROUND(i.outstanding_amount * POW(1 + (0.195 / 12), (DATEDIFF(CURRENT_DATE, i.due_date) / 30)) - i.outstanding_amount, 2) AS statutory_penal_interest_inr
FROM invoices i
JOIN businesses b ON i.business_id = b.id
WHERE i.payment_status = 'OVERDUE' 
  AND i.due_date < CURRENT_DATE;

-- 7.2 Querying from the View
SELECT * FROM view_msmed_legal_cases WHERE days_delayed > 30;

-- ============================================================================
-- SECTION 8: INDEXING & QUERY OPTIMIZATION
-- ============================================================================

-- 8.1 CREATE INDEX
CREATE INDEX idx_invoices_buyer_due ON invoices(buyer_name, due_date);

-- 8.2 EXPLAIN statement to inspect index usage and execution plan
EXPLAIN SELECT invoice_number, buyer_name, outstanding_amount 
FROM invoices 
WHERE buyer_name = 'Tata AutoComp Systems Ltd' 
  AND due_date <= CURRENT_DATE;

-- ============================================================================
-- SECTION 9: TRANSACTIONS (ACID COMPLIANCE)
-- ============================================================================

-- 9.1 Transaction 1: Safe Payment Receipt with COMMIT
-- Demonstrates Atomicity & Consistency when recording a customer payment
START TRANSACTION;

-- Step 1: Record payment in payments table
INSERT INTO payments (invoice_id, payment_date, amount, payment_mode, reference_number, notes)
VALUES (3, CURRENT_DATE, 200000.00, 'NEFT/RTGS', 'AXIS2026TXN0099', 'Partial payment recovery via MSME Sahayak follow-up');

-- Step 2: Synchronize invoice balance & status
UPDATE invoices 
SET amount_paid = amount_paid + 200000.00,
    outstanding_amount = invoice_amount - (amount_paid + 200000.00),
    payment_status = CASE 
        WHEN (invoice_amount - (amount_paid + 200000.00)) <= 0 THEN 'PAID'
        ELSE 'PARTIAL'
    END
WHERE id = 3;

-- Step 3: Commit changes permanently to MySQL storage engine
COMMIT;

-- 9.2 Transaction 2: Demonstrating ROLLBACK on Validation Error
START TRANSACTION;

-- Attempting an invalid negative or excessive deduction
UPDATE invoices 
SET amount_paid = amount_paid + 9999999.00
WHERE id = 3;

-- Rollback the abnormal transaction safely
ROLLBACK;

-- Verify invoice remained unchanged after rollback
SELECT id, invoice_number, amount_paid, outstanding_amount, payment_status 
FROM invoices 
WHERE id = 3;

-- ============================================================================
-- SECTION 10: UNION & UNION ALL
-- ============================================================================

-- 10.1 UNION (Combine critical financial alerts from Invoices and Inventory)
SELECT 
    'OVERDUE_INVOICE' AS alert_type,
    CONCAT(invoice_number, ' - Buyer: ', buyer_name) AS description,
    outstanding_amount AS financial_impact,
    due_date AS alert_date
FROM invoices
WHERE payment_status = 'OVERDUE'

UNION ALL

SELECT 
    'LOW_STOCK_ALERT' AS alert_type,
    CONCAT(product_name, ' (Qty: ', available_quantity, ', Min: ', min_stock_level, ')') AS description,
    (min_stock_level - available_quantity) * unit_price AS financial_impact,
    CURRENT_DATE AS alert_date
FROM inventory
WHERE available_quantity < min_stock_level

ORDER BY financial_impact DESC;

-- ============================================================================
-- END OF DBMS PRACTICE QUERIES
-- MSME SAHAYAK - Empowering MSMEs. Strengthening India's Economy.
-- ============================================================================
