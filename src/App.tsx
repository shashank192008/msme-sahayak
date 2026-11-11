/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar, TabType } from './components/Sidebar';
import { DatabaseStatusModal } from './components/DatabaseStatusModal';
import { DashboardView } from './pages/DashboardView';
import { InvoicesView } from './pages/InvoicesView';
import { FollowUpAssistantView } from './pages/FollowUpAssistantView';
import { BusinessesView } from './pages/BusinessesView';
import { InventoryView } from './pages/InventoryView';
import { SchemesView } from './pages/SchemesView';
import { InsightsImpactView } from './pages/InsightsImpactView';
import { DbmsPracticeView } from './pages/DbmsPracticeView';

import {
  Business,
  Invoice,
  InventoryItem,
  Scheme,
  SupportResource,
  DashboardStats,
  DbStatusInfo,
} from './types';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [dbStatus, setDbStatus] = useState<DbStatusInfo | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [supportResources, setSupportResources] = useState<SupportResource[]>([]);

  // Modals & Navigation state
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const [isNewInvoiceModalOpen, setIsNewInvoiceModalOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [selectedInvoiceForFollowUp, setSelectedInvoiceForFollowUp] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [healthRes, statsRes, busRes, invRes, stockRes, schemesRes, supportRes] =
        await Promise.all([
          api.getHealth(),
          api.getDashboardStats(),
          api.getBusinesses(),
          api.getInvoices(),
          api.getInventory(),
          api.getSchemes(),
          api.getSupportResources(),
        ]);

      setDbStatus(healthRes.database);
      setDashboardStats(statsRes.data);
      setBusinesses(busRes.data);
      setInvoices(invRes.data);
      setInventory(stockRes.data);
      setSchemes(schemesRes.data);
      setSupportResources(supportRes.data);
    } catch (err) {
      console.error('Error fetching initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const overdueInvoices = invoices.filter(i => i.payment_status === 'OVERDUE');
  const lowStockCount = inventory.filter(i => i.is_low_stock).length;

  const handleSelectInvoiceForFollowUp = (invoice: Invoice) => {
    setSelectedInvoiceForFollowUp(invoice);
    setActiveTab('followup');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col text-[#0B1C30]">
      {/* Global Header */}
      <Header
        dbStatus={dbStatus}
        onOpenDbModal={() => setIsDbModalOpen(true)}
        onOpenNewInvoiceModal={() => setIsNewInvoiceModalOpen(true)}
        overdueCount={overdueInvoices.length}
        onToggleMobileNav={() => setIsMobileNavOpen(!isMobileNavOpen)}
      />

      {/* Main Layout Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={tab => {
            setActiveTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          overdueCount={overdueInvoices.length}
          lowStockCount={lowStockCount}
          isMobileOpen={isMobileNavOpen}
          onCloseMobile={() => setIsMobileNavOpen(false)}
        />

        {/* Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          {loading ? (
            <div className="py-20 text-center text-slate-500">
              <div className="animate-spin w-8 h-8 border-2 border-[#0D9488] border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-sm font-medium">Connecting to MSME Sahayak Database...</p>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView
                  stats={dashboardStats}
                  overdueInvoices={overdueInvoices}
                  onNavigateTab={tab => setActiveTab(tab)}
                  onSelectInvoiceForFollowUp={handleSelectInvoiceForFollowUp}
                />
              )}

              {activeTab === 'invoices' && (
                <InvoicesView
                  invoices={invoices}
                  businesses={businesses}
                  onRefresh={loadAllData}
                  onSelectForFollowUp={handleSelectInvoiceForFollowUp}
                  isCreateModalOpen={isNewInvoiceModalOpen}
                  onCloseCreateModal={() => setIsNewInvoiceModalOpen(false)}
                  onOpenCreateModal={() => setIsNewInvoiceModalOpen(true)}
                />
              )}

              {activeTab === 'followup' && (
                <FollowUpAssistantView
                  invoices={invoices}
                  selectedInvoice={selectedInvoiceForFollowUp}
                  onSelectInvoice={inv => setSelectedInvoiceForFollowUp(inv)}
                />
              )}

              {activeTab === 'businesses' && (
                <BusinessesView
                  businesses={businesses}
                  onRefresh={loadAllData}
                />
              )}

              {activeTab === 'inventory' && (
                <InventoryView
                  inventory={inventory}
                  businesses={businesses}
                  onRefresh={loadAllData}
                />
              )}

              {activeTab === 'schemes' && (
                <SchemesView
                  schemes={schemes}
                  supportResources={supportResources}
                />
              )}

              {activeTab === 'insights' && (
                <InsightsImpactView stats={dashboardStats} />
              )}

              {activeTab === 'dbms' && <DbmsPracticeView />}
            </>
          )}
        </main>
      </div>

      {/* Database Status & Import Guide Modal */}
      <DatabaseStatusModal
        isOpen={isDbModalOpen}
        onClose={() => setIsDbModalOpen(false)}
        status={dbStatus}
        onRefresh={loadAllData}
      />
    </div>
  );
}
