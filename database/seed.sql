-- ============================================================================
-- MSME SAHAYAK - REALISTIC DEMONSTRATION SEED DATA
-- Purpose: Realistic dataset for Hackathon demo & local execution testing
-- Note: Clearly labeled as demonstration / test fixtures.
-- ============================================================================

USE msme_sahayak;

-- Disable foreign key checks for clean re-seeding
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE payments;
TRUNCATE TABLE invoices;
TRUNCATE TABLE inventory;
TRUNCATE TABLE businesses;
TRUNCATE TABLE schemes;
TRUNCATE TABLE support_resources;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. BUSINESSES (5 MSMEs across India)
INSERT INTO businesses (id, business_name, owner_name, email, phone, category, msme_type, udyam_reg_number, location, address) VALUES
(1, 'Pune Precision Gears Pvt Ltd', 'Rajesh Kulkarni', 'rajesh@punegears.in', '+91 98220 14820', 'Precision Engineering & Auto Ancillary', 'Small', 'UDYAM-MH-26-0014892', 'Pune, Maharashtra', 'Plot W-42, MIDC Bhosari Industrial Area, Pune - 411026'),
(2, 'Surat Silk & Jacquard Weavers', 'Dinesh Patel', 'dinesh@suratweaves.com', '+91 98980 23114', 'Textiles & Apparel', 'Micro', 'UDYAM-GJ-01-0082341', 'Surat, Gujarat', 'Shed No. 14, Pandesara GIDC, Surat - 394221'),
(3, 'Bengaluru Micro Circuits & Sensors', 'Ananya Narayanan', 'ananya@bengalurucircuits.tech', '+91 94481 55620', 'Electronics & IoT Hardware', 'Micro', 'UDYAM-KR-03-0045199', 'Bengaluru, Karnataka', 'Phase II, Peenya Industrial Area, Bengaluru - 560058'),
(4, 'Ludhiana Fasteners & Forgings', 'Harpreet Singh Bhullar', 'harpreet@ludhianafasteners.in', '+91 98140 78201', 'Metal Fabrication & Fasteners', 'Small', 'UDYAM-PB-12-0033284', 'Ludhiana, Punjab', 'Street 4, Focal Point Industrial Zone, Ludhiana - 141010'),
(5, 'Coimbatore Precision Agro Pumps', 'M. S. Sundaram', 'sundaram@coimbatoreagropumps.com', '+91 94432 99014', 'Agro Machinery & Pumps', 'Medium', 'UDYAM-TN-03-0091245', 'Coimbatore, Tamil Nadu', 'No. 88, SIDCO Industrial Estate, Kurichi, Coimbatore - 641021');

-- 2. INVOICES (16 Invoices spanning current, overdue past 45-day statutory limit, partial & cleared)
INSERT INTO invoices (id, invoice_number, business_id, buyer_name, buyer_gstin, invoice_amount, amount_paid, outstanding_amount, invoice_date, due_date, payment_status, notes) VALUES
-- Business 1: Pune Precision Gears
(1, 'INV-2026-001', 1, 'Tata AutoComp Systems Ltd', '27AAACT2918K1ZN', 485000.00, 485000.00, 0.00, '2026-01-10', '2026-02-24', 'PAID', 'Delivery of spur gears batch #401; payment cleared via NEFT'),
(2, 'INV-2026-002', 1, 'Mahindra Heavy Commercial Ltd', '27AABCM8291F1ZY', 750000.00, 300000.00, 450000.00, '2026-01-18', '2026-03-04', 'PARTIAL', 'Bevel gear shafts; first tranche paid on 15 Feb, balance pending'),
(3, 'INV-2026-003', 1, 'Bajaj Auto Ancillaries Vendor Hub', '27AAACB3820M1ZX', 620000.00, 0.00, 620000.00, '2025-12-05', '2026-01-19', 'OVERDUE', 'High-speed pinion assemblies; overdue past 45 days. Eligible for MSME Samadhaan'),
(4, 'INV-2026-004', 1, 'Force Motors Assembly Division', '27AAACF1029L1ZW', 310000.00, 0.00, 310000.00, '2026-02-20', '2026-04-06', 'PENDING', 'Transmission casing components under 45-day credit period'),

