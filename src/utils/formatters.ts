/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Formats a number to Indian Rupee currency with standard Indian numbering system (Lakhs & Crores)
export function formatINR(amount: number | null | undefined, showDecimals = true): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0.00';
  const val = Number(amount);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(val);
}

// Compact Indian format for high-level dashboard summaries (e.g. ₹12.5 L, ₹1.2 Cr)
export function formatCompactINR(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} Lakh`;
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}k`;
  }
  return formatINR(amount, false);
}

// Format ISO date string into readable Indian enterprise date: '10 Jan 2026'
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// Financial Status styling tokens per Bharat Enterprise Trust design specifications
export function getStatusBadgeProps(status: string, daysOverdue = 0) {
  switch (status) {
    case 'PAID':
      return {
        label: 'Paid / Cleared',
        className: 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]',
        dotColor: 'bg-[#059669]',
      };
    case 'PARTIAL':
      return {
        label: 'Partially Paid',
        className: 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]',
        dotColor: 'bg-[#2563EB]',
      };
    case 'PENDING':
      return {
        label: 'Pending (In Terms)',
        className: 'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]',
        dotColor: 'bg-[#D97706]',
      };
    case 'OVERDUE':
      return {
        label: daysOverdue > 45 ? `Overdue (${daysOverdue}d · MSMED 45+ Limit)` : `Overdue (${daysOverdue} Days)`,
        className: 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] font-medium',
        dotColor: 'bg-[#DC2626]',
      };
    default:
      return {
        label: status,
        className: 'bg-slate-100 text-slate-700 border border-slate-200',
        dotColor: 'bg-slate-500',
      };
  }
}
