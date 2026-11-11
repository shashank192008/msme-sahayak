/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon?: LucideIcon;
  badge?: string;
  badgeType?: 'danger' | 'warning' | 'success' | 'info' | 'neutral';
  accentBorder?: boolean;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subValue,
  icon: Icon,
  badge,
  badgeType = 'neutral',
  accentBorder = false,
  onClick,
}) => {
  const badgeStyles = {
    danger: 'bg-red-50 text-red-700 border-red-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg p-5 border transition-all ${
        accentBorder ? 'border-[#0D9488]/40 ring-1 ring-[#0D9488]/20' : 'border-slate-200'
      } ${
        onClick ? 'cursor-pointer hover:border-[#0F2942]/30 hover:shadow-md' : 'shadow-xs'
      }`}
    >
      {/* Upper row: Label & Badge */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-500 font-sans">
          {label}
        </span>
        {badge && (
          <span
            className={`text-[10px] font-medium font-mono px-2 py-0.5 rounded-full border ${badgeStyles[badgeType]}`}
          >
            {badge}
          </span>
        )}
      </div>

      {/* Core: Bold Currency / Numeric Value */}
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-2xl sm:text-[28px] font-bold font-heading text-[#0F2942] tracking-tight font-tabular">
          {value}
        </div>
        {Icon && (
          <div className="p-2 rounded-lg bg-slate-50 text-slate-600">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Lower row: Sub-descriptor */}
      {subValue && (
        <div className="mt-2 text-xs text-slate-500 flex items-center gap-1 font-sans">
          {subValue}
        </div>
      )}
    </div>
  );
};
