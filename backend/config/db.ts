/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export interface DbStatus {
  connected: boolean;
  type: 'mysql' | 'mock_sql_fallback';
  host?: string;
  database?: string;
  message: string;
}

// Database configuration loaded from environment variables
const dbConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'msme_sahayak',
  port: parseInt(process.env.MYSQL_PORT || '3306', 10),
  ssl: process.env.MYSQL_SSL === 'true'
    ? { minVersion: 'TLSv1.2' }
    : undefined,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

let pool: mysql.Pool | null = null;
let activeDbStatus: DbStatus = {
  connected: false,
  type: 'mock_sql_fallback',
  message: 'Initializing database...',
};

// Initial in-memory relational store to guarantee 100% zero-crash operation
// and instant live preview even when local MySQL server isn't started yet.
export interface BusinessRecord {
  id: number;
  business_name: string;
  owner_name: string;
  email: string;
  phone: string;
  category: string;
  msme_type: 'Micro' | 'Small' | 'Medium';
  udyam_reg_number: string | null;
  location: string;
  address: string;
  created_at: string;
}

export interface InvoiceRecord {
  id: number;
  invoice_number: string;
  business_id: number;
  buyer_name: string;
  buyer_gstin?: string | null;
  invoice_amount: number;
  amount_paid: number;
  outstanding_amount: number;
  invoice_date: string;
  due_date: string;
  payment_status: 'PAID' | 'PENDING' | 'PARTIAL' | 'OVERDUE';
  notes?: string | null;
  created_at: string;
}

