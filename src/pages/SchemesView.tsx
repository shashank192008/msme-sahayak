/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Award,
  ExternalLink,
  Search,
  Filter,
  CheckCircle2,
  FileText,
  Phone,
  Building,
  ShieldAlert,
  Info,
  MapPin,
} from 'lucide-react';
import { Scheme, SupportResource } from '../types';

interface Props {
  schemes: Scheme[];
  supportResources: SupportResource[];
}

export const SchemesView: React.FC<Props> = ({ schemes, supportResources }) => {
  const [activeTab, setActiveTab] = useState<'schemes' | 'resources'>('schemes');
  const [searchTerm, setSearchTerm] = useState('');
  const [msmeTypeFilter, setMsmeTypeFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  const filteredSchemes = schemes.filter(s => {
    if (msmeTypeFilter !== 'ALL' && !s.eligible_msme_types.toLowerCase().includes(msmeTypeFilter.toLowerCase())) {
      return false;
    }
    if (categoryFilter !== 'ALL' && s.category !== categoryFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        s.name.toLowerCase().includes(term) ||
        s.purpose.toLowerCase().includes(term) ||
        s.eligibility_summary.toLowerCase().includes(term) ||
        s.category.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const filteredResources = supportResources.filter(r => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        r.name.toLowerCase().includes(term) ||
        r.city_state.toLowerCase().includes(term) ||
        r.services_offered.toLowerCase().includes(term) ||
        r.entity_type.toLowerCase().includes(term)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div className="bg-white rounded-lg p-5 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-mono px-2 py-0.5 rounded bg-[#0D9488]/10 text-[#006F66] font-bold">
              Module 5
            </span>
            <span className="text-xs text-slate-500">Ministry of MSME & RBI Programs</span>
          </div>
          <h2 className="text-xl font-bold font-heading text-[#0F2942] mt-1">
            Government Schemes & MSME Support Directory
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Discover official delayed payment arbitration portals, credit guarantee schemes, and institutional support bodies.
          </p>
        </div>

        {/* Tab switch between Schemes & Facilitation Centers */}
        <div className="flex items-center p-1 bg-slate-100 rounded-lg text-xs font-medium shrink-0">
          <button
            onClick={() => setActiveTab('schemes')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'schemes'
                ? 'bg-white text-[#0F2942] shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Central Schemes ({schemes.length})
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === 'resources'
                ? 'bg-white text-[#0F2942] shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Facilitation Councils ({supportResources.length})
          </button>
        </div>
      </div>

      {/* Mandatory Regulatory Disclaimer */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3.5 flex items-start gap-3 text-xs text-blue-950">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed text-[11px]">
          <strong>Statutory Notice & Advisory:</strong> This resource directory compiles official Government of India and RBI schemes for educational and advisory reference. MSME Sahayak does not guarantee loan sanctions, subsidies, or scheme acceptance. All applications must be submitted directly to the verified official government portals linked below.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-lg p-4 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search schemes, eligibility, subsidy..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0F2942]"
          />
        </div>

        {activeTab === 'schemes' && (
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto text-xs">
            {/* Filter by MSME Profile */}
            <span className="text-slate-500 text-[11px] font-medium">Eligible MSME Type:</span>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              {['ALL', 'Micro', 'Small', 'Medium'].map(t => (
                <button
                  key={t}
                  onClick={() => setMsmeTypeFilter(t)}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-all ${
                    msmeTypeFilter === t
                      ? 'bg-white text-[#0F2942] shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* TAB 1: CENTRAL SCHEMES GRID */}
      {activeTab === 'schemes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredSchemes.map(scheme => {
            const isSamadhaan = scheme.name.includes('Samadhaan');

            return (
              <div
                key={scheme.id}
                className={`bg-white rounded-lg border p-5 shadow-xs flex flex-col justify-between transition-all ${
                  isSamadhaan
                    ? 'border-[#0D9488]/40 ring-1 ring-[#0D9488]/20 bg-[#F0FDFA]/30'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  {/* Category & Tag */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {scheme.category}
                    </span>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#0D9488]/10 text-[#006F66]">
                      {scheme.eligible_msme_types}
                    </span>
                  </div>

                  <h3 className="font-bold text-base font-heading text-[#0F2942] mt-2.5">
                    {scheme.name}
                  </h3>
                  <div className="text-[11px] text-slate-500 font-medium">{scheme.ministry}</div>

                  {/* Purpose */}
                  <p className="text-xs text-slate-700 mt-2.5 leading-relaxed">
                    {scheme.purpose}
                  </p>

                  {/* Financial Benefit / Subsidy Limit */}
                  <div className="mt-3.5 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                    <div className="font-semibold text-slate-800 text-[11px] uppercase tracking-wider">
                      Financial Coverage / Assistance
                    </div>
                    <div className="font-mono font-bold text-[#0F2942] text-sm mt-0.5">
                      {scheme.max_subsidy_loan}
                    </div>
                  </div>

                  {/* Eligibility & Required Documents */}
                  <div className="mt-3 space-y-2 text-xs">
                    <div>
                      <span className="font-semibold text-slate-800 block text-[11px]">Eligibility:</span>
                      <p className="text-slate-600 text-[11px] leading-relaxed mt-0.5">
                        {scheme.eligibility_summary}
                      </p>
                    </div>

                    <div>
                      <span className="font-semibold text-slate-800 block text-[11px]">Key Documents Required:</span>
                      <p className="text-slate-500 text-[11px] leading-relaxed mt-0.5 font-mono">
                        {scheme.required_documents}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer Portal Link */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  {scheme.helpline && (
                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span className="font-mono">{scheme.helpline}</span>
                    </div>
                  )}

                  <a
                    href={scheme.official_url}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-auto px-3.5 py-1.5 text-xs font-semibold text-white bg-[#0F2942] hover:bg-[#1E3A8A] rounded-md transition-colors flex items-center gap-1.5"
                  >
                    <span>Visit Official Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: SUPPORT RESOURCES & FACILITATION COUNCILS */}
      {activeTab === 'resources' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredResources.map(res => (
            <div
              key={res.id}
              className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  {res.entity_type}
                </span>

                <h3 className="font-bold text-sm font-heading text-[#0F2942] mt-2 line-clamp-2">
                  {res.name}
                </h3>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{res.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono">{res.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Services:</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 p-2 rounded border border-slate-100">
                    {res.services_offered}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <a
                  href={res.website_url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-1.5 text-xs font-semibold text-[#0D9488] bg-[#0D9488]/10 hover:bg-[#0D9488]/20 rounded text-center transition-colors flex items-center justify-center gap-1"
                >
                  <span>Official Website</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
