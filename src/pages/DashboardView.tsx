/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Building2,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Package,
  Clock,
  ArrowUpRight,
  TrendingUp,
  ShieldAlert,
  Send,
  ExternalLink,
} from 'lucide-react';
import { DashboardStats, Invoice } from '../types';
import { MetricCard } from '../components/MetricCard';
import { formatINR, formatCompactINR, formatDate, getStatusBadgeProps } from '../utils/formatters';

interface Props {
  stats: DashboardStats | null;
  overdueInvoices: Invoice[];
  onNavigateTab: (tab: any) => void;
  onSelectInvoiceForFollowUp: (inv: Invoice) => void;
}

export const DashboardView: React.FC<Props> = ({
  stats,
  overdueInvoices,
  onNavigateTab,
  onSelectInvoiceForFollowUp,
}) => {
  if (!stats) {
    return (
      <div className="p-8 text-center text-slate-500">
        <div className="animate-spin w-8 h-8 border-2 border-[#0D9488] border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-sm">Loading MSME Sahayak Dashboard Metrics...</p>
      </div>
    );
  }

  const recoveryPct = stats.recovery_progress_percentage;
  const statusTotal =
    stats.status_distribution.PAID +
    stats.status_distribution.PARTIAL +
    stats.status_distribution.PENDING +
    stats.status_distribution.OVERDUE || 1;

  return (
    <div className="space-y-6">
      {/* Statutory Banner: Section 15 & 16 of MSMED Act */}
      {stats.overdue_invoices_count > 0 && (
        <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[#DC2626]/10 text-[#DC2626] shrink-0 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#991B1B] font-heading">
                Action Required: {stats.overdue_invoices_count} Delayed Invoices Exceeding Terms
              </h2>
              <p className="text-xs text-[#7F1D1D] mt-0.5 leading-relaxed">
                Total working capital of <strong className="font-semibold">{formatINR(stats.total_overdue)}</strong> is currently locked. Under Section 16 of the MSMED Act 2006, buyers must settle dues within 45 days or pay penal compound interest at 3x the RBI bank rate.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('followup')}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#DC2626] hover:bg-[#B91C1C] rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            Launch Follow-Up
          </button>
        </div>
      )}

      {/* Primary KPI Grid (8 Columns / Modular Metric Tiles) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Registered MSMEs"
          value={String(stats.businesses_count)}
          subValue="Active suppliers & producers"
          icon={Building2}
          badge="UDYAM"
          badgeType="info"
          onClick={() => onNavigateTab('businesses')}
        />

        <MetricCard
          label="Total Invoices Billed"
          value={formatCompactINR(stats.total_billed)}
          subValue={`${stats.total_invoices} total invoices raised`}
          icon={FileText}
          onClick={() => onNavigateTab('invoices')}
        />

        <MetricCard
          label="Capital Blocked (Overdue)"
          value={formatCompactINR(stats.working_capital_blocked)}
          subValue={`${stats.overdue_invoices_count} invoices overdue`}
          icon={AlertTriangle}
          badge={`${stats.overdue_invoices_count} Alerts`}
          badgeType="danger"
          accentBorder={true}
          onClick={() => onNavigateTab('invoices')}
        />

        <MetricCard
          label="Payments Recovered"
          value={formatCompactINR(stats.total_paid)}
          subValue={`${recoveryPct}% of total billing recovered`}
          icon={CheckCircle2}
          badge={`${recoveryPct}% Cleared`}
          badgeType="success"
          onClick={() => onNavigateTab('invoices')}
        />
      </div>

      {/* Secondary Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Pending In-Terms</div>
            <div className="text-xl font-bold font-heading text-[#0F2942] mt-1 font-tabular">
              {formatINR(stats.total_outstanding - stats.total_overdue)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Within permissible credit window</div>
          </div>
          <div className="p-2.5 bg-amber-50 rounded-lg text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Inventory Asset Value</div>
            <div className="text-xl font-bold font-heading text-[#0F2942] mt-1 font-tabular">
              {formatINR(stats.total_inventory_valuation)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">{stats.total_inventory_items} stock items tracked</div>
          </div>
          <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase">Low-Stock Warnings</div>
            <div className="text-xl font-bold font-heading text-[#0F2942] mt-1 font-tabular">
              {stats.low_stock_count} Items
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Below buffer safety threshold</div>
          </div>
          <div className={`p-2.5 rounded-lg ${stats.low_stock_count > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-500'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Analytical Charts & Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Monthly Cashflow & Invoicing Trends (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-lg p-5 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold font-heading text-[#0F2942]">
                Monthly Billing & Recovery Trajectory
              </h3>
              <p className="text-xs text-slate-500">
                Tracking cash inflows versus delayed capital accumulations
              </p>
            </div>
            <span className="text-xs font-mono font-medium text-slate-500">FY 2025-26</span>
          </div>

          {/* Bar Chart Visualization */}
          <div className="space-y-4 pt-2">
            {stats.monthly_trends.map((item, idx) => {
              const maxVal = 3000000;
              const billedWidth = Math.min(100, Math.round((item.billed / maxVal) * 100));
              const recoveredWidth = Math.min(100, Math.round((item.recovered / maxVal) * 100));
              const overdueWidth = Math.min(100, Math.round((item.overdue / maxVal) * 100));

              return (
                <div key={idx} className="space-y-1.5 text-xs">
                  <div className="flex justify-between font-medium text-slate-700">
                    <span className="font-semibold">{item.month}</span>
                    <span className="text-slate-500 font-mono">
                      Billed: {formatCompactINR(item.billed)} · Recovered: {formatCompactINR(item.recovered)}
                    </span>
                  </div>

                  {/* Dual Bar Representation */}
                  <div className="h-4 w-full bg-slate-100 rounded-sm overflow-hidden flex">
                    <div
                      style={{ width: `${recoveredWidth}%` }}
                      className="bg-[#059669] h-full"
                      title={`Recovered: ${formatINR(item.recovered)}`}
                    />
                    <div
                      style={{ width: `${overdueWidth}%` }}
                      className="bg-[#DC2626] h-full"
                      title={`Delayed / Overdue: ${formatINR(item.overdue)}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-5 text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-[#059669] rounded-xs" />
              <span>Payments Recovered</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-[#DC2626] rounded-xs" />
              <span>Overdue Blocked</span>
            </div>
          </div>
        </div>

        {/* Chart 2: Invoice Status Proportion & Working Capital Health (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-lg p-5 border border-slate-200 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold font-heading text-[#0F2942]">
              Invoice Status Breakdown
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Receivables lifecycle across {stats.total_invoices} records
            </p>

            {/* Segmented Distribution Bar */}
            <div className="h-5 w-full rounded-md overflow-hidden flex bg-slate-100 shadow-inner">
              <div
                style={{ width: `${(stats.status_distribution.PAID / statusTotal) * 100}%` }}
                className="bg-[#059669]"
                title="Paid"
              />
              <div
                style={{ width: `${(stats.status_distribution.PARTIAL / statusTotal) * 100}%` }}
                className="bg-[#2563EB]"
                title="Partial"
              />
              <div
                style={{ width: `${(stats.status_distribution.PENDING / statusTotal) * 100}%` }}
                className="bg-[#D97706]"
                title="Pending"
              />
              <div
                style={{ width: `${(stats.status_distribution.OVERDUE / statusTotal) * 100}%` }}
                className="bg-[#DC2626]"
                title="Overdue"
              />
            </div>

            {/* Legend with Counts and Values */}
            <div className="mt-4 space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-[#ECFDF5] text-[#065F46]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#059669]" />
                  <span className="font-semibold">Fully Settled</span>
                </div>
                <span className="font-mono font-bold">{stats.status_distribution.PAID} invoices</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-[#EFF6FF] text-[#1E40AF]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                  <span className="font-semibold">Partially Cleared</span>
                </div>
                <span className="font-mono font-bold">{stats.status_distribution.PARTIAL} invoices</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-[#FFFBEB] text-[#92400E]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" />
                  <span className="font-semibold">Within Terms</span>
                </div>
                <span className="font-mono font-bold">{stats.status_distribution.PENDING} invoices</span>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-[#FEF2F2] text-[#991B1B]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626]" />
                  <span className="font-semibold">Overdue (Delayed)</span>
                </div>
                <span className="font-mono font-bold">{stats.status_distribution.OVERDUE} invoices</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="text-[11px] text-slate-500 flex items-center justify-between">
              <span>Overall Capital Recovery Rate</span>
              <span className="font-bold text-[#0D9488] font-mono">{recoveryPct}%</span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full mt-1 overflow-hidden">
              <div
                className="bg-[#0D9488] h-full rounded-full transition-all duration-500"
                style={{ width: `${recoveryPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Overdue Debtors & Priority Action Rail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top Corporate Delayed Payers (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-lg p-5 border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold font-heading text-[#0F2942]">
                Delayed Payments by Buyer
              </h3>
              <p className="text-xs text-slate-500">Corporate and wholesale buyers with overdue balances</p>
            </div>
            <button
              onClick={() => onNavigateTab('invoices')}
              className="text-xs text-[#0D9488] hover:text-[#006F66] font-semibold flex items-center gap-1"
            >
              View All Invoices <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {stats.top_debtors.map((debtor, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-800">{debtor.buyer_name}</div>
                  <div className="text-[11px] text-slate-500">
                    {debtor.count} overdue {debtor.count === 1 ? 'bill' : 'bills'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-[#DC2626]">
                    {formatINR(debtor.overdue_amount)}
                  </div>
                  <div className="text-[10px] text-red-600 uppercase font-medium">Overdue</div>
                </div>
              </div>
            ))}
            {stats.top_debtors.length === 0 && (
              <p className="text-xs text-slate-500 py-4 text-center">No overdue buyers recorded.</p>
            )}
          </div>
        </div>

        {/* Immediate Priority Overdue Invoices (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-lg p-5 border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold font-heading text-[#0F2942]">
                  Follow-Up Queue
                </h3>
                <p className="text-xs text-slate-500">Immediate action needed for delayed bills</p>
              </div>
              <span className="text-[11px] font-mono text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                {overdueInvoices.length} Waiting
              </span>
            </div>

            <div className="space-y-2.5">
              {overdueInvoices.slice(0, 3).map((inv) => (
                <div
                  key={inv.id}
                  className="p-3 rounded-lg border border-red-100 bg-red-50/40 flex items-center justify-between text-xs hover:border-red-300 transition-colors"
                >
                  <div>
                    <div className="font-semibold text-[#0F2942]">{inv.invoice_number}</div>
                    <div className="text-slate-600 text-[11px] truncate max-w-[170px]">
                      {inv.buyer_name}
                    </div>
                    <div className="text-[10px] text-red-700 font-medium mt-0.5">
                      Due: {formatDate(inv.due_date)} · {inv.days_overdue}d overdue
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-[#991B1B]">
                      {formatINR(inv.outstanding_amount)}
                    </div>
                    <button
                      onClick={() => onSelectInvoiceForFollowUp(inv)}
                      className="mt-1 px-2.5 py-1 text-[11px] font-medium text-white bg-[#0F2942] hover:bg-[#1E3A8A] rounded transition-colors flex items-center gap-1 ml-auto"
                    >
                      <Send className="w-3 h-3" />
                      Remind
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              onClick={() => onNavigateTab('schemes')}
              className="w-full py-2 px-3 text-xs font-semibold text-[#0D9488] bg-[#0D9488]/10 hover:bg-[#0D9488]/20 rounded-lg text-center transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Explore Government Relief Schemes (MSME Samadhaan, CGTMSE)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
