/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  LayoutDashboard,
  FileText,
  Send,
  Building2,
  Package,
  Award,
  TrendingUp,
  Database,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

export type TabType =
  | 'dashboard'
  | 'invoices'
  | 'followup'
  | 'businesses'
  | 'inventory'
  | 'schemes'
  | 'insights'
  | 'dbms';

interface Props {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  overdueCount: number;
  lowStockCount: number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<Props> = ({
  activeTab,
  onTabChange,
  overdueCount,
  lowStockCount,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const navItems = [
    {
      id: 'dashboard' as TabType,
      label: 'Main Dashboard',
      description: 'Overview & Analytics',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'invoices' as TabType,
      label: 'Invoices & Payments',
      description: 'Primary Module · 45-Day Tracker',
      icon: FileText,
      badge: overdueCount > 0 ? `${overdueCount} Overdue` : null,
      badgeColor: 'bg-[#DC2626] text-white',
    },
    {
      id: 'followup' as TabType,
      label: 'Follow-Up Assistant',
      description: 'MSMED Legal & Tone Templates',
      icon: Send,
      badge: null,
    },
    {
      id: 'businesses' as TabType,
      label: 'Business Directory',
      description: 'MSME Registration & Profiles',
      icon: Building2,
      badge: null,
    },
    {
      id: 'inventory' as TabType,
      label: 'Inventory Management',
      description: 'Stocks, Re-order & Valuations',
      icon: Package,
      badge: lowStockCount > 0 ? `${lowStockCount} Low` : null,
      badgeColor: 'bg-[#D97706] text-white',
    },
    {
      id: 'schemes' as TabType,
      label: 'Government Schemes',
      description: 'Samadhaan, CGTMSE, PMEGP, MUDRA',
      icon: Award,
      badge: '8 Schemes',
      badgeColor: 'bg-[#0D9488]/20 text-[#006F66]',
    },
    {
      id: 'insights' as TabType,
      label: 'Insights & Impact',
      description: 'Working Capital Unlock Simulator',
      icon: TrendingUp,
      badge: null,
    },
    {
      id: 'dbms' as TabType,
      label: 'DBMS Practice Lab',
      description: '30+ SQL Concepts for Evaluators',
      icon: Database,
      badge: 'SQL',
      badgeColor: 'bg-[#0F2942] text-white',
    },
  ];

  const handleSelect = (id: TabType) => {
    onTabChange(id);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed lg:sticky top-16 left-0 z-40 h-[calc(100vh-4rem)] w-72 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Navigation list */}
        <div className="p-3 space-y-1 overflow-y-auto flex-1">
          <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Platform Modules
          </div>

          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all group ${
                  isActive
                    ? 'bg-[#0F2942] text-white font-medium shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-[#86F2E4]' : 'text-slate-500 group-hover:text-[#0D9488]'
                    }`}
                  />
                  <div className="truncate">
                    <div className="text-xs font-semibold leading-tight truncate">
                      {item.label}
                    </div>
                    <div
                      className={`text-[10px] truncate ${
                        isActive ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      {item.description}
                    </div>
                  </div>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-medium shrink-0 ml-1.5 ${
                      item.badgeColor || 'bg-slate-200 text-slate-800'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Statutory Compliance Banner */}
        <div className="p-3 border-t border-slate-200 bg-slate-50">
          <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-[#0F2942] text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0D9488]" />
              <span>MSMED Act, 2006</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500 leading-tight">
              Section 15 mandates payment within 45 days. Delayed dues incur compound interest at 3x RBI rate.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
