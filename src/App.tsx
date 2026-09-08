/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { RawMaterial, POStatus } from './types/inventory';
import { INITIAL_MATERIALS } from './data/initialMaterials';
import {
  calculateMetrics,
  calculateStatus,
  calculateDeficit,
  calculateDaysOfInventory,
} from './utils/calculations';
import { Header } from './components/Header';
import { KPISummary } from './components/KPISummary';
import { ShortageTable } from './components/ShortageTable';
import { QuickStockModal } from './components/QuickStockModal';
import { PoTrackingModal } from './components/PoTrackingModal';
import { AddEditMaterialModal } from './components/AddEditMaterialModal';
import { BroadcastModal } from './components/BroadcastModal';
import { RunOutSimulator } from './components/RunOutSimulator';
import { SupplierDeliveryTracker } from './components/SupplierDeliveryTracker';
import { AnalyticsView } from './components/AnalyticsView';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

const STORAGE_KEY = 'shortage_bahan_baku_data_v1';

export default function App() {
  // State: Raw Materials
  const [materials, setMaterials] = useState<RawMaterial[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (err) {
      console.error('Failed to load materials from localStorage', err);
    }
    return INITIAL_MATERIALS;
  });

  // Active Tab
  const [currentTab, setCurrentTab] = useState<'matrix' | 'runout' | 'inbound' | 'analytics'>('matrix');

  // Filter Status
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'KRITIS' | 'WARNING' | 'IN_TRANSIT' | 'AMAN'>('ALL');

  // Modal States
  const [isAddEditOpen, setIsAddEditOpen] = useState<boolean>(false);
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);
  const [quickStockMaterial, setQuickStockMaterial] = useState<RawMaterial | null>(null);
  const [poTrackingMaterial, setPoTrackingMaterial] = useState<RawMaterial | null>(null);
  const [isBroadcastOpen, setIsBroadcastOpen] = useState<boolean>(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(materials));
    } catch (err) {
      console.error('Failed to save to localStorage', err);
    }
  }, [materials]);

  // Overall Metrics
  const metrics = calculateMetrics(materials);

  // Handlers
  const handleQuickStockSave = (materialId: string, newStock: number, note: string) => {
    setMaterials((prev) =>
      prev.map((m) => {
        if (m.id === materialId) {
          return {
            ...m,
            currentStock: newStock,
            notes: note,
            lastUpdated: new Date().toLocaleString('id-ID'),
          };
        }
        return m;
      })
    );
    showToast(`Stok bahan berhasil diperbarui menjadi ${newStock}`);
  };

  const handlePOSave = (
    materialId: string,
    poStatus: POStatus,
    poNumber?: string,
    poQuantity?: number,
    etaDate?: string,
    notes?: string,
    receiveIntoStock?: boolean
  ) => {
    setMaterials((prev) =>
      prev.map((m) => {
        if (m.id === materialId) {
          const updatedStock =
            receiveIntoStock && poQuantity ? m.currentStock + poQuantity : m.currentStock;
          return {
            ...m,
            currentStock: updatedStock,
            poStatus,
            poNumber,
            poQuantity,
            etaDate,
            notes: notes || m.notes,
            lastUpdated: new Date().toLocaleString('id-ID'),
          };
        }
        return m;
      })
    );
    showToast(
      receiveIntoStock
        ? `PO diterima dan stok fisik otomatis bertambah!`
        : `Status PO berhasil diperbarui.`
    );
  };

  const handleAddEditSave = (
    data: Omit<RawMaterial, 'id' | 'lastUpdated'>,
    editingId?: string
  ) => {
    if (editingId) {
      setMaterials((prev) =>
        prev.map((m) => {
          if (m.id === editingId) {
            return {
              ...m,
              ...data,
              lastUpdated: new Date().toLocaleString('id-ID'),
            };
          }
          return m;
        })
      );
      showToast(`Data bahan "${data.name}" berhasil diperbarui.`);
    } else {
      const newMat: RawMaterial = {
        ...data,
        id: `mat-${Date.now()}`,
        lastUpdated: new Date().toLocaleString('id-ID'),
      };
      setMaterials((prev) => [newMat, ...prev]);
      showToast(`Bahan baku "${data.name}" berhasil ditambahkan ke matriks!`);
    }
  };

  const handleUpdateInlineMaterial = (updatedMaterial: RawMaterial) => {
    setMaterials((prev) =>
      prev.map((m) =>
        m.id === updatedMaterial.id
          ? {
              ...updatedMaterial,
              lastUpdated: new Date().toLocaleString('id-ID'),
            }
          : m
      )
    );
    showToast(`Bahan baku "${updatedMaterial.name}" berhasil disimpan!`);
  };

  const handleDeleteMaterial = (id: string) => {
    const item = materials.find((m) => m.id === id);
    if (!item) return;
    setMaterials((prev) => prev.filter((m) => m.id !== id));
    showToast(`Bahan baku "${item.name}" berhasil dihapus dari matriks.`, 'info');
  };

  const handleResetData = () => {
    if (
      window.confirm(
        'Kembalikan seluruh daftar bahan baku ke data awal contoh pabrik (Reset)? Data perubahan saat ini akan ditimpa.'
      )
    ) {
      setMaterials(INITIAL_MATERIALS);
      showToast('Data inventori berhasil direset ke standar pabrik.');
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'ID Bahan',
      'Nama Bahan Baku',
      'Kategori',
      'Satuan',
      'Stok Fisik',
      'Safety Stock',
      'Konsumsi Harian',
      'Kebutuhan SPK',
      'Defisit',
      'Sisa Hari (Run-Out)',
      'Status Shortage',
      'Supplier',
      'Kontak PIC',
      'Lead Time (Hari)',
      'Lokasi Rak',
      'Line Terdampak',
      'Status PO',
      'Nomor PO',
      'Qty PO',
      'Estimasi Tiba (ETA)',
      'Catatan',
    ];

    const rows = materials.map((m) => {
      const status = calculateStatus(m);
      const def = calculateDeficit(m);
      const doi = calculateDaysOfInventory(m.currentStock, m.dailyRequirement);
      return [
        `"${m.id}"`,
        `"${m.name.replace(/"/g, '""')}"`,
        `"${m.category}"`,
        `"${m.unit}"`,
        m.currentStock,
        m.safetyStock,
        m.dailyRequirement,
        m.allocatedProduction,
        def,
        doi,
        `"${status}"`,
        `"${m.supplier.replace(/"/g, '""')}"`,
        `"${(m.supplierContact || '').replace(/"/g, '""')}"`,
        m.leadTimeDays,
        `"${m.storageLocation.replace(/"/g, '""')}"`,
        `"${m.affectedLines.join('; ')}"`,
        `"${m.poStatus}"`,
        `"${m.poNumber || ''}"`,
        m.poQuantity || 0,
        `"${m.etaDate || ''}"`,
        `"${(m.notes || '').replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const dateTag = new Date().toISOString().slice(0, 10);
    link.setAttribute('download', `Laporan_Shortage_Bahan_Baku_${dateTag}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Laporan CSV berhasil diunduh!');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-amber-100 selection:text-amber-900">
      {/* Navigation Header */}
      <Header
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onOpenAddModal={() => {
          setEditingMaterial(null);
          setIsAddEditOpen(true);
        }}
        onOpenBroadcast={() => setIsBroadcastOpen(true)}
        onExportCSV={handleExportCSV}
        onResetData={handleResetData}
        criticalCount={metrics.criticalCount}
        totalItems={metrics.totalItems}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* KPI Executive Summary */}
        <KPISummary
          metrics={metrics}
          onFilterStatus={(status) => {
            setFilterStatus(status);
            setCurrentTab('matrix');
          }}
          activeFilter={filterStatus}
        />

        {/* Tab Content */}
        {currentTab === 'matrix' && (
          <ShortageTable
            materials={materials}
            onOpenQuickStock={(mat) => setQuickStockMaterial(mat)}
            onOpenPOTracking={(mat) => setPoTrackingMaterial(mat)}
            onEditMaterial={(mat) => {
              setEditingMaterial(mat);
              setIsAddEditOpen(true);
            }}
            onDeleteMaterial={handleDeleteMaterial}
            onSaveInlineMaterial={handleUpdateInlineMaterial}
            onOpenAddModal={() => {
              setEditingMaterial(null);
              setIsAddEditOpen(true);
            }}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
          />
        )}

        {currentTab === 'runout' && (
          <RunOutSimulator
            materials={materials}
            onOpenPOTracking={(mat) => setPoTrackingMaterial(mat)}
            onOpenQuickStock={(mat) => setQuickStockMaterial(mat)}
          />
        )}

        {currentTab === 'inbound' && (
          <SupplierDeliveryTracker
            materials={materials}
            onOpenPOTracking={(mat) => setPoTrackingMaterial(mat)}
            onOpenQuickStock={(mat) => setQuickStockMaterial(mat)}
          />
        )}

        {currentTab === 'analytics' && (
          <AnalyticsView materials={materials} />
        )}
      </main>

      {/* Toast Notification Notification Pill */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg border border-slate-700 text-xs font-medium animate-bounce">
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : toastMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-sky-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            &copy; 2026 <strong>Sistem Shortage Bahan Baku</strong> &bull; Raw Material Inventory & PPIC Control Tower
          </p>
          <div className="flex items-center gap-3 text-slate-400">
            <span>Gudang Aktif &bull; JCI Warehouse Division</span>
            <span>&bull;</span>
            <button
              onClick={() => {
                setEditingMaterial(null);
                setIsAddEditOpen(true);
              }}
              className="text-slate-700 hover:text-slate-900 font-medium underline"
            >
              + Input Manual
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <QuickStockModal
        material={quickStockMaterial}
        onClose={() => setQuickStockMaterial(null)}
        onSave={handleQuickStockSave}
      />

      <PoTrackingModal
        material={poTrackingMaterial}
        onClose={() => setPoTrackingMaterial(null)}
        onSavePO={handlePOSave}
      />

      <AddEditMaterialModal
        material={editingMaterial}
        isOpen={isAddEditOpen}
        onClose={() => {
          setIsAddEditOpen(false);
          setEditingMaterial(null);
        }}
        onSave={handleAddEditSave}
        onDelete={handleDeleteMaterial}
      />

      <BroadcastModal
        isOpen={isBroadcastOpen}
        onClose={() => setIsBroadcastOpen(false)}
        materials={materials}
      />
    </div>
  );
}
