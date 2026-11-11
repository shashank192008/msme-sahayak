/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  MapPin,
  Phone,
  Mail,
  Award,
  FileText,
} from 'lucide-react';
import { Business } from '../types';
import { formatINR } from '../utils/formatters';
import { api } from '../services/api';

interface Props {
  businesses: Business[];
  onRefresh: () => void;
  onSelectBusinessInvoices?: (businessId: number) => void;
}

export const BusinessesView: React.FC<Props> = ({ businesses, onRefresh, onSelectBusinessInvoices }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);

  // Form State
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('');
  const [msmeType, setMsmeType] = useState<'Micro' | 'Small' | 'Medium'>('Micro');
  const [udyam, setUdyam] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleOpenAddModal = () => {
    setEditingBusiness(null);
    setBusinessName('');
    setOwnerName('');
    setEmail('');
    setPhone('');
    setCategory('Precision Engineering & Auto Ancillary');
    setMsmeType('Micro');
    setUdyam(`UDYAM-MH-01-00${Math.floor(10000 + Math.random() * 90000)}`);
    setLocation('Pune, Maharashtra');
    setAddress('');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (b: Business) => {
    setEditingBusiness(b);
    setBusinessName(b.business_name);
    setOwnerName(b.owner_name);
    setEmail(b.email);
    setPhone(b.phone);
    setCategory(b.category);
    setMsmeType(b.msme_type);
    setUdyam(b.udyam_reg_number || '');
    setLocation(b.location);
    setAddress(b.address);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName || !ownerName || !email || !phone || !location) {
      setErrorMsg('Please complete all required fields.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const payload = {
      business_name: businessName.trim(),
      owner_name: ownerName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      category: category.trim(),
      msme_type: msmeType,
      udyam_reg_number: udyam.trim() || undefined,
      location: location.trim(),
      address: address.trim() || location.trim(),
    };

    try {
      if (editingBusiness) {
        await api.updateBusiness(editingBusiness.id, payload);
      } else {
        await api.createBusiness(payload);
      }
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving enterprise');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete '${name}'? This will also remove related demo invoices and inventory.`)) {
      try {
        await api.deleteBusiness(id);
        onRefresh();
      } catch (err: any) {
        alert(err.message || 'Error deleting business');
      }
    }
  };

  const filteredBusinesses = businesses.filter(b => {
    if (typeFilter !== 'ALL' && b.msme_type !== typeFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        b.business_name.toLowerCase().includes(term) ||
        b.owner_name.toLowerCase().includes(term) ||
        b.location.toLowerCase().includes(term) ||
        b.category.toLowerCase().includes(term)
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
              Module 1
            </span>
            <span className="text-xs text-slate-500">Relational Database Integration</span>
          </div>
          <h2 className="text-xl font-bold font-heading text-[#0F2942] mt-1">
            Registered MSME Enterprises
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Manage enterprise profiles, Udyam registration certificates, and connected invoice ledgers.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0F2942] hover:bg-[#1E3A8A] rounded-lg shadow-sm transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Register New MSME</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-lg p-4 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search business name, owner, city, category..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0F2942]"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg w-full sm:w-auto">
          {['ALL', 'Micro', 'Small', 'Medium'].map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                typeFilter === t
                  ? 'bg-white text-[#0F2942] shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t === 'ALL' ? 'All Types' : `${t} Enterprise`}
            </button>
          ))}
        </div>
      </div>

      {/* Businesses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredBusinesses.map(bus => {
          const typeColors = {
            Micro: 'bg-emerald-50 text-emerald-800 border-emerald-200',
            Small: 'bg-blue-50 text-blue-800 border-blue-200',
            Medium: 'bg-purple-50 text-purple-800 border-purple-200',
          };

          return (
            <div
              key={bus.id}
              className="bg-white rounded-lg border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              <div>
                {/* Header: Name and Type badge */}
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                      typeColors[bus.msme_type] || 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {bus.msme_type} Enterprise
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(bus)}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded"
                      title="Edit Enterprise"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(bus.id, bus.business_name)}
                      className="p-1 text-slate-400 hover:text-red-600 rounded"
                      title="Delete Enterprise"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-sm font-heading text-[#0F2942] mt-2 line-clamp-1">
                  {bus.business_name}
                </h3>
                <p className="text-xs text-slate-500 font-sans mt-0.5">{bus.category}</p>

                {/* Contact and Location */}
                <div className="mt-3.5 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-800">{bus.owner_name} (Proprietor)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{bus.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono">{bus.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{bus.email}</span>
                  </div>
                </div>

                {/* Udyam Badge */}
                {bus.udyam_reg_number && (
                  <div className="mt-3 p-2 bg-slate-50 rounded border border-slate-200 text-[11px] font-mono text-[#0F2942] flex items-center justify-between">
                    <span className="text-slate-400 text-[10px]">UDYAM REG:</span>
                    <span className="font-bold">{bus.udyam_reg_number}</span>
                  </div>
                )}
              </div>

              {/* Financial Invoicing Health */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Overdue Balance</span>
                  <span className={`font-mono font-bold ${bus.total_overdue && bus.total_overdue > 0 ? 'text-[#DC2626]' : 'text-slate-700'}`}>
                    {formatINR(bus.total_overdue || 0)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px] uppercase">Total Invoices</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {bus.total_invoices || 0} bills
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {filteredBusinesses.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-lg border border-slate-200">
            <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium">No registered businesses found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting the filter or register a new MSME enterprise.</p>
          </div>
        )}
      </div>

      {/* REGISTRATION / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1C30]/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#0F2942] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-white/10 rounded-md text-[#86F2E4]">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-heading text-white">
                    {editingBusiness ? 'Edit Enterprise Details' : 'Register New MSME Enterprise'}
                  </h3>
                  <p className="text-[11px] text-slate-300">Persists to MySQL businesses table</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              {errorMsg && (
                <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700">
                  {errorMsg}
                </div>
              )}

              {/* Business Name */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Enterprise Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  placeholder="e.g. Pune Precision Gears Pvt Ltd"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:outline-hidden focus:border-[#0F2942]"
                />
              </div>

              {/* Owner & Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Proprietor / Owner Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={e => setOwnerName(e.target.value)}
                    placeholder="e.g. Rajesh Kulkarni"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+91 98220 12345"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono text-xs"
                  />
                </div>
              </div>

              {/* Email & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="contact@enterprise.in"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    MSME Classification <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={msmeType}
                    onChange={e => setMsmeType(e.target.value as any)}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-md bg-white text-xs"
                  >
                    <option value="Micro">Micro (&lt; ₹1 Cr inv, &lt; ₹5 Cr turn)</option>
                    <option value="Small">Small (&lt; ₹10 Cr inv, &lt; ₹50 Cr turn)</option>
                    <option value="Medium">Medium (&lt; ₹50 Cr inv, &lt; ₹250 Cr turn)</option>
                  </select>
                </div>
              </div>

              {/* Sector Category & Udyam Number */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Industry / Sector Category
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    placeholder="e.g. Precision Engineering, Textile"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Udyam Reg. Number
                  </label>
                  <input
                    type="text"
                    value={udyam}
                    onChange={e => setUdyam(e.target.value.toUpperCase())}
                    placeholder="UDYAM-MH-01-0012345"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono text-xs uppercase"
                  />
                </div>
              </div>

              {/* Location & Address */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Location (City, State) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="e.g. Pune, Maharashtra"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Industrial Estate / Full Registered Address
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="e.g. Plot W-42, MIDC Bhosari Industrial Area, Pune - 411026"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:outline-hidden"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#0F2942] hover:bg-[#1E3A8A] rounded-md transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingBusiness ? 'Update Enterprise' : 'Register Enterprise'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
