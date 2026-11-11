/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Package,
  Layers,
  ArrowRight,
  Info,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { DashboardStats } from '../types';
import { formatINR, formatCompactINR } from '../utils/formatters';

interface Props {
  stats: DashboardStats | null;
}

export const InsightsImpactView: React.FC<Props> = ({ stats }) => {
  const [recoveryTargetPct, setRecoveryTargetPct] = useState<number>(75);

  if (!stats) return null;

  const totalOverdue = stats.total_overdue;
  const potentialRecoveredAtTarget = (totalOverdue * recoveryTargetPct) / 100;
  // Section 16 penal interest savings at ~19.5% per annum
  const annualInterestSaved = Math.round(potentialRecoveredAtTarget * 0.195);
  // Estimate average production cycle cost (~₹2.5 Lakhs per batch)
  const additionalBatchesFunded = Math.floor(potentialRecoveredAtTarget / 250000);

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="bg-white rounded-lg p-5 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-[#0D9488]/10 text-[#006F66] font-bold">
              Module 6
            </span>
            <span className="text-xs text-slate-500">Economic Analytics & Cashflow Modeling</span>
          </div>
          <h2 className="text-xl font-bold font-heading text-[#0F2942] mt-1">
            Business Insights & Working Capital Impact
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Evaluate how resolving overdue invoices releases trapped liquidity, sustains payroll, and unlocks production cycles.
          </p>
        </div>
      </div>

      {/* Mandatory Evaluation Disclaimer */}
      <div className="bg-slate-100 border border-slate-300 rounded-lg p-3.5 flex items-start gap-3 text-xs text-slate-700">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed text-[11px]">
          <strong>Hackathon Evaluation Notice:</strong> The calculations below model projected financial scenarios using sample demonstration data. These estimates illustrate how resolving delayed payment bottlenecks can improve individual MSME working capital cycles. This prototype does not claim to have altered actual macroeconomic indicators or national GDP.
        </p>
      </div>

      {/* Baseline Financial Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Total Outstanding
          </div>
          <div className="text-2xl font-bold font-heading text-[#0F2942] mt-1 font-tabular">
            {formatINR(stats.total_outstanding)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">All pending customer balances</div>
        </div>

        <div className="bg-[#FEF2F2] rounded-lg p-4 border border-[#FECACA]">
          <div className="text-[11px] font-bold text-[#991B1B] uppercase tracking-wider">
            Total Overdue (Delayed)
          </div>
          <div className="text-2xl font-bold font-heading text-[#991B1B] mt-1 font-tabular">
            {formatINR(stats.total_overdue)}
          </div>
          <div className="text-[11px] text-[#7F1D1D] mt-0.5">Trapped working capital</div>
        </div>

        <div className="bg-[#ECFDF5] rounded-lg p-4 border border-[#A7F3D0]">
          <div className="text-[11px] font-bold text-[#065F46] uppercase tracking-wider">
            Total Payments Recovered
          </div>
          <div className="text-2xl font-bold font-heading text-[#065F46] mt-1 font-tabular">
            {formatINR(stats.total_paid)}
          </div>
          <div className="text-[11px] text-[#047857] mt-0.5">{stats.recovery_progress_percentage}% recovery rate</div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Inventory Asset Value
          </div>
          <div className="text-2xl font-bold font-heading text-[#0F2942] mt-1 font-tabular">
            {formatINR(stats.total_inventory_valuation)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">{stats.low_stock_count} low-stock products</div>
        </div>
      </div>

      {/* Interactive Working Capital Release Simulator */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold font-heading text-[#0F2942] flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#0D9488]" />
              Working Capital Liquidity Unlock Simulator
            </h3>
            <p className="text-xs text-slate-500">
              Adjust the payment recovery slider to simulate released liquidity and supply chain expansion.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-[#0D9488] bg-[#0D9488]/10 px-3 py-1 rounded-full">
            Target: {recoveryTargetPct}% Recovery
          </span>
        </div>

        {/* Range Slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-600 font-medium">
            <span>25% Partial Recovery</span>
            <span>50% Mediated Settlement</span>
            <span>75% MSMED Act Redressal</span>
            <span>100% Full Liquidity</span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            step="5"
            value={recoveryTargetPct}
            onChange={e => setRecoveryTargetPct(parseInt(e.target.value, 10))}
            className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#0D9488]"
          />
        </div>

        {/* Dynamic Simulation Output Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
          <div className="p-4 rounded-lg bg-[#F0FDFA] border border-[#99F6E4]">
            <div className="text-[11px] font-bold text-[#0D9488] uppercase tracking-wider">
              Projected Capital Released
            </div>
            <div className="text-2xl font-bold font-heading text-[#006F66] mt-1 font-tabular">
              {formatINR(potentialRecoveredAtTarget)}
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Direct cash injected into enterprise operating bank accounts from resolved receivables.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
            <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
              New Production Cycles Funded
            </div>
            <div className="text-2xl font-bold font-heading text-blue-900 mt-1 font-tabular">
              ~{additionalBatchesFunded} Batches
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Estimated raw material batches or manufacturing runs self-funded without high-interest loans.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
            <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
              Statutory Penal Interest Avoided
            </div>
            <div className="text-2xl font-bold font-heading text-emerald-900 mt-1 font-tabular">
              {formatINR(annualInterestSaved)} / yr
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Estimated compound penal interest (at 3x RBI rate) chargeable to delinquent buyers under Section 16.
            </p>
          </div>
        </div>

        {/* Narrative Analysis */}
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 space-y-2">
          <h4 className="font-bold text-[#0F2942] uppercase text-[11px] tracking-wider">
            Cash Flow Health Diagnostic
          </h4>
          <p className="leading-relaxed">
            By collecting <strong>{recoveryTargetPct}%</strong> of delayed payments ({formatINR(potentialRecoveredAtTarget)}), registered MSME suppliers eliminate dependency on high-cost informal credit (often exceeding 24% p.a.). This liquidity immediately restores raw material buffer stocks, prevents vendor defaults, and preserves credit ratings under formal banking channels (e.g. CGTMSE / MUDRA).
          </p>
        </div>
      </div>
    </div>
  );
};
