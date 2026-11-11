/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Business {
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
  total_invoices?: number;
  total_billed?: number;
  total_paid?: number;
  total_outstanding?: number;
  total_overdue?: number;
}

export type PaymentStatus = 'PAID' | 'PENDING' | 'PARTIAL' | 'OVERDUE';

export interface Invoice {
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
  payment_status: PaymentStatus;
  notes?: string | null;
  created_at: string;
  days_overdue?: number;
  is_past_45_days?: boolean;
  business_name?: string;
  owner_name?: string;
  seller_phone?: string;
  seller_email?: string;
  udyam_reg_number?: string | null;
  estimated_penal_interest?: number;
  payments?: Payment[];
}

export interface Payment {
  id: number;
  invoice_id: number;
  payment_date: string;
  amount: number;
  payment_mode: 'NEFT/RTGS' | 'UPI' | 'Cheque' | 'Bank Transfer' | 'Cash';
  reference_number?: string | null;
  notes?: string | null;
  created_at?: string;
}

export interface InventoryItem {
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
  business_name?: string;
  item_valuation: number;
  is_low_stock: boolean;
  units_to_reorder: number;
}

export interface Scheme {
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

export interface SupportResource {
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

export interface DashboardStats {
  businesses_count: number;
  total_invoices: number;
  total_billed: number;
  total_paid: number;
  total_outstanding: number;
  total_overdue: number;
  overdue_invoices_count: number;
  recovery_progress_percentage: number;
  working_capital_blocked: number;
  total_inventory_items: number;
  total_inventory_valuation: number;
  low_stock_count: number;
  status_distribution: {
    PAID: number;
    PENDING: number;
    PARTIAL: number;
    OVERDUE: number;
  };
  monthly_trends: {
    month: string;
    billed: number;
    recovered: number;
    overdue: number;
  }[];
  top_debtors: {
    buyer_name: string;
    overdue_amount: number;
    count: number;
  }[];
}

export interface DbStatusInfo {
  connected: boolean;
  type: 'mysql' | 'mock_sql_fallback';
  host?: string;
  database?: string;
  message: string;
}