-- Business 2: Surat Silk Weavers
(5, 'INV-2026-005', 2, 'FabIndia Overseas Logistics', '07AAACF4928B1ZR', 280000.00, 280000.00, 0.00, '2026-01-05', '2026-02-19', 'PAID', 'Handcrafted zari silk rolls delivered to Mumbai central warehouse'),
(6, 'INV-2026-006', 2, 'Reliance Retail Trends Division', '24AAACR7192C1ZQ', 540000.00, 150000.00, 390000.00, '2025-11-20', '2026-01-04', 'OVERDUE', 'Festive jacquard fabric consignment; overdue by over 60 days'),
(7, 'INV-2026-007', 2, 'Manyavar Apparel Wholesale Hub', '19AABCV2019H1ZP', 195000.00, 0.00, 195000.00, '2026-02-15', '2026-03-31', 'PENDING', 'Brocade borders; pending acceptance inspection'),

-- Business 3: Bengaluru Micro Circuits
(8, 'INV-2026-008', 3, 'Ather Energy Smart Systems', '29AABCA9182D1ZO', 420000.00, 420000.00, 0.00, '2026-01-12', '2026-02-26', 'PAID', 'Battery management sensor interface boards'),
(9, 'INV-2026-009', 3, 'Ola Electric Mobility Factory', '29AAFCO3918E1ZN', 890000.00, 200000.00, 690000.00, '2025-12-10', '2026-01-24', 'OVERDUE', 'Custom BMS controller micro-modules; delayed beyond contractual 45 days'),
(10, 'INV-2026-010', 3, 'Schneider Electric India Pvt Ltd', '29AAACS2910G1ZM', 345000.00, 0.00, 345000.00, '2026-02-28', '2026-04-14', 'PENDING', 'Precision thermal sensors lot #12'),

-- Business 4: Ludhiana Fasteners
(11, 'INV-2026-011', 4, 'Hero Cycles Component Hub', '03AAACH3891J1ZL', 380000.00, 380000.00, 0.00, '2026-01-08', '2026-02-22', 'PAID', 'Grade 8.8 tensile frame bolts and hex nuts'),
(12, 'INV-2026-012', 4, 'Sonalika Tractors Procurement', '03AABCI4819K1ZK', 650000.00, 0.00, 650000.00, '2025-11-15', '2025-12-30', 'OVERDUE', 'Heavy duty forging fasteners; overdue 70+ days; follow-up sent'),
(13, 'INV-2026-013', 4, 'Action Construction Equipment Ltd', '06AAACA9018L1ZJ', 275000.00, 100000.00, 175000.00, '2026-02-01', '2026-03-17', 'PARTIAL', 'Crane foundation anchors; partial release received'),

-- Business 5: Coimbatore Agro Pumps
(14, 'INV-2026-014', 5, 'Kirloskar Brothers Distributor Net', '33AAACK4019N1ZH', 920000.00, 920000.00, 0.00, '2026-01-15', '2026-03-01', 'PAID', 'Submersible 5HP solar pump sets batch #88'),
(15, 'INV-2026-015', 5, 'Shakti Pumps Northern Logistics', '23AAACS9182P1ZG', 1150000.00, 350000.00, 800000.00, '2025-12-01', '2026-01-15', 'OVERDUE', 'Monobloc agricultural pump impellers; overdue by 50+ days'),
(16, 'INV-2026-016', 5, 'Jain Irrigation Systems Dealership', '27AAACJ8192R1ZF', 460000.00, 0.00, 460000.00, '2026-02-25', '2026-04-11', 'PENDING', 'Drip automation solenoid valve cast bodies');

