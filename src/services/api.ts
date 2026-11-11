/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Business,
  Invoice,
  InventoryItem,
  Scheme,
  SupportResource,
  DashboardStats,
  DbStatusInfo,
} from '../types';

const API_BASE = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.error || json.message || `Request failed with status ${res.status}`);
  }
  return json;
}

export const api = {
  // Health & Database
  async getHealth(): Promise<{ status: string; database: DbStatusInfo }> {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  async reconnectDb(): Promise<{ success: boolean; database: DbStatusInfo }> {
    return fetchJson(`${API_BASE}/db/reconnect`, { method: 'POST' });
  },

  // Dashboard
  async getDashboardStats(): Promise<{ success: boolean; data: DashboardStats; database_status: DbStatusInfo }> {
    return fetchJson(`${API_BASE}/dashboard/stats`);
  },

  // Businesses
  async getBusinesses(): Promise<{ success: boolean; data: Business[] }> {
    return fetchJson(`${API_BASE}/businesses`);
  },

  async createBusiness(data: Partial<Business>): Promise<{ success: boolean; message: string; data: Business }> {
    return fetchJson(`${API_BASE}/businesses`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateBusiness(id: number, data: Partial<Business>): Promise<{ success: boolean; message: string }> {
    return fetchJson(`${API_BASE}/businesses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteBusiness(id: number): Promise<{ success: boolean; message: string }> {
    return fetchJson(`${API_BASE}/businesses/${id}`, {
      method: 'DELETE',
    });
  },

  // Invoices
  async getInvoices(params?: { status?: string; businessId?: number; search?: string }): Promise<{ success: boolean; data: Invoice[] }> {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.businessId) query.set('businessId', String(params.businessId));
    if (params?.search) query.set('search', params.search);
    return fetchJson(`${API_BASE}/invoices?${query.toString()}`);
  },

  async getOverdueInvoices(): Promise<{
    success: boolean;
    data: Invoice[];
    summary: { total_overdue_count: number; total_overdue_amount: number; past_45_days_statutory_count: number };
  }> {
    return fetchJson(`${API_BASE}/invoices/overdue`);
  },

  async getInvoiceById(id: number): Promise<{ success: boolean; data: Invoice }> {
    return fetchJson(`${API_BASE}/invoices/${id}`);
  },

  async createInvoice(data: {
    invoice_number: string;
    business_id: number;
    buyer_name: string;
    buyer_gstin?: string;
    invoice_amount: number;
    invoice_date: string;
    due_date: string;
    notes?: string;
  }): Promise<{ success: boolean; message: string; data: Invoice }> {
    return fetchJson(`${API_BASE}/invoices`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async recordPayment(invoiceId: number, data: {
    amount: number;
    payment_date: string;
    payment_mode: string;
    reference_number?: string;
    notes?: string;
  }): Promise<{ success: boolean; message: string; data: any }> {
    return fetchJson(`${API_BASE}/invoices/${invoiceId}/payments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteInvoice(id: number): Promise<{ success: boolean; message: string }> {
    return fetchJson(`${API_BASE}/invoices/${id}`, { method: 'DELETE' });
  },

  async getFollowUpReminder(invoiceId: number, tone: 'gentle' | 'formal' | 'statutory'): Promise<{
    success: boolean;
    data: {
      invoice_number: string;
      buyer_name: string;
      outstanding_amount: number;
      due_date: string;
      days_overdue: number;
      tone: string;
      subject: string;
      message: string;
    };
  }> {
    return fetchJson(`${API_BASE}/invoices/${invoiceId}/reminder?tone=${tone}`);
  },

  // Inventory
  async getInventory(params?: { businessId?: number; lowStockOnly?: boolean; search?: string }): Promise<{
    success: boolean;
    data: InventoryItem[];
    summary: { total_items: number; total_valuation: number; low_stock_count: number };
  }> {
    const query = new URLSearchParams();
    if (params?.businessId) query.set('businessId', String(params.businessId));
    if (params?.lowStockOnly) query.set('lowStockOnly', 'true');
    if (params?.search) query.set('search', params.search);
    return fetchJson(`${API_BASE}/inventory?${query.toString()}`);
  },

  async createInventoryItem(data: Partial<InventoryItem>): Promise<{ success: boolean; message: string; data: InventoryItem }> {
    return fetchJson(`${API_BASE}/inventory`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateInventoryItem(id: number, data: Partial<InventoryItem>): Promise<{ success: boolean; message: string }> {
    return fetchJson(`${API_BASE}/inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteInventoryItem(id: number): Promise<{ success: boolean; message: string }> {
    return fetchJson(`${API_BASE}/inventory/${id}`, { method: 'DELETE' });
  },

  // Schemes & Support
  async getSchemes(params?: { msmeType?: string; category?: string; search?: string }): Promise<{ success: boolean; data: Scheme[] }> {
    const query = new URLSearchParams();
    if (params?.msmeType) query.set('msmeType', params.msmeType);
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    return fetchJson(`${API_BASE}/schemes?${query.toString()}`);
  },

  async getSupportResources(params?: { entityType?: string; search?: string }): Promise<{ success: boolean; data: SupportResource[] }> {
    const query = new URLSearchParams();
    if (params?.entityType) query.set('entityType', params.entityType);
    if (params?.search) query.set('search', params.search);
    return fetchJson(`${API_BASE}/support-resources?${query.toString()}`);
  },

  // DBMS Practice Lab
  async getDbmsQueries(): Promise<{ success: boolean; data: any[] }> {
    return fetchJson(`${API_BASE}/dbms/queries`);
  },

  async runDbmsQuery(conceptId: string): Promise<{ success: boolean; execution_mode: string; concept: any; rows: any[] }> {
    return fetchJson(`${API_BASE}/dbms/run`, {
      method: 'POST',
      body: JSON.stringify({ conceptId }),
    });
  },
};
