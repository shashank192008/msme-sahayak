/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Database, PlusCircle, AlertCircle, Menu } from 'lucide-react';
import { DbStatusInfo } from '../types';

interface Props {
  dbStatus: DbStatusInfo | null;
  onOpenDbModal: () => void;
  onOpenNewInvoiceModal: () => void;
  overdueCount?: number;
  onToggleMobileNav?: () => void;
}

export const Header: React.FC<Props> = ({
  dbStatus,
  onOpenDbModal,
  onOpenNewInvoiceModal,
  overdueCount = 0,
  onToggleMobileNav,
}) => {
  const isMySql = dbStatus?.type === 'mysql' && dbStatus?.connected;

  return (
    <header className="sticky top-0 z-30 bg-[#0F2942] border-b border-[#1E3A8A] text-white">
      {/* Top Bar Container - 3 Zones */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Wordmark & Brand Identity */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onToggleMobileNav}
            className="lg:hidden p-1.5 rounded-md text-slate-300 hover:text-white hover:bg-white/10"
            aria-label="Open Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            {/* Government-fintech emblem */}
            <div className="w-9 h-9 rounded-lg bg-[#0D9488] flex items-center justify-center font-heading font-black text-white text-base shadow-sm ring-1 ring-white/20">
              सं
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-extrabold tracking-tight text-lg text-white whitespace-nowrap">
                  MSME SAHAYAK
                </span>
                <span className="hidden sm:inline-block text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#0D9488]/30 text-[#86F2E4] border border-[#0D9488]/40 font-semibold font-mono">
                  Govt. Alignment
                </span>
              </div>
              <p className="hidden md:block text-[11px] text-slate-300 font-sans tracking-normal -mt-0.5">
                Empowering MSMEs. Strengthening India's Economy.
              </p>
            </div>
          </div>
        </div>

        {/* Zone 2: Status & Quick Telemetry Indicators */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Overdue alert indicator */}
          {overdueCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#DC2626]/20 border border-[#DC2626]/40 text-[#FECACA] text-xs font-medium">
              <AlertCircle className="w-3.5 h-3.5 text-[#F87171]" />
              <span>{overdueCount} Overdue Invoices</span>
            </div>
          )}

          {/* Database Connectivity Button */}
          <button
            onClick={onOpenDbModal}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              isMySql
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/60'
                : 'bg-amber-950/50 border-amber-500/40 text-amber-200 hover:bg-amber-900/50'
            }`}
            title="Click to view database connection details & practice queries"
          >
            <Database className="w-3.5 h-3.5" />
            <span className="font-mono">
              {isMySql ? 'MySQL: msme_sahayak (Connected)' : 'DB: In-Memory SQL Engine'}
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                isMySql ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
          </button>
        </div>

        {/* Zone 3: Primary Action CTA */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenNewInvoiceModal}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold font-heading text-white bg-[#0D9488] hover:bg-[#0B7268] active:scale-98 rounded-lg shadow-sm transition-all focus:outline-hidden focus:ring-2 focus:ring-[#86F2E4] whitespace-nowrap shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Raise Invoice</span>
          </button>
        </div>
      </div>
    </header>
  );
};