-- 3. PAYMENTS (12 Payment receipts recorded)
INSERT INTO payments (id, invoice_id, payment_date, amount, payment_mode, reference_number, notes) VALUES
(1, 1, '2026-02-20', 485000.00, 'NEFT/RTGS', 'HDFC260220198214', 'Full settlement received against INV-2026-001'),
(2, 2, '2026-02-15', 300000.00, 'Bank Transfer', 'SBIN002615481920', 'Tranche 1 payment against Mahindra purchase order'),
(3, 5, '2026-02-18', 280000.00, 'NEFT/RTGS', 'ICIC260218819203', 'Full clearance for silk roll delivery'),
(4, 6, '2025-12-28', 150000.00, 'Cheque', 'CHQ-889102-KOTAK', 'Advance partial release before balance dispute'),
(5, 8, '2026-02-25', 420000.00, 'NEFT/RTGS', 'AXIS260225109284', 'Final clearance Ather Energy lot #1'),
(6, 9, '2026-01-10', 200000.00, 'UPI', 'UPI/260110829104/ICICI', 'Interim milestone payment for BMS controllers'),
(7, 11, '2026-02-20', 380000.00, 'NEFT/RTGS', 'PUNB260220918231', 'Full payment credited for frame bolts'),
(8, 13, '2026-02-22', 100000.00, 'Bank Transfer', 'UTIB260222184910', 'First installment for crane anchors'),
(9, 14, '2026-02-28', 500000.00, 'NEFT/RTGS', 'IOBA260228391820', 'Part clearance 1 for Kirloskar batch'),
(10, 14, '2026-03-01', 420000.00, 'NEFT/RTGS', 'IOBA260301982341', 'Final balance clearance for Kirloskar batch'),
(11, 15, '2025-12-20', 350000.00, 'Bank Transfer', 'BARB251220918410', 'Initial milestone payment on pump supply'),
(12, 2, '2026-02-28', 50000.00, 'UPI', 'UPI/260228491820/SBI', 'Supplementary ad-hoc payment received');

-- 4. INVENTORY (12 items with healthy stock and low-stock alert triggers)
INSERT INTO inventory (id, business_id, product_name, product_category, available_quantity, min_stock_level, unit_price, unit_of_measure, supplier_name) VALUES
(1, 1, 'EN-24 Alloy Steel Round Bars (50mm)', 'Raw Material', 8, 25, 4200.00, 'Meters', 'Kalyani Steels Ltd, Pune'),
(2, 1, 'Hardened Spur Pinion Gears (24T)', 'Finished Goods', 140, 50, 1850.00, 'Units', 'In-House Production'),
(3, 1, 'CNC Carbide Cutting Inserts', 'Spare Parts', 12, 30, 850.00, 'Units', 'Sandvik Coromant India'),
(4, 2, 'Raw Mulberry Silk Yarn (Denier 20/22)', 'Raw Material', 15, 50, 3400.00, 'Kg', 'Karnataka Silk Marketing Board'),
(5, 2, 'Jacquard Zari Brocade Fabric (Navy/Gold)', 'Finished Goods', 320, 100, 780.00, 'Meters', 'In-House Weaving'),
(6, 2, 'Eco-Friendly Reactive Dye Pigments', 'Raw Material', 6, 20, 1200.00, 'Kg', 'Atul Ltd, Valsad'),
(7, 3, 'STM32 Microcontroller IC Chips', 'Raw Material', 45, 150, 480.00, 'Units', 'Mouser Electronics India'),
(8, 3, 'Dual-Channel BMS Controller Modules', 'Finished Goods', 85, 40, 2950.00, 'Units', 'In-House Assembly'),
(9, 4, 'High Tensile M16x80 Flange Bolts', 'Finished Goods', 1200, 500, 38.00, 'Units', 'In-House Forging'),
(10, 4, 'Cold Rolled Steel Wire Rods (12mm)', 'Raw Material', 18, 50, 5800.00, 'Quintals', 'Steel Authority of India Ltd (SAIL)'),
(11, 5, 'Cast Iron Pump Impeller Castings (5HP)', 'Raw Material', 14, 40, 1650.00, 'Units', 'Kovai Foundry Cluster, Coimbatore'),
(12, 5, 'Submersible Solar Agro Pumpsets (5HP)', 'Finished Goods', 28, 15, 34500.00, 'Units', 'In-House Assembly');