export interface PaymentRecord {
  id: number;
  invoice_id: number;
  payment_date: string;
  amount: number;
  payment_mode: 'NEFT/RTGS' | 'UPI' | 'Cheque' | 'Bank Transfer' | 'Cash';
  reference_number?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface InventoryRecord {
  id: number;
  business_id: number;
  product_name: string;
  product_category: string;
  available_quantity: number;
  min_stock_level: number;
  unit_price: number;
  unit_of_measure: string;
  supplier_name: string;
  created_at: string;
}

export interface SchemeRecord {
  id: number;
  name: string;
  ministry: string;
  category: string;
  purpose: string;
  eligibility_summary: string;
  eligible_msme_types: string;
  max_subsidy_loan: string;
  required_documents: string;
  official_url: string;
  helpline?: string | null;
}

export interface SupportResourceRecord {
  id: number;
  name: string;
  entity_type: string;
  city_state: string;
  address: string;
  phone: string;
  email: string;
  website_url: string;
  services_offered: string;
}

// Pre-seeded relational tables
export const memoryStore = {
  businesses: [
    {
      id: 1,
      business_name: 'Pune Precision Gears Pvt Ltd',
      owner_name: 'Rajesh Kulkarni',
      email: 'rajesh@punegears.in',
      phone: '+91 98220 14820',
      category: 'Precision Engineering & Auto Ancillary',
      msme_type: 'Small' as const,
      udyam_reg_number: 'UDYAM-MH-26-0014892',
      location: 'Pune, Maharashtra',
      address: 'Plot W-42, MIDC Bhosari Industrial Area, Pune - 411026',
      created_at: '2025-10-12T10:00:00Z',
    },
    {
      id: 2,
      business_name: 'Surat Silk & Jacquard Weavers',
      owner_name: 'Dinesh Patel',
      email: 'dinesh@suratweaves.com',
      phone: '+91 98980 23114',
      category: 'Textiles & Apparel',
      msme_type: 'Micro' as const,
      udyam_reg_number: 'UDYAM-GJ-01-0082341',
      location: 'Surat, Gujarat',
      address: 'Shed No. 14, Pandesara GIDC, Surat - 394221',
      created_at: '2025-11-05T11:30:00Z',
    },
    {
      id: 3,
      business_name: 'Bengaluru Micro Circuits & Sensors',
      owner_name: 'Ananya Narayanan',
      email: 'ananya@bengalurucircuits.tech',
      phone: '+91 94481 55620',
      category: 'Electronics & IoT Hardware',
      msme_type: 'Micro' as const,
      udyam_reg_number: 'UDYAM-KR-03-0045199',
      location: 'Bengaluru, Karnataka',
      address: 'Phase II, Peenya Industrial Area, Bengaluru - 560058',
      created_at: '2025-11-20T09:15:00Z',
    },
    {
      id: 4,
      business_name: 'Ludhiana Fasteners & Forgings',
      owner_name: 'Harpreet Singh Bhullar',
      email: 'harpreet@ludhianafasteners.in',
      phone: '+91 98140 78201',
      category: 'Metal Fabrication & Fasteners',
      msme_type: 'Small' as const,
      udyam_reg_number: 'UDYAM-PB-12-0033284',
      location: 'Ludhiana, Punjab',
      address: 'Street 4, Focal Point Industrial Zone, Ludhiana - 141010',
      created_at: '2025-12-01T14:40:00Z',
    },
    {
      id: 5,
      business_name: 'Coimbatore Precision Agro Pumps',
      owner_name: 'M. S. Sundaram',
      email: 'sundaram@coimbatoreagropumps.com',
      phone: '+91 94432 99014',
      category: 'Agro Machinery & Pumps',
      msme_type: 'Medium' as const,
      udyam_reg_number: 'UDYAM-TN-03-0091245',
      location: 'Coimbatore, Tamil Nadu',
      address: 'No. 88, SIDCO Industrial Estate, Kurichi, Coimbatore - 641021',
      created_at: '2025-12-15T16:20:00Z',
    },
  ] as BusinessRecord[],

  invoices: [
    {
      id: 1,
      invoice_number: 'INV-2026-001',
      business_id: 1,
      buyer_name: 'Tata AutoComp Systems Ltd',
      buyer_gstin: '27AAACT2918K1ZN',
      invoice_amount: 485000.0,
      amount_paid: 485000.0,
      outstanding_amount: 0.0,
      invoice_date: '2026-01-10',
      due_date: '2026-02-24',
      payment_status: 'PAID' as const,
      notes: 'Delivery of spur gears batch #401; payment cleared via NEFT',
      created_at: '2026-01-10T10:00:00Z',
    },
    {
      id: 2,
      invoice_number: 'INV-2026-002',
      business_id: 1,
      buyer_name: 'Mahindra Heavy Commercial Ltd',
      buyer_gstin: '27AABCM8291F1ZY',
      invoice_amount: 750000.0,
      amount_paid: 300000.0,
      outstanding_amount: 450000.0,
      invoice_date: '2026-01-18',
      due_date: '2026-03-04',
      payment_status: 'PARTIAL' as const,
      notes: 'Bevel gear shafts; first tranche paid on 15 Feb, balance pending',
      created_at: '2026-01-18T11:00:00Z',
    },
    {
      id: 3,
      invoice_number: 'INV-2026-003',
      business_id: 1,
      buyer_name: 'Bajaj Auto Ancillaries Vendor Hub',
      buyer_gstin: '27AAACB3820M1ZX',
      invoice_amount: 620000.0,
      amount_paid: 0.0,
      outstanding_amount: 620000.0,
      invoice_date: '2025-12-05',
      due_date: '2026-01-19',
      payment_status: 'OVERDUE' as const,
      notes: 'High-speed pinion assemblies; overdue past 45 days. Eligible for MSME Samadhaan',
      created_at: '2025-12-05T09:30:00Z',
    },
    {
      id: 4,
      invoice_number: 'INV-2026-004',
      business_id: 1,
      buyer_name: 'Force Motors Assembly Division',
      buyer_gstin: '27AAACF1029L1ZW',
      invoice_amount: 310000.0,
      amount_paid: 0.0,
      outstanding_amount: 310000.0,
      invoice_date: '2026-02-20',
      due_date: '2026-04-06',
      payment_status: 'PENDING' as const,
      notes: 'Transmission casing components under 45-day credit period',
      created_at: '2026-02-20T14:15:00Z',
    },
    {
      id: 5,
      invoice_number: 'INV-2026-005',
      business_id: 2,
      buyer_name: 'FabIndia Overseas Logistics',
      buyer_gstin: '07AAACF4928B1ZR',
      invoice_amount: 280000.0,
      amount_paid: 280000.0,
      outstanding_amount: 0.0,
      invoice_date: '2026-01-05',
      due_date: '2026-02-19',
      payment_status: 'PAID' as const,
      notes: 'Handcrafted zari silk rolls delivered to Mumbai central warehouse',
      created_at: '2026-01-05T12:00:00Z',
    },
    {
      id: 6,
      invoice_number: 'INV-2026-006',
      business_id: 2,
      buyer_name: 'Reliance Retail Trends Division',
      buyer_gstin: '24AAACR7192C1ZQ',
      invoice_amount: 540000.0,
      amount_paid: 150000.0,
      outstanding_amount: 390000.0,
      invoice_date: '2025-11-20',
      due_date: '2026-01-04',
      payment_status: 'OVERDUE' as const,
      notes: 'Festive jacquard fabric consignment; overdue by over 60 days',
      created_at: '2025-11-20T10:45:00Z',
    },
    {
      id: 7,
      invoice_number: 'INV-2026-007',
      business_id: 2,
      buyer_name: 'Manyavar Apparel Wholesale Hub',
      buyer_gstin: '19AABCV2019H1ZP',
      invoice_amount: 195000.0,
      amount_paid: 0.0,
      outstanding_amount: 195000.0,
      invoice_date: '2026-02-15',
      due_date: '2026-03-31',
      payment_status: 'PENDING' as const,
      notes: 'Brocade borders; pending acceptance inspection',
      created_at: '2026-02-15T15:20:00Z',
    },
    {
      id: 8,
      invoice_number: 'INV-2026-008',
      business_id: 3,
      buyer_name: 'Ather Energy Smart Systems',
      buyer_gstin: '29AABCA9182D1ZO',
      invoice_amount: 420000.0,
      amount_paid: 420000.0,
      outstanding_amount: 0.0,
      invoice_date: '2026-01-12',
      due_date: '2026-02-26',
      payment_status: 'PAID' as const,
      notes: 'Battery management sensor interface boards',
      created_at: '2026-01-12T16:00:00Z',
    },
    {
      id: 9,
      invoice_number: 'INV-2026-009',
      business_id: 3,
      buyer_name: 'Ola Electric Mobility Factory',
      buyer_gstin: '29AAFCO3918E1ZN',
      invoice_amount: 890000.0,
      amount_paid: 200000.0,
      outstanding_amount: 690000.0,
      invoice_date: '2025-12-10',
      due_date: '2026-01-24',
      payment_status: 'OVERDUE' as const,
      notes: 'Custom BMS controller micro-modules; delayed beyond contractual 45 days',
      created_at: '2025-12-10T11:15:00Z',
    },
    {
      id: 10,
      invoice_number: 'INV-2026-010',
      business_id: 3,
      buyer_name: 'Schneider Electric India Pvt Ltd',
      buyer_gstin: '29AAACS2910G1ZM',
      invoice_amount: 345000.0,
      amount_paid: 0.0,
      outstanding_amount: 345000.0,
      invoice_date: '2026-02-28',
      due_date: '2026-04-14',
      payment_status: 'PENDING' as const,
      notes: 'Precision thermal sensors lot #12',
      created_at: '2026-02-28T13:40:00Z',
    },
    {
      id: 11,
      invoice_number: 'INV-2026-011',
      business_id: 4,
      buyer_name: 'Hero Cycles Component Hub',
      buyer_gstin: '03AAACH3891J1ZL',
      invoice_amount: 380000.0,
      amount_paid: 380000.0,
      outstanding_amount: 0.0,
      invoice_date: '2026-01-08',
      due_date: '2026-02-22',
      payment_status: 'PAID' as const,
      notes: 'Grade 8.8 tensile frame bolts and hex nuts',
      created_at: '2026-01-08T09:50:00Z',
    },
    {
      id: 12,
      invoice_number: 'INV-2026-012',
      business_id: 4,
      buyer_name: 'Sonalika Tractors Procurement',
      buyer_gstin: '03AABCI4819K1ZK',
      invoice_amount: 650000.0,
      amount_paid: 0.0,
      outstanding_amount: 650000.0,
      invoice_date: '2025-11-15',
      due_date: '2025-12-30',
      payment_status: 'OVERDUE' as const,
      notes: 'Heavy duty forging fasteners; overdue 70+ days; follow-up sent',
      created_at: '2025-11-15T14:30:00Z',
    },
    {
      id: 13,
      invoice_number: 'INV-2026-013',
      business_id: 4,
      buyer_name: 'Action Construction Equipment Ltd',
      buyer_gstin: '06AAACA9018L1ZJ',
      invoice_amount: 275000.0,
      amount_paid: 100000.0,
      outstanding_amount: 175000.0,
      invoice_date: '2026-02-01',
      due_date: '2026-03-17',
      payment_status: 'PARTIAL' as const,
      notes: 'Crane foundation anchors; partial release received',
      created_at: '2026-02-01T10:10:00Z',
    },
    {
      id: 14,
      invoice_number: 'INV-2026-014',
      business_id: 5,
      buyer_name: 'Kirloskar Brothers Distributor Net',
      buyer_gstin: '33AAACK4019N1ZH',
      invoice_amount: 920000.0,
      amount_paid: 920000.0,
      outstanding_amount: 0.0,
      invoice_date: '2026-01-15',
      due_date: '2026-03-01',
      payment_status: 'PAID' as const,
      notes: 'Submersible 5HP solar pump sets batch #88',
      created_at: '2026-01-15T15:00:00Z',
    },
    {
      id: 15,
      invoice_number: 'INV-2026-015',
      business_id: 5,
      buyer_name: 'Shakti Pumps Northern Logistics',
      buyer_gstin: '23AAACS9182P1ZG',
      invoice_amount: 1150000.0,
      amount_paid: 350000.0,
      outstanding_amount: 800000.0,
      invoice_date: '2025-12-01',
      due_date: '2026-01-15',
      payment_status: 'OVERDUE' as const,
      notes: 'Monobloc agricultural pump impellers; overdue by 50+ days',
      created_at: '2025-12-01T11:45:00Z',
    },
    {
      id: 16,
      invoice_number: 'INV-2026-016',
      business_id: 5,
      buyer_name: 'Jain Irrigation Systems Dealership',
      buyer_gstin: '27AAACJ8192R1ZF',
      invoice_amount: 460000.0,
      amount_paid: 0.0,
      outstanding_amount: 460000.0,
      invoice_date: '2026-02-25',
      due_date: '2026-04-11',
      payment_status: 'PENDING' as const,
      notes: 'Drip automation solenoid valve cast bodies',
      created_at: '2026-02-25T16:30:00Z',
    },
  ] as InvoiceRecord[],

  payments: [
    {
      id: 1,
      invoice_id: 1,
      payment_date: '2026-02-20',
      amount: 485000.0,
      payment_mode: 'NEFT/RTGS' as const,
      reference_number: 'HDFC260220198214',
      notes: 'Full settlement received against INV-2026-001',
      created_at: '2026-02-20T10:00:00Z',
    },
    {
      id: 2,
      invoice_id: 2,
      payment_date: '2026-02-15',
      amount: 300000.0,
      payment_mode: 'Bank Transfer' as const,
      reference_number: 'SBIN002615481920',
      notes: 'Tranche 1 payment against Mahindra purchase order',
      created_at: '2026-02-15T11:20:00Z',
    },
    {
      id: 3,
      invoice_id: 5,
      payment_date: '2026-02-18',
      amount: 280000.0,
      payment_mode: 'NEFT/RTGS' as const,
      reference_number: 'ICIC260218819203',
      notes: 'Full clearance for silk roll delivery',
      created_at: '2026-02-18T14:30:00Z',
    },
    {
      id: 4,
      invoice_id: 6,
      payment_date: '2025-12-28',
      amount: 150000.0,
      payment_mode: 'Cheque' as const,
      reference_number: 'CHQ-889102-KOTAK',
      notes: 'Advance partial release before balance dispute',
      created_at: '2025-12-28T09:15:00Z',
    },
    {
      id: 5,
      invoice_id: 8,
      payment_date: '2026-02-25',
      amount: 420000.0,
      payment_mode: 'NEFT/RTGS' as const,
      reference_number: 'AXIS260225109284',
      notes: 'Final clearance Ather Energy lot #1',
      created_at: '2026-02-25T17:00:00Z',
    },
    {
      id: 6,
      invoice_id: 9,
      payment_date: '2026-01-10',
      amount: 200000.0,
      payment_mode: 'UPI' as const,
      reference_number: 'UPI/260110829104/ICICI',
      notes: 'Interim milestone payment for BMS controllers',
      created_at: '2026-01-10T11:40:00Z',
    },
    {
      id: 7,
      invoice_id: 11,
      payment_date: '2026-02-20',
      amount: 380000.0,
      payment_mode: 'NEFT/RTGS' as const,
      reference_number: 'PUNB260220918231',
      notes: 'Full payment credited for frame bolts',
      created_at: '2026-02-20T13:25:00Z',
    },
    {
      id: 8,
      invoice_id: 13,
      payment_date: '2026-02-22',
      amount: 100000.0,
      payment_mode: 'Bank Transfer' as const,
      reference_number: 'UTIB260222184910',
      notes: 'First installment for crane anchors',
      created_at: '2026-02-22T15:10:00Z',
    },
    {
      id: 9,
      invoice_id: 14,
      payment_date: '2026-02-28',
      amount: 500000.0,
      payment_mode: 'NEFT/RTGS' as const,
      reference_number: 'IOBA260228391820',
      notes: 'Part clearance 1 for Kirloskar batch',
      created_at: '2026-02-28T12:00:00Z',
    },
    {
      id: 10,
      invoice_id: 14,
      payment_date: '2026-03-01',
      amount: 420000.0,
      payment_mode: 'NEFT/RTGS' as const,
      reference_number: 'IOBA260301982341',
      notes: 'Final balance clearance for Kirloskar batch',
      created_at: '2026-03-01T16:45:00Z',
    },
    {
      id: 11,
      invoice_id: 15,
      payment_date: '2025-12-20',
      amount: 350000.0,
      payment_mode: 'Bank Transfer' as const,
      reference_number: 'BARB251220918410',
      notes: 'Initial milestone payment on pump supply',
      created_at: '2025-12-20T10:30:00Z',
    },
  ] as PaymentRecord[],

  inventory: [
    {
      id: 1,
      business_id: 1,
      product_name: 'EN-24 Alloy Steel Round Bars (50mm)',
      product_category: 'Raw Material',
      available_quantity: 8,
      min_stock_level: 25,
      unit_price: 4200.0,
      unit_of_measure: 'Meters',
      supplier_name: 'Kalyani Steels Ltd, Pune',
      created_at: '2026-01-05T10:00:00Z',
    },
    {
      id: 2,
      business_id: 1,
      product_name: 'Hardened Spur Pinion Gears (24T)',
      product_category: 'Finished Goods',
      available_quantity: 140,
      min_stock_level: 50,
      unit_price: 1850.0,
      unit_of_measure: 'Units',
      supplier_name: 'In-House Production',
      created_at: '2026-01-10T10:00:00Z',
    },
    {
      id: 3,
      business_id: 1,
      product_name: 'CNC Carbide Cutting Inserts',
      product_category: 'Spare Parts',
      available_quantity: 12,
      min_stock_level: 30,
      unit_price: 850.0,
      unit_of_measure: 'Units',
      supplier_name: 'Sandvik Coromant India',
      created_at: '2026-01-12T10:00:00Z',
    },
    {
      id: 4,
      business_id: 2,
      product_name: 'Raw Mulberry Silk Yarn (Denier 20/22)',
      product_category: 'Raw Material',
      available_quantity: 15,
      min_stock_level: 50,
      unit_price: 3400.0,
      unit_of_measure: 'Kg',
      supplier_name: 'Karnataka Silk Marketing Board',
      created_at: '2026-01-15T10:00:00Z',
    },
    {
      id: 5,
      business_id: 2,
      product_name: 'Jacquard Zari Brocade Fabric (Navy/Gold)',
      product_category: 'Finished Goods',
      available_quantity: 320,
      min_stock_level: 100,
      unit_price: 780.0,
      unit_of_measure: 'Meters',
      supplier_name: 'In-House Weaving',
      created_at: '2026-01-18T10:00:00Z',
    },
    {
      id: 6,
      business_id: 2,
      product_name: 'Eco-Friendly Reactive Dye Pigments',
      product_category: 'Raw Material',
      available_quantity: 6,
      min_stock_level: 20,
      unit_price: 1200.0,
      unit_of_measure: 'Kg',
      supplier_name: 'Atul Ltd, Valsad',
      created_at: '2026-01-20T10:00:00Z',
    },
    {
      id: 7,
      business_id: 3,
      product_name: 'STM32 Microcontroller IC Chips',
      product_category: 'Raw Material',
      available_quantity: 45,
      min_stock_level: 150,
      unit_price: 480.0,
      unit_of_measure: 'Units',
      supplier_name: 'Mouser Electronics India',
      created_at: '2026-01-22T10:00:00Z',
    },
    {
      id: 8,
      business_id: 3,
      product_name: 'Dual-Channel BMS Controller Modules',
      product_category: 'Finished Goods',
      available_quantity: 85,
      min_stock_level: 40,
      unit_price: 2950.0,
      unit_of_measure: 'Units',
      supplier_name: 'In-House Assembly',
      created_at: '2026-01-25T10:00:00Z',
    },
    {
      id: 9,
      business_id: 4,
      product_name: 'High Tensile M16x80 Flange Bolts',
      product_category: 'Finished Goods',
      available_quantity: 1200,
      min_stock_level: 500,
      unit_price: 38.0,
      unit_of_measure: 'Units',
      supplier_name: 'In-House Forging',
      created_at: '2026-02-01T10:00:00Z',
    },
    {
      id: 10,
      business_id: 4,
      product_name: 'Cold Rolled Steel Wire Rods (12mm)',
      product_category: 'Raw Material',
      available_quantity: 18,
      min_stock_level: 50,
      unit_price: 5800.0,
      unit_of_measure: 'Quintals',
      supplier_name: 'Steel Authority of India Ltd (SAIL)',
      created_at: '2026-02-05T10:00:00Z',
    },
    {
      id: 11,
      business_id: 5,
      product_name: 'Cast Iron Pump Impeller Castings (5HP)',
      product_category: 'Raw Material',
      available_quantity: 14,
      min_stock_level: 40,
      unit_price: 1650.0,
      unit_of_measure: 'Units',
      supplier_name: 'Kovai Foundry Cluster, Coimbatore',
      created_at: '2026-02-10T10:00:00Z',
    },
    {
      id: 12,
      business_id: 5,
      product_name: 'Submersible Solar Agro Pumpsets (5HP)',
      product_category: 'Finished Goods',
      available_quantity: 28,
      min_stock_level: 15,
      unit_price: 34500.0,
      unit_of_measure: 'Units',
      supplier_name: 'In-House Assembly',
      created_at: '2026-02-12T10:00:00Z',
    },
  ] as InventoryRecord[],

  schemes: [
    {
      id: 1,
      name: 'MSME Samadhaan (Delayed Payment Redressal)',
      ministry: 'Ministry of MSME, Govt of India',
      category: 'Delayed Payments',
      purpose: 'Online complaint monitoring system for micro & small enterprises to recover unpaid dues from buyers past 45 days under Section 18 of MSMED Act 2006. Buyers must pay compound interest at 3x RBI bank rate.',
      eligibility_summary: 'Registered Micro and Small enterprises holding valid Udyam Registration, having supply agreements and pending invoices past 45 days.',
      eligible_msme_types: 'Micro, Small',
      max_subsidy_loan: 'Statutory recovery + 3x RBI compound interest',
      required_documents: 'Udyam Certificate, Purchase Order copy, Delivery Challan / Lorry Receipt, Unpaid Invoice copy',
      official_url: 'https://samadhaan.msme.gov.in',
      helpline: '1800-180-6763',
    },
    {
      id: 2,
      name: 'CGTMSE (Credit Guarantee Scheme for MSEs)',
      ministry: 'Ministry of MSME & SIDBI',
      category: 'Credit Guarantee',
      purpose: 'Provides collateral-free credit facilities (both term loans and working capital) up to ₹5 Crore to new and existing micro and small enterprises through scheduled commercial banks and NBFCs.',
      eligibility_summary: 'New or existing Micro and Small Enterprises engaged in manufacturing or service activities.',
      eligible_msme_types: 'Micro, Small',
      max_subsidy_loan: 'Collateral-free loans up to ₹5 Crore (75% to 85% guarantee coverage)',
      required_documents: 'ITR for 2 years, Projected Balance Sheet, Udyam Registration, Project Report, KYC',
      official_url: 'https://www.cgtmse.in',
      helpline: '022-67531100',
    },
    {
      id: 3,
      name: 'PMEGP (Prime Minister Employment Generation)',
      ministry: 'Ministry of MSME & KVIC',
      category: 'Capital Subsidy',
      purpose: 'Credit-linked subsidy scheme for generating self-employment through establishment of micro-enterprises in non-farm sectors.',
      eligibility_summary: 'Any individual above 18 years of age. For project costs above ₹10 Lakh in manufacturing, minimum 8th class pass required.',
      eligible_msme_types: 'Micro',
      max_subsidy_loan: 'Subsidy of 15% to 35% on project cost up to ₹50 Lakh (Manufacturing) / ₹20 Lakh (Service)',
      required_documents: 'Aadhaar, Caste/Category Certificate, Detailed Project Report (DPR), Educational certificate',
      official_url: 'https://www.kviconline.gov.in/pmegpeportal',
      helpline: '1800-3000-0034',
    },
    {
      id: 4,
      name: 'Pradhan Mantri MUDRA Yojana (PMMY)',
      ministry: 'Ministry of Finance, Govt of India',
      category: 'Working Capital Loan',
      purpose: 'Provides collateral-free institutional credit up to ₹10 Lakh to micro and small non-corporate businesses in three tiers: Shishu, Kishore, and Tarun.',
      eligibility_summary: 'Non-corporate small business segment (proprietorship, partnership, small manufacturing units, shopkeepers).',
      eligible_msme_types: 'Micro, Small',
      max_subsidy_loan: 'Up to ₹10 Lakh (No collateral required)',
      required_documents: 'Proof of identity, Proof of residence, Quotation of machinery/items, Business address proof',
      official_url: 'https://www.mudra.org.in',
      helpline: '1800-180-1111',
    },
    {
      id: 5,
      name: 'TReDS (Trade Receivables Discounting System)',
      ministry: 'Reserve Bank of India (RBI)',
      category: 'Invoice Discounting',
      purpose: 'Institutional mechanism set up by RBI to facilitate financing of trade receivables of MSMEs from corporate buyers and government departments through multiple financiers (factoring). Eliminates delayed payment risk.',
      eligibility_summary: 'All MSMEs holding Udyam Registration supplying to corporate buyers, PSUs, or government departments.',
      eligible_msme_types: 'Micro, Small, Medium',
      max_subsidy_loan: 'Up to 100% invoice discounting at competitive auction rates',
      required_documents: 'Udyam Registration, Bank statements, GST Returns, Valid undisputed invoices and buyer acceptance',
      official_url: 'https://www.rbi.org.in',
      helpline: '022-22601000',
    },
    {
      id: 6,
      name: 'MSME Champions (Digital Technology & Upgradation)',
      ministry: 'Ministry of MSME, Govt of India',
      category: 'Digital & Technology',
      purpose: 'Unified portal offering digital tools, grievance redressal, design clinic subsidies, incubation assistance, and intellectual property rights (IPR) support for competitive MSME growth.',
      eligibility_summary: 'Any registered MSME with Udyam Registration seeking operational upgrades or dispute facilitation.',
      eligible_msme_types: 'Micro, Small, Medium',
      max_subsidy_loan: 'Subsidies up to ₹15 Lakh for design & incubation support',
      required_documents: 'Udyam Certificate, Company incorporation details, Project proposal',
      official_url: 'https://champions.gov.in',
      helpline: '011-23063288',
    },
    {
      id: 7,
      name: 'MSME Sustainable (ZED) Certification Scheme',
      ministry: 'Ministry of MSME & Quality Council of India',
      category: 'Quality & Green Technology',
      purpose: 'Incentivizes MSMEs to adopt Zero Defect Zero Effect (ZED) manufacturing practices with subsidies on assessment fees (up to 80% for Micro, 60% for Small, 50% for Medium) and financial rewards on clean tech adoption.',
      eligibility_summary: 'All manufacturing MSMEs with Udyam Registration.',
      eligible_msme_types: 'Micro, Small, Medium',
      max_subsidy_loan: 'Assessment subsidy up to ₹5 Lakh + concession on bank loan interest rates',
      required_documents: 'Udyam Certificate, Factory photos, Self-assessment documents, Pollution control consent',
      official_url: 'https://zed.msme.gov.in',
      helpline: '011-23379321',
    },
    {
      id: 8,
      name: 'RAMP (Raising and Accelerating MSME Performance)',
      ministry: 'Ministry of MSME & World Bank',
      category: 'Capacity Building & Grants',
      purpose: 'World Bank-supported Central Sector Scheme aimed at improving MSMEs’ access to market and credit, strengthening governance, and addressing delayed payments through state strategic investment plans.',
      eligibility_summary: 'MSMEs operating across participating states and sector clusters.',
      eligible_msme_types: 'Micro, Small, Medium',
      max_subsidy_loan: 'Cluster-level grants and subsidized capacity building programs',
      required_documents: 'Udyam Registration, Cluster association membership',
      official_url: 'https://ramp.msme.gov.in',
      helpline: '011-23062215',
    },
  ] as SchemeRecord[],

  supportResources: [
    {
      id: 1,
      name: 'Micro & Small Enterprises Facilitation Council (MSEFC) - Maharashtra',
      entity_type: 'Facilitation Council',
      city_state: 'Mumbai / Pune, Maharashtra',
      address: 'Directorate of Industries, 2nd Floor, New Administrative Building, Madam Cama Road, Mumbai - 400032',
      phone: '+91 22 2202 8616',
      email: 'msefc.mumbai@maharashtra.gov.in',
      website_url: 'https://di.maharashtra.gov.in',
      services_offered: 'Arbitration & conciliation for delayed payments under Section 18 of MSMED Act 2006; recovery decree issuance.',
    },
    {
      id: 2,
      name: 'MSME Development & Facilitation Office (MSME-DFO) - Pune',
      entity_type: 'MSME-DFO',
      city_state: 'Pune, Maharashtra',
      address: 'Kurla-Andheri Road / Branch Office: Shankarshet Road, Swargate, Pune - 411037',
      phone: '+91 20 2444 0472',
      email: 'dfo-pune@dcmsme.gov.in',
      website_url: 'https://dcmsme.gov.in',
      services_offered: 'Technical consultancy, energy audits, Udyam registration assistance, Lean manufacturing scheme counseling.',
    },
    {
      id: 3,
      name: 'District Industries Centre (DIC) - Surat',
      entity_type: 'District Industries Centre (DIC)',
      city_state: 'Surat, Gujarat',
      address: 'Multi-Storeyed Building, Nanpura, Surat - 395001',
      phone: '+91 261 246 5122',
      email: 'dic-surat@gujarat.gov.in',
      website_url: 'https://ic.gujarat.gov.in',
      services_offered: 'Subsidies under Gujarat Industrial Policy, raw material facilitation, power tariff subsidy, MSME award nominations.',
    },
    {
      id: 4,
      name: 'MSME-DFO Bengaluru (Karnataka Region)',
      entity_type: 'MSME-DFO',
      city_state: 'Bengaluru, Karnataka',
      address: 'Industrial Estate, Rajajinagar, Bengaluru - 560058',
      phone: '+91 80 2310 7040',
      email: 'dfo-bangalore@dcmsme.gov.in',
      website_url: 'https://msmedibangalore.gov.in',
      services_offered: 'Testing laboratories for electronics/mechanical MSMEs, export facilitation cell, vendor development meets with Defence/PSUs.',
    },
    {
      id: 5,
      name: 'MSEFC Punjab & District Facilitation Centre',
      entity_type: 'Facilitation Council',
      city_state: 'Ludhiana / Chandigarh, Punjab',
      address: 'Department of Industries and Commerce, Sector 17, Chandigarh / DIC Focal Point Ludhiana',
      phone: '+91 161 267 4910',
      email: 'msefc.punjab@punjab.gov.in',
      website_url: 'https://pbindustries.gov.in',
      services_offered: 'Expedited hearings for delayed payments against large automotive and cycle OEMs; legal recovery proceedings.',
    },
    {
      id: 6,
      name: 'MSME Technology Centre & Tool Room (MSME-TC) - Coimbatore',
      entity_type: 'Testing Centre',
      city_state: 'Coimbatore, Tamil Nadu',
      address: 'SIDCO Industrial Complex, Kurichi, Coimbatore - 641021',
      phone: '+91 422 267 2201',
      email: 'contact@coimbatoretoolroom.in',
      website_url: 'https://www.dcmsme.gov.in',
      services_offered: 'High precision CNC tool room, pump performance testing facilities, 3D coordinate measuring machine (CMM) calibration.',
    },
  ] as SupportResourceRecord[],
};

// Initialize or test the MySQL database connection
export async function initDatabase(): Promise<DbStatus> {
  try {
    if (!pool) {
      pool = mysql.createPool(dbConfig);
    }
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();

    activeDbStatus = {
      connected: true,
      type: 'mysql',
      host: dbConfig.host,
      database: dbConfig.database,
      message: `Successfully connected to MySQL server at ${dbConfig.host}:${dbConfig.port} (Database: ${dbConfig.database})`,
    };
    console.log('[MySQL] Active database connection established.');
    return activeDbStatus;
  } catch (error: any) {
    activeDbStatus = {
      connected: false,
      type: 'mock_sql_fallback',
      host: dbConfig.host,
      database: dbConfig.database,
      message: `Local MySQL server at ${dbConfig.host}:${dbConfig.port} is not running or credentials not set. Switched to In-Memory Relational Engine for seamless demo execution. (${error.message || 'Connection refused'})`,
    };
    console.warn('[MySQL Fallback]', activeDbStatus.message);
    return activeDbStatus;
  }
}

export function getDbStatus(): DbStatus {
  return activeDbStatus;
}

export function getPool(): mysql.Pool | null {
  return pool;
}

/**
 * Execute a parameterized query with automatic fallback to memoryStore if MySQL is unavailable
 */
export async function executeQuery<T = any>(
  sql: string,
  params: any[] = []
): Promise<T[]> {
  if (activeDbStatus.type === 'mysql' && pool) {
    try {
      const [rows] = await pool.execute(sql, params);
      return rows as T[];
    } catch (err) {
      console.error('[MySQL Query Error]', err);
      throw err;
    }
  }

  // Fallback simulator for when running without a running MySQL daemon
  return simulateQuery<T>(sql, params);
}

// In-Memory Query Evaluator for offline / web preview mode
function simulateQuery<T = any>(sql: string, params: any[] = []): T[] {
  const cleanSql = sql.trim().toUpperCase();

  if (cleanSql.startsWith('SELECT') && cleanSql.includes('FROM BUSINESSES')) {
    return memoryStore.businesses as unknown as T[];
  }
  if (cleanSql.startsWith('SELECT') && cleanSql.includes('FROM INVOICES')) {
    return memoryStore.invoices as unknown as T[];
  }
  if (cleanSql.startsWith('SELECT') && cleanSql.includes('FROM INVENTORY')) {
    return memoryStore.inventory as unknown as T[];
  }
  if (cleanSql.startsWith('SELECT') && cleanSql.includes('FROM SCHEMES')) {
    return memoryStore.schemes as unknown as T[];
  }
  if (cleanSql.startsWith('SELECT') && cleanSql.includes('FROM SUPPORT_RESOURCES')) {
    return memoryStore.supportResources as unknown as T[];
  }
  if (cleanSql.startsWith('SELECT') && cleanSql.includes('FROM PAYMENTS')) {
    return memoryStore.payments as unknown as T[];
  }

  return [] as T[];
}
