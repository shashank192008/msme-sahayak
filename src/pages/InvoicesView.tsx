/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Send,
  Trash2,
  DollarSign,
  X,
  CreditCard,
  Building,
} from 'lucide-react';
import { Invoice, Business, PaymentStatus } from '../types';
import { formatINR, formatDate, getStatusBadgeProps } from '../utils/formatters';
import { api } from '../services/api';

interface Props {
  invoices: Invoice[];
  businesses: Business[];
  onRefresh: () => void;
  onSelectForFollowUp: (inv: Invoice) => void;
  isCreateModalOpen: boolean;
  onCloseCreateModal: () => void;
  onOpenCreateModal: () => void;
}

export const InvoicesView: React.FC<Props> = ({
  invoices,
  businesses,
  onRefresh,
  onSelectForFollowUp,
  isCreateModalOpen,
  onCloseCreateModal,
  onOpenCreateModal,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterBusiness, setFilterBusiness] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Payment Recording Modal State
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<string>('NEFT/RTGS');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // New Invoice Form State
  const [newInvNumber, setNewInvNumber] = useState(`INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
  const [newBusinessId, setNewBusinessId] = useState<string>(businesses[0]?.id ? String(businesses[0].id) : '1');
  const [newBuyerName, setNewBuyerName] = useState('');
  const [newBuyerGstin, setNewBuyerGstin] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newInvoiceDate, setNewInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [newDueDate, setNewDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 45); // Standard 45-day MSMED Act cycle
    return d.toISOString().split('T')[0];
  });
  const [newNotes, setNewNotes] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Filter calculations
  const filteredInvoices = invoices.filter(inv => {
    if (filterStatus !== 'ALL' && inv.payment_status !== filterStatus) return false;
    if (filterBusiness !== 'ALL' && inv.business_id !== parseInt(filterBusiness, 10)) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        inv.invoice_number.toLowerCase().includes(term) ||
        inv.buyer_name.toLowerCase().includes(term) ||
        (inv.business_name && inv.business_name.toLowerCase().includes(term))
      );
    }
    return true;
  });

  const totalFilteredOutstanding = filteredInvoices.reduce((sum, i) => sum + i.outstanding_amount, 0);
  const overdueOnlyInvoices = invoices.filter(i => i.payment_status === 'OVERDUE');
  const totalOverdueBlocked = overdueOnlyInvoices.reduce((sum, i) => sum + i.outstanding_amount, 0);

  const handleOpenPaymentModal = (invoice: Invoice, full = false) => {
    setPaymentModalInvoice(invoice);
    setPaymentAmount(full ? String(invoice.outstanding_amount) : '');
    setPaymentRef(`UTR-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`);
    setPaymentError(null);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalInvoice) return;

    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) {
      setPaymentError('Please enter a valid positive payment amount.');
      return;
    }

    if (amt > paymentModalInvoice.outstanding_amount + 0.01) {
      setPaymentError(`Amount cannot exceed the current outstanding balance of ${formatINR(paymentModalInvoice.outstanding_amount)}`);
      return;
    }

    setIsSubmittingPayment(true);
    setPaymentError(null);

    try {
      await api.recordPayment(paymentModalInvoice.id, {
        amount: amt,
        payment_date: new Date().toISOString().split('T')[0],
        payment_mode: paymentMode,
        reference_number: paymentRef || undefined,
        notes: paymentNotes || undefined,
      });

      setPaymentModalInvoice(null);
      setPaymentNotes('');
      onRefresh();
    } catch (err: any) {
      setPaymentError(err.message || 'Failed to record payment');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(newAmount);
    if (!newInvNumber || !newBuyerName || isNaN(amt) || amt <= 0) {
      setCreateError('Please complete all required fields with a valid amount.');
      return;
    }

    if (new Date(newDueDate) < new Date(newInvoiceDate)) {
      setCreateError('Due date cannot be earlier than invoice date.');
      return;
    }

    setIsCreating(true);
    setCreateError(null);

    try {
      await api.createInvoice({
        invoice_number: newInvNumber.trim(),
        business_id: parseInt(newBusinessId, 10),
        buyer_name: newBuyerName.trim(),
        buyer_gstin: newBuyerGstin.trim() || undefined,
        invoice_amount: amt,
        invoice_date: newInvoiceDate,
        due_date: newDueDate,
        notes: newNotes.trim() || undefined,
      });

      onCloseCreateModal();
      // Reset form
      setNewInvNumber(`INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
      setNewBuyerName('');
      setNewBuyerGstin('');
      setNewAmount('');
      setNewNotes('');
      onRefresh();
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create invoice');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteInvoice = async (id: number, invNum: string) => {
    if (confirm(`Are you sure you want to delete invoice '${invNum}'? This action cannot be undone.`)) {
      try {
        await api.deleteInvoice(id);
        onRefresh();
      } catch (err: any) {
        alert(err.message || 'Failed to delete invoice');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Title & Overview Banner */}
      <div className="bg-white rounded-lg p-5 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-[#0D9488]/10 text-[#006F66] font-bold">
              Primary Module
            </span>
            <span className="text-xs text-slate-500">MSMED Act 2006 Compliance</span>
          </div>
          <h2 className="text-xl font-bold font-heading text-[#0F2942] mt-1">
            Invoice & Delayed Payment Management
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Monitor invoices, track partial receipts, identify overdue accounts, and calculate blocked capital.
          </p>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0F2942] hover:bg-[#1E3A8A] rounded-lg shadow-sm transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Invoice</span>
        </button>
      </div>

      {/* Blocked Working Capital Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-lg p-4">
          <div className="text-[11px] font-bold text-[#991B1B] uppercase tracking-wider">
            Total Overdue Blocked
          </div>
          <div className="text-2xl font-bold font-heading text-[#991B1B] mt-1 font-tabular">
            {formatINR(totalOverdueBlocked)}
          </div>
          <div className="text-[11px] text-[#7F1D1D] mt-0.5 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{overdueOnlyInvoices.length} invoices past contractual due date</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Total Outstanding (All Statuses)
          </div>
          <div className="text-2xl font-bold font-heading text-[#0F2942] mt-1 font-tabular">
            {formatINR(invoices.reduce((s, i) => s + i.outstanding_amount, 0))}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Pending reconciliation across all suppliers
          </div>
        </div>

        <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-lg p-4">
          <div className="text-[11px] font-bold text-[#065F46] uppercase tracking-wider">
            Total Recovered Amount
          </div>
          <div className="text-2xl font-bold font-heading text-[#065F46] mt-1 font-tabular">
            {formatINR(invoices.reduce((s, i) => s + i.amount_paid, 0))}
          </div>
          <div className="text-[11px] text-[#047857] mt-0.5 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Successfully cleared via NEFT / UPI</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white rounded-lg p-4 border border-slate-200 space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search invoice number, buyer, or MSME..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0F2942] focus:ring-1 focus:ring-[#0F2942]"
            />
          </div>

          {/* Status Tabs / Segmented Controls */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-lg w-full md:w-auto">
            {['ALL', 'OVERDUE', 'PENDING', 'PARTIAL', 'PAID'].map(st => {
              const count = st === 'ALL'
                ? invoices.length
                : invoices.filter(i => i.payment_status === st).length;
              return (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    filterStatus === st
                      ? 'bg-white text-[#0F2942] shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st === 'ALL' ? 'All Invoices' : st}
                  <span className="ml-1 text-[10px] opacity-75">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Business Selector Filter */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-500">Filter by MSME Supplier:</span>
          <select
            value={filterBusiness}
            onChange={e => setFilterBusiness(e.target.value)}
            className="px-2.5 py-1 text-xs border border-slate-200 rounded bg-white text-slate-700 focus:outline-hidden focus:border-[#0F2942]"
          >
            <option value="ALL">All Registered Enterprises</option>
            {businesses.map(b => (
              <option key={b.id} value={b.id}>
                {b.business_name} ({b.msme_type})
              </option>
            ))}
          </select>
          <span className="text-slate-400 ml-auto">
            Showing {filteredInvoices.length} of {invoices.length} invoices
          </span>
        </div>
      </div>

      {/* Main Invoices Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Invoice No.</th>
                <th className="py-3 px-4">MSME Supplier</th>
                <th className="py-3 px-4">Buyer Name</th>
                <th className="py-3 px-4 text-right">Invoice Amount</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-right">Outstanding</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map(invoice => {
                const badgeProps = getStatusBadgeProps(invoice.payment_status, invoice.days_overdue);
                const isOverdue = invoice.payment_status === 'OVERDUE';
                const isFullyPaid = invoice.payment_status === 'PAID';

                return (
                  <tr
                    key={invoice.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isOverdue ? 'bg-red-50/20' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 font-mono font-semibold text-[#0F2942]">
                      {invoice.invoice_number}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">
                        {invoice.business_name || 'MSME Enterprise'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Inv Date: {formatDate(invoice.invoice_date)}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{invoice.buyer_name}</div>
                      {invoice.buyer_gstin && (
                        <div className="text-[10px] font-mono text-slate-500 uppercase">
                          GSTIN: {invoice.buyer_gstin}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-800">
                      {formatINR(invoice.invoice_amount)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-emerald-700 font-medium">
                      {formatINR(invoice.amount_paid)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-[#0F2942]">
                      {formatINR(invoice.outstanding_amount)}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-700">
                        {formatDate(invoice.due_date)}
                      </div>
                      {isOverdue && invoice.days_overdue && invoice.days_overdue > 0 && (
                        <span className="text-[10px] text-red-600 font-bold block">
                          +{invoice.days_overdue} days delayed
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${badgeProps.className}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${badgeProps.dotColor}`} />
                        {badgeProps.label}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {!isFullyPaid && (
                          <>
                            <button
                              onClick={() => handleOpenPaymentModal(invoice, false)}
                              className="px-2.5 py-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition-colors"
                              title="Record Partial Payment"
                            >
                              + Pay
                            </button>
                            <button
                              onClick={() => handleOpenPaymentModal(invoice, true)}
                              className="px-2.5 py-1 text-[11px] font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors"
                              title="Mark Full Settlement"
                            >
                              Settle
                            </button>
                          </>
                        )}

                        {isOverdue && (
                          <button
                            onClick={() => onSelectForFollowUp(invoice)}
                            className="px-2.5 py-1 text-[11px] font-medium text-white bg-[#0F2942] hover:bg-[#1E3A8A] rounded transition-colors flex items-center gap-1"
                            title="Generate MSMED Follow-Up Notice"
                          >
                            <Send className="w-3 h-3" />
                            Remind
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteInvoice(invoice.id, invoice.invoice_number)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                          title="Delete Invoice"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-500">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-medium">No matching invoices found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Try clearing search parameters or raise a new invoice.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: RECORD PAYMENT (Partial or Full) */}
      {paymentModalInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1C30]/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#0F2942] text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-white/10 rounded-md text-emerald-400">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-heading text-white">Record Invoice Payment</h3>
                  <p className="text-[11px] text-slate-300 font-mono">{paymentModalInvoice.invoice_number}</p>
                </div>
              </div>
              <button
                onClick={() => setPaymentModalInvoice(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-5 space-y-4 text-xs">
              {paymentError && (
                <div className="p-2.5 rounded bg-red-50 border border-red-200 text-red-700 text-xs">
                  {paymentError}
                </div>
              )}

              {/* Invoice snapshot details */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Buyer:</span>
                  <span className="font-semibold text-slate-800">{paymentModalInvoice.buyer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Billed:</span>
                  <span className="font-mono">{formatINR(paymentModalInvoice.invoice_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Already Paid:</span>
                  <span className="font-mono text-emerald-600">{formatINR(paymentModalInvoice.amount_paid)}</span>
                </div>
                <div className="flex justify-between font-bold border-t border-slate-200 pt-1 text-slate-900">
                  <span>Current Outstanding:</span>
                  <span className="font-mono text-red-600">{formatINR(paymentModalInvoice.outstanding_amount)}</span>
                </div>
              </div>

              {/* Amount input */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Payment Amount to Record (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  placeholder={`Max: ${paymentModalInvoice.outstanding_amount}`}
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-md focus:outline-hidden focus:border-[#0F2942]"
                />
              </div>

              {/* Mode & Reference */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={e => setPaymentMode(e.target.value)}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-md bg-white text-xs"
                  >
                    <option value="NEFT/RTGS">NEFT / RTGS</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer (IMPS)</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">UTR / Ref Number</label>
                  <input
                    type="text"
                    value={paymentRef}
                    onChange={e => setPaymentRef(e.target.value)}
                    placeholder="e.g. HDFC260210..."
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-md font-mono text-xs"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Receipt Notes / Remarks</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={e => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Milestone 1 settlement via bank portal"
                  className="w-full px-2.5 py-2 border border-slate-300 rounded-md text-xs"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentModalInvoice(null)}
                  className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayment}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#059669] hover:bg-[#047857] rounded-md transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {isSubmittingPayment ? 'Recording...' : 'Confirm Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RAISE NEW INVOICE */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1C30]/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#0F2942] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-white/10 rounded-md text-[#86F2E4]">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-heading text-white">Raise New MSME Invoice</h3>
                  <p className="text-[11px] text-slate-300">Creates relational record and initiates 45-day tracking</p>
                </div>
              </div>
              <button onClick={onCloseCreateModal} className="text-slate-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="p-6 space-y-4 text-xs">
              {createError && (
                <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700">
                  {createError}
                </div>
              )}

              {/* Invoice Number & Business Supplier */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Invoice Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newInvNumber}
                    onChange={e => setNewInvNumber(e.target.value)}
                    placeholder="INV-2026-..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono text-xs focus:outline-hidden focus:border-[#0F2942]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Supplier MSME <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newBusinessId}
                    onChange={e => setNewBusinessId(e.target.value)}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-md bg-white text-xs focus:outline-hidden focus:border-[#0F2942]"
                  >
                    {businesses.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.business_name} ({b.msme_type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Buyer Name & GSTIN */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Buyer / Client Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newBuyerName}
                    onChange={e => setNewBuyerName(e.target.value)}
                    placeholder="e.g. Tata Motors, Hero Cycles..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:outline-hidden focus:border-[#0F2942]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Buyer GSTIN (15-Char)
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    value={newBuyerGstin}
                    onChange={e => setNewBuyerGstin(e.target.value.toUpperCase())}
                    placeholder="27AAACT2918K1ZN"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono text-xs uppercase focus:outline-hidden focus:border-[#0F2942]"
                  />
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Invoice Amount (₹ INR) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={newAmount}
                  onChange={e => setNewAmount(e.target.value)}
                  placeholder="e.g. 485000"
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-md focus:outline-hidden focus:border-[#0F2942]"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Invoice Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newInvoiceDate}
                    onChange={e => setNewInvoiceDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Due Date (Max 45 Days) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={e => setNewDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Description / Work Order Details
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  placeholder="e.g. Supply of forged pinion gear components batch #44 under purchase order PO-889"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:outline-hidden"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onCloseCreateModal}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#0F2942] hover:bg-[#1E3A8A] rounded-md transition-colors disabled:opacity-50"
                >
                  {isCreating ? 'Saving Invoice...' : 'Save & Track Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