-- 5. GOVERNMENT SCHEMES & FINANCIAL SUPPORT
INSERT INTO schemes (id, name, ministry, category, purpose, eligibility_summary, eligible_msme_types, max_subsidy_loan, required_documents, official_url, helpline) VALUES
(1, 'MSME Samadhaan (Delayed Payment Redressal)', 'Ministry of MSME, Govt of India', 'Delayed Payments', 'Online complaint monitoring system for micro & small enterprises to recover unpaid dues from buyers past 45 days under Section 18 of MSMED Act 2006. Buyers must pay compound interest at 3x RBI bank rate.', 'Registered Micro and Small enterprises holding valid Udyam Registration, having supply agreements and pending invoices past 45 days.', 'Micro, Small', 'Statutory recovery + 3x RBI compound interest', 'Udyam Certificate, Purchase Order copy, Delivery Challan / Lorry Receipt, Unpaid Invoice copy', 'https://samadhaan.msme.gov.in', '1800-180-6763'),
(2, 'CGTMSE (Credit Guarantee Scheme for MSEs)', 'Ministry of MSME & SIDBI', 'Credit Guarantee', 'Provides collateral-free credit facilities (both term loans and working capital) up to ₹5 Crore to new and existing micro and small enterprises through scheduled commercial banks and NBFCs.', 'New or existing Micro and Small Enterprises engaged in manufacturing or service activities. Retail trade also covered up to specified limits.', 'Micro, Small', 'Collateral-free loans up to ₹5 Crore (75% to 85% guarantee coverage)', 'ITR for 2 years, Projected Balance Sheet, Udyam Registration, Project Report, KYC', 'https://www.cgtmse.in', '022-67531100'),
(3, 'PMEGP (Prime Minister Employment Generation)', 'Ministry of MSME & KVIC', 'Capital Subsidy', 'Credit-linked subsidy scheme for generating self-employment through establishment of micro-enterprises in non-farm sectors.', 'Any individual above 18 years of age. For project costs above ₹10 Lakh in manufacturing, minimum 8th class pass required.', 'Micro', 'Subsidy of 15% to 35% on project cost up to ₹50 Lakh (Manufacturing) / ₹20 Lakh (Service)', 'Aadhaar, Caste/Category Certificate, Detailed Project Report (DPR), Educational certificate', 'https://www.kviconline.gov.in/pmegpeportal', '1800-3000-0034'),
(4, 'Pradhan Mantri MUDRA Yojana (PMMY)', 'Ministry of Finance, Govt of India', 'Working Capital Loan', 'Provides collateral-free institutional credit up to ₹10 Lakh to micro and small non-corporate, non-farm businesses in three tiers: Shishu (up to ₹50k), Kishore (₹50k-₹5L), Tarun (₹5L-₹10L).', 'Non-corporate small business segment (proprietorship, partnership, small manufacturing units, shopkeepers, artisans).', 'Micro, Small', 'Up to ₹10 Lakh (No collateral required)', 'Proof of identity, Proof of residence, Quotation of machinery/items, Business address proof', 'https://www.mudra.org.in', '1800-180-1111'),
(5, 'TReDS (Trade Receivables Discounting System)', 'Reserve Bank of India (RBI)', 'Invoice Discounting', 'Institutional mechanism set up by RBI to facilitate financing of trade receivables of MSMEs from corporate buyers and government departments through multiple financiers (factoring). Eliminates delayed payment risk.', 'All MSMEs holding Udyam Registration supplying to corporate buyers, PSUs, or government departments.', 'Micro, Small, Medium', 'Up to 100% invoice discounting at competitive market auction rates', 'Udyam Registration, Bank statements, GST Returns, Valid undisputed invoices and buyer acceptance', 'https://www.rbi.org.in', '022-22601000'),
(6, 'MSME Champions (Digital Technology & Upgradation)', 'Ministry of MSME, Govt of India', 'Digital & Technology', 'Unified portal offering digital tools, grievance redressal, design clinic subsidies, incubation assistance, and intellectual property rights (IPR) support for competitive MSME growth.', 'Any registered MSME with Udyam Registration seeking operational upgrades, quality certifications, or dispute facilitation.', 'Micro, Small, Medium', 'Subsidies up to ₹15 Lakh for design & incubation support', 'Udyam Certificate, Company incorporation details, Project proposal', 'https://champions.gov.in', '011-23063288'),
(7, 'MSME Sustainable (ZED) Certification Scheme', 'Ministry of MSME & Quality Council of India', 'Quality & Green Technology', 'Incentivizes MSMEs to adopt Zero Defect Zero Effect (ZED) manufacturing practices with subsidies on assessment fees (up to 80% for Micro, 60% for Small, 50% for Medium) and financial rewards on clean tech adoption.', 'All manufacturing MSMEs with Udyam Registration.', 'Micro, Small, Medium', 'Assessment subsidy up to ₹5 Lakh + concession on bank loan interest rates', 'Udyam Certificate, Factory photos, Self-assessment documents, Pollution control consent', 'https://zed.msme.gov.in', '011-23379321'),
(8, 'RAMP (Raising and Accelerating MSME Performance)', 'Ministry of MSME & World Bank', 'Capacity Building & Grants', 'World Bank-supported Central Sector Scheme aimed at improving MSMEs’ access to market and credit, strengthening governance, and addressing delayed payments through state strategic investment plans.', 'MSMEs operating across participating states and sector clusters.', 'Micro, Small, Medium', 'Cluster-level grants and subsidized capacity building programs', 'Udyam Registration, Cluster association membership', 'https://ramp.msme.gov.in', '011-23062215');

