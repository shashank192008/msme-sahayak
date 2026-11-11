/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  Edit2,
  Trash2,
  X,
  Filter,
} from 'lucide-react';
import { InventoryItem, Business } from '../types';
import { formatINR } from '../utils/formatters';
import { api } from '../services/api';

interface Props {
  inventory: InventoryItem[];
  businesses: Business[];
  onRefresh: () => void;
}

export const InventoryView: React.FC<Props> = ({ inventory, businesses, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Form State
  const [businessId, setBusinessId] = useState(businesses[0]?.id ? String(businesses[0].id) : '1');
  const [productName, setProductName] = useState('');
  const [productCategory, setProductCategory] = useState('Raw Material');
  const [availableQuantity, setAvailableQuantity] = useState('');
  const [minStockLevel, setMinStockLevel] = useState('20');
  const [unitPrice, setUnitPrice] = useState('');
  const [unitOfMeasure, setUnitOfMeasure] = useState('Units');
  const [supplierName, setSupplierName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const totalInventoryValuation = inventory.reduce((sum, item) => sum + item.item_valuation, 0);
  const lowStockItems = inventory.filter(i => i.is_low_stock);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setProductName('');
    setProductCategory('Raw Material');
    setAvailableQuantity('');
    setMinStockLevel('20');
    setUnitPrice('');
    setUnitOfMeasure('Units');
    setSupplierName('');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setBusinessId(String(item.business_id));
    setProductName(item.product_name);
    setProductCategory(item.product_category);
    setAvailableQuantity(String(item.available_quantity));
    setMinStockLevel(String(item.min_stock_level));
    setUnitPrice(String(item.unit_price));
    setUnitOfMeasure(item.unit_of_measure || 'Units');
    setSupplierName(item.supplier_name);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(availableQuantity, 10);
    const minQty = parseInt(minStockLevel, 10);
    const price = parseFloat(unitPrice);

    if (!productName || !supplierName || isNaN(qty) || isNaN(minQty) || isNaN(price)) {
      setErrorMsg('Please complete all fields with valid numbers.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const payload = {
      business_id: parseInt(businessId, 10),
      product_name: productName.trim(),
      product_category: productCategory,
      available_quantity: qty,
      min_stock_level: minQty,
      unit_price: price,
      unit_of_measure: unitOfMeasure,
      supplier_name: supplierName.trim(),
    };

    try {
      if (editingItem) {
        await api.updateInventoryItem(editingItem.id, payload);
      } else {
        await api.createInventoryItem(payload);
      }
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save inventory item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete '${name}' from inventory?`)) {
      try {
        await api.deleteInventoryItem(id);
        onRefresh();
      } catch (err: any) {
        alert(err.message || 'Failed to delete item');
      }
    }
  };

  const filteredItems = inventory.filter(item => {
    if (lowStockOnly && !item.is_low_stock) return false;
    if (categoryFilter !== 'ALL' && item.product_category !== categoryFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        item.product_name.toLowerCase().includes(term) ||
        item.supplier_name.toLowerCase().includes(term) ||
        item.product_category.toLowerCase().includes(term) ||
        (item.business_name && item.business_name.toLowerCase().includes(term))
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
              Module 4
            </span>
            <span className="text-xs text-slate-500">Working Capital & Supply Chain</span>
          </div>
          <h2 className="text-xl font-bold font-heading text-[#0F2942] mt-1">
            Inventory & Stock Management
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Track materials, automate low-stock buffer alerts, and monitor tied-up inventory working capital.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0F2942] hover:bg-[#1E3A8A] rounded-lg shadow-sm transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Stock Item</span>
        </button>
      </div>

      {/* Metric Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Total Inventory Valuation
          </div>
          <div className="text-2xl font-bold font-heading text-[#0F2942] mt-1 font-tabular">
            {formatINR(totalInventoryValuation)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Tied-up working capital in warehouses
          </div>
        </div>

        <div className={`rounded-lg p-4 border ${lowStockItems.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
          <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
            Low-Stock Buffer Warnings
          </div>
          <div className="text-2xl font-bold font-heading text-amber-950 mt-1 font-tabular">
            {lowStockItems.length} Products
          </div>
          <div className="text-[11px] text-amber-800 mt-0.5 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Below safety re-order threshold</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-slate-200">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Total Products Catalogued
          </div>
          <div className="text-2xl font-bold font-heading text-[#0F2942] mt-1 font-tabular">
            {inventory.length} Items
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Raw materials & finished goods
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-lg p-4 border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search product, category, or supplier..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-[#0F2942]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-md bg-white text-slate-700 focus:outline-hidden"
          >
            <option value="ALL">All Categories</option>
            <option value="Raw Material">Raw Material</option>
            <option value="Finished Goods">Finished Goods</option>
            <option value="Spare Parts">Spare Parts</option>
            <option value="Packaging">Packaging</option>
          </select>

          {/* Low Stock Toggle Button */}
          <button
            onClick={() => setLowStockOnly(!lowStockOnly)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors flex items-center gap-1.5 ${
              lowStockOnly
                ? 'bg-amber-100 text-amber-900 border-amber-300 font-semibold'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Low Stock Only ({lowStockItems.length})</span>
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">MSME Supplier</th>
                <th className="py-3 px-4 text-right">Available Qty</th>
                <th className="py-3 px-4 text-right">Min Buffer</th>
                <th className="py-3 px-4 text-right">Unit Price</th>
                <th className="py-3 px-4 text-right">Valuation</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map(item => {
                const isLow = item.is_low_stock;

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isLow ? 'bg-amber-50/30' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div>{item.product_name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Vendor: {item.supplier_name}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                        {item.product_category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {item.business_name || 'MSME Enterprise'}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      {item.available_quantity} {item.unit_of_measure}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                      {item.min_stock_level} {item.unit_of_measure}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                      {formatINR(item.unit_price)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-[#0F2942]">
                      {formatINR(item.item_valuation)}
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          Reorder ({item.units_to_reorder} needed)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Optimal Buffer
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                          title="Edit Stock"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.product_name)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-500">
                    <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-medium">No inventory items matched your criteria</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT INVENTORY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1C30]/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#0F2942] text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-white/10 rounded-md text-[#86F2E4]">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-heading text-white">
                    {editingItem ? 'Update Stock Item' : 'Add Item to Inventory'}
                  </h3>
                  <p className="text-[11px] text-slate-300">Persists to MySQL inventory table</p>
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

              {/* Product Name */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Product / Material Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={productName}
                  onChange={e => setProductName(e.target.value)}
                  placeholder="e.g. EN-24 Alloy Steel Round Bars (50mm)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:outline-hidden focus:border-[#0F2942]"
                />
              </div>

              {/* Category & MSME Supplier */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Category</label>
                  <select
                    value={productCategory}
                    onChange={e => setProductCategory(e.target.value)}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-md bg-white text-xs"
                  >
                    <option value="Raw Material">Raw Material</option>
                    <option value="Finished Goods">Finished Goods</option>
                    <option value="Spare Parts">Spare Parts</option>
                    <option value="Packaging">Packaging</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Owning MSME</label>
                  <select
                    value={businessId}
                    onChange={e => setBusinessId(e.target.value)}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-md bg-white text-xs"
                  >
                    {businesses.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.business_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quantity & Min Stock */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Available Qty <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={availableQuantity}
                    onChange={e => setAvailableQuantity(e.target.value)}
                    placeholder="e.g. 50"
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-md font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Min Safe Stock <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={minStockLevel}
                    onChange={e => setMinStockLevel(e.target.value)}
                    placeholder="e.g. 20"
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-md font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Unit of Measure</label>
                  <input
                    type="text"
                    value={unitOfMeasure}
                    onChange={e => setUnitOfMeasure(e.target.value)}
                    placeholder="Units, Kg, Meters"
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-md text-xs"
                  />
                </div>
              </div>

              {/* Unit Price & Supplier */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Unit Price (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    min="0"
                    value={unitPrice}
                    onChange={e => setUnitPrice(e.target.value)}
                    placeholder="e.g. 1850"
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-md font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Supplier / Source <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={supplierName}
                    onChange={e => setSupplierName(e.target.value)}
                    placeholder="e.g. Kalyani Steels Ltd / In-House"
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-md text-xs"
                  />
                </div>
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
                  {isSubmitting ? 'Saving...' : editingItem ? 'Update Stock' : 'Add to Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
