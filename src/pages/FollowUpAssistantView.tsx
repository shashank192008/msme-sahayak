/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Send,
  Copy,
  Check,
  Mail,
  Share2,
  AlertTriangle,
  Scale,
  FileCheck,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { Invoice } from '../types';
import { formatINR, formatDate } from '../utils/formatters';
import { api } from '../services/api';

interface Props {
  invoices: Invoice[];
  selectedInvoice: Invoice | null;
  onSelectInvoice: (inv: Invoice) => void;
}

export const FollowUpAssistantView: React.FC<Props> = ({
  invoices,
  selectedInvoice,
  onSelectInvoice,
}) => {
  // Only invoices with outstanding balance
  const overdueOrPendingInvoices = invoices.filter(i => i.outstanding_amount > 0);
  const currentInvoice = selectedInvoice || overdueOrPendingInvoices[0] || null;

  const [tone, setTone] = useState<'gentle' | 'formal' | 'statutory'>('formal');
  const [reminderData, setReminderData] = useState<{
    subject: string;
    message: string;
    days_overdue: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (currentInvoice) {
      loadReminder(currentInvoice.id, tone);
    }
  }, [currentInvoice?.id, tone]);

  const loadReminder = async (invoiceId: number, selectedTone: 'gentle' | 'formal' | 'statutory') => {
    setLoading(true);
    try {
      const res = await api.getFollowUpReminder(invoiceId, selectedTone);
      setReminderData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!reminderData) return;
    const fullText = `Subject: ${reminderData.subject}\n\n${reminderData.message}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleEmailShare = () => {
    if (!reminderData || !currentInvoice) return;
    const mailto = `mailto:?subject=${encodeURIComponent(reminderData.subject)}&body=${encodeURIComponent(reminderData.message)}`;
    window.location.href = mailto;
  };

  const handleWhatsAppShare = () => {
    if (!reminderData) return;
    const waText = encodeURIComponent(`*${reminderData.subject}*\n\n${reminderData.message}`);
    window.open(`https://api.whatsapp.com/send?text=${waText}`, '_blank');
  };

  if (!currentInvoice) {
    return (
      <div className="bg-white rounded-lg p-12 text-center border border-slate-200">
        <Send className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold font-heading text-[#0F2942]">No Outstanding Invoices</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          All invoices are currently fully cleared. Once an invoice has an unpaid or delayed balance, you can generate customized recovery notices here.
        </p>
      </div>
    );
  }

  const days = reminderData?.days_overdue ?? (currentInvoice.days_overdue || 0);
  const isPast45Days = days > 45;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white rounded-lg p-5 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-[#0D9488]/10 text-[#006F66] font-bold">
              Module 3
            </span>
            <span className="text-xs text-slate-500">Professional Payment Recovery</span>
          </div>
          <h2 className="text-xl font-bold font-heading text-[#0F2942] mt-1">
            Payment Follow-Up Assistant
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Generate customized commercial reminders and statutory legal notices under Section 15 & 16 of the MSMED Act 2006.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Rail: Select Invoice (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Select Unpaid Invoice ({overdueOrPendingInvoices.length})
            </h3>
            <p className="text-[11px] text-slate-500 mb-3">
              Click an invoice to generate customized recovery copy
            </p>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {overdueOrPendingInvoices.map(inv => {
                const isSelected = inv.id === currentInvoice.id;
                const isOverdue = inv.payment_status === 'OVERDUE';

                return (
                  <button
                    key={inv.id}
                    onClick={() => onSelectInvoice(inv)}
                    className={`w-full p-3 rounded-lg text-left transition-all border ${
                      isSelected
                        ? 'border-[#0F2942] bg-[#0F2942]/5 ring-1 ring-[#0F2942]'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-[#0F2942]">
                        {inv.invoice_number}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                          isOverdue ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isOverdue ? `${inv.days_overdue}d Overdue` : 'Pending'}
                      </span>
                    </div>

                    <div className="font-semibold text-xs text-slate-800 mt-1 truncate">
                      {inv.buyer_name}
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px]">
                      <span className="text-slate-500">Due: {formatDate(inv.due_date)}</span>
                      <span className="font-mono font-bold text-slate-900">
                        {formatINR(inv.outstanding_amount)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* MSMED Legal Context Card */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-4 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <Scale className="w-4 h-4 text-[#EA580C]" />
              <span>MSMED Act 2006 Legal Provisions</span>
            </div>
            <p className="text-amber-800 text-[11px] leading-relaxed">
              <strong>Section 15:</strong> Mandatory payment within 45 days of supply acceptance.<br />
              <strong>Section 16:</strong> Buyer is liable to pay compound interest with monthly rests at <strong>3x the RBI Bank Rate</strong> for any delayed days.
            </p>
          </div>
        </div>

        {/* Right Rail: Notice Generator & Message Viewer (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Active Invoice Header Card */}
          <div className="bg-white rounded-lg p-4 border border-slate-200">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Target Buyer</span>
                <span className="font-semibold text-slate-900 text-sm">{currentInvoice.buyer_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Invoice Number</span>
                <span className="font-mono font-bold text-[#0F2942] text-sm">{currentInvoice.invoice_number}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Outstanding Balance</span>
                <span className="font-mono font-bold text-[#991B1B] text-sm">{formatINR(currentInvoice.outstanding_amount)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Overdue Timeline</span>
                <span className={`font-bold text-sm ${days > 0 ? 'text-red-600' : 'text-amber-600'}`}>
                  {days > 0 ? `${days} Days Overdue` : 'Due Today'}
                </span>
              </div>
            </div>
          </div>

          {/* Tone Selector */}
          <div className="bg-white rounded-lg p-4 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Reminder Tone
              </span>
              {isPast45Days && (
                <span className="text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Statutory Notice Recommended (45+ Days)
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={() => setTone('gentle')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  tone === 'gentle'
                    ? 'border-[#0D9488] bg-[#0D9488]/5 ring-1 ring-[#0D9488]'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="font-semibold text-xs text-[#0F2942]">Gentle Courtesy</div>
                <p className="text-[11px] text-slate-500 mt-0.5">Early 1-15 day polite reminder for trusted corporate partners.</p>
              </button>

              <button
                onClick={() => setTone('formal')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  tone === 'formal'
                    ? 'border-[#0F2942] bg-[#0F2942]/5 ring-1 ring-[#0F2942]'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="font-semibold text-xs text-[#0F2942]">Formal Demand</div>
                <p className="text-[11px] text-slate-500 mt-0.5">Professional financial follow-up for invoices overdue 15–45 days.</p>
              </button>

              <button
                onClick={() => setTone('statutory')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  tone === 'statutory'
                    ? 'border-[#DC2626] bg-[#DC2626]/5 ring-1 ring-[#DC2626]'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="font-semibold text-xs text-[#DC2626] flex items-center justify-between">
                  <span>Statutory Legal Notice</span>
                  <Scale className="w-3.5 h-3.5" />
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Cites Section 15 & 16 MSMED Act with 3x RBI penal interest.</p>
              </button>
            </div>
          </div>

          {/* Generated Message Display Box */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
              <div className="text-xs text-slate-600 truncate max-w-md">
                <span className="font-semibold">Subject:</span>{' '}
                <span className="font-mono text-slate-800">{reminderData?.subject || 'Loading subject...'}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 text-xs font-semibold text-[#0F2942] bg-white border border-slate-200 hover:bg-slate-100 rounded-md transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied Notice' : 'Copy Notice'}
                </button>
              </div>
            </div>

            <div className="p-4">
              {loading ? (
                <div className="py-12 text-center text-slate-400 text-xs">Generating reminder content...</div>
              ) : (
                <pre className="text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed bg-slate-50 p-4 rounded-md border border-slate-200 max-h-[380px] overflow-y-auto">
                  {reminderData?.message}
                </pre>
              )}
            </div>

            {/* Quick Dispatch Action Bar */}
            <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="text-slate-500 text-[11px]">
                Note: Reminder uses verified relational records from the database.
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleEmailShare}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-md transition-colors flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                  <span>Open Email Draft</span>
                </button>

                <button
                  onClick={handleWhatsAppShare}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#059669] hover:bg-[#047857] rounded-md transition-colors flex items-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Send via WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