-- 6. SUPPORT RESOURCES (Facilitation Councils & MSME-DFOs)
INSERT INTO support_resources (id, name, entity_type, city_state, address, phone, email, website_url, services_offered) VALUES
(1, 'Micro & Small Enterprises Facilitation Council (MSEFC) - Maharashtra', 'Facilitation Council', 'Mumbai / Pune, Maharashtra', 'Directorate of Industries, 2nd Floor, New Administrative Building, Madam Cama Road, Mumbai - 400032', '+91 22 2202 8616', 'msefc.mumbai@maharashtra.gov.in', 'https://di.maharashtra.gov.in', 'Arbitration & conciliation for delayed payments under Section 18 of MSMED Act 2006; recovery decree issuance.'),
(2, 'MSME Development & Facilitation Office (MSME-DFO) - Pune', 'MSME-DFO', 'Pune, Maharashtra', 'Kurla-Andheri Road / Branch Office: Shankarshet Road, Swargate, Pune - 411037', '+91 20 2444 0472', 'dfo-pune@dcmsme.gov.in', 'https://dcmsme.gov.in', 'Technical consultancy, energy audits, Udyam registration assistance, Lean manufacturing scheme counseling.'),
(3, 'District Industries Centre (DIC) - Surat', 'District Industries Centre (DIC)', 'Surat, Gujarat', 'Multi-Storeyed Building, Nanpura, Surat - 395001', '+91 261 246 5122', 'dic-surat@gujarat.gov.in', 'https://ic.gujarat.gov.in', 'Subsidies under Gujarat Industrial Policy, raw material facilitation, power tariff subsidy, MSME award nominations.'),
(4, 'MSME-DFO Bengaluru (Karnataka Region)', 'MSME-DFO', 'Bengaluru, Karnataka', 'Industrial Estate, Rajajinagar, Bengaluru - 560010', '+91 80 2310 7040', 'dfo-bangalore@dcmsme.gov.in', 'https://msmedibangalore.gov.in', 'Testing laboratories for electronics/mechanical MSMEs, export facilitation cell, vendor development meets with Defence/PSUs.'),
(5, 'MSEFC Punjab & District Facilitation Centre', 'Facilitation Council', 'Ludhiana / Chandigarh, Punjab', 'Department of Industries and Commerce, Sector 17, Chandigarh / DIC Focal Point Ludhiana', '+91 161 267 4910', 'msefc.punjab@punjab.gov.in', 'https://pbindustries.gov.in', 'Expedited hearing hearings for delayed payments against large automotive and cycle OEMs; legal recovery proceedings.'),
(6, 'MSME Technology Centre & Tool Room (MSME-TC) - Coimbatore', 'Testing Centre', 'Coimbatore, Tamil Nadu', 'SIDCO Industrial Complex, Kurichi, Coimbatore - 641021', '+91 422 267 2201', 'contact@coimbatoretoolroom.in', 'https://www.dcmsme.gov.in', 'High precision CNC tool room, pump performance testing facilities, 3D coordinate measuring machine (CMM) calibration.');
