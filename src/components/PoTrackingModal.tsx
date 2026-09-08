import React, { useState } from 'react';
import { RawMaterial, POStatus } from '../types/inventory';
import { formatNumber } from '../utils/calculations';
import { X, Truck, Calendar, FileText, CheckCircle } from 'lucide-react';

interface PoTrackingModalProps {
  material: RawMaterial | null;
  onClose: () => void;
  onSavePO: (
    materialId: string,
    poStatus: POStatus,
    poNumber?: string,
    poQuantity?: number,
    etaDate?: string,
    notes?: string,
    receiveIntoStock?: boolean
  ) => void;
}

export const PoTrackingModal: React.FC<PoTrackingModalProps> = ({
  material,
  onClose,
  onSavePO,
}) => {
  if (!material) return null;

  const [poStatus, setPoStatus] = useState<POStatus>(material.poStatus || 'NONE');
  const [poNumber, setPoNumber] = useState<string>(material.poNumber || '');
  const [poQuantity, setPoQuantity] = useState<number>(material.poQuantity || 0);
  const [etaDate, setEtaDate] = useState<string>(material.etaDate || '');
  const [notes, setNotes] = useState<string>(material.notes || '');
  const [receiveIntoStock, setReceiveIntoStock] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSavePO(
      material.id,
      poStatus,
      poNumber.trim() || undefined,
      poQuantity > 0 ? poQuantity : undefined,
      etaDate || undefined,
      notes.trim() || undefined,
      receiveIntoStock && poStatus === 'RECEIVED'
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-sky-100 text-sky-700">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Update Status PO & Kedatangan Supplier
              </h3>
              <p className="text-xs text-slate-500">
                <span className="font-semibold text-slate-700">{material.name}</span> &bull; {material.category}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Vendor info strip */}
        <div className="px-5 py-2.5 bg-sky-50/50 border-b border-sky-100 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500">Supplier: </span>
            <span className="font-semibold text-slate-900">{material.supplier}</span>
          </div>
          <div className="text-slate-500">
            Lead Time: <span className="font-semibold text-slate-800">{material.leadTimeDays} Hari</span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Status PO Selector */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Status Pemesanan (PO Status):
            </label>
            <select
              value={poStatus}
              onChange={(e) => {
                const val = e.target.value as POStatus;
                setPoStatus(val);
                if (val === 'RECEIVED') {
                  setReceiveIntoStock(true);
                }
              }}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              <option value="NONE">Belum Ada PO (Need to Reorder)</option>
              <option value="DRAFT">Draft PO (Dalam Pengajuan PR/PO Internal)</option>
              <option value="PO_SENT">PO Terbit & Terkirim ke Supplier</option>
              <option value="IN_TRANSIT">Sedang Dikirim / Dalam Perjalanan (In-Transit)</option>
              <option value="PARTIAL_RECEIVED">Tiba Sebagian (Parsial Masuk Gudang)</option>
              <option value="DELAYED">Terlambat (Vendor Mengalami Kendala / Delay)</option>
              <option value="RECEIVED">Selesai Tiba (Full Received di Gudang)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Nomor PO */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Nomor PO / Surat Pemesanan:
              </label>
              <input
                type="text"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                placeholder="Contoh: PO-2026-0912"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono text-xs"
              />
            </div>

            {/* Qty PO */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Kuantitas Dipesan ({material.unit}):
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={poQuantity || ''}
                onChange={(e) => setPoQuantity(parseFloat(e.target.value) || 0)}
                placeholder={`Jumlah ${material.unit}`}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-xs"
              />
            </div>
          </div>

          {/* Tanggal Estimasi Kedatangan (ETA) */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Estimasi Tanggal Tiba di Gudang (ETA):
            </label>
            <input
              type="date"
              value={etaDate}
              onChange={(e) => setEtaDate(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-xs"
            />
          </div>

          {/* Catatan / Update Ekspedisi */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Catatan & Solusi Mitigasi Gudang/Vendor:
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Truk fuso sedang menuju gate gudang. Kontak driver: Pak Joko (0812-xxx). Diutamakan bongkar pertama."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 text-xs placeholder:text-slate-400"
            />
          </div>

          {/* Auto Receive Checkbox if status is RECEIVED */}
          {poStatus === 'RECEIVED' && poQuantity > 0 && (
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 flex items-start gap-2.5">
              <input
                type="checkbox"
                id="check-receive-stock"
                checked={receiveIntoStock}
                onChange={(e) => setReceiveIntoStock(e.target.checked)}
                className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <label htmlFor="check-receive-stock" className="text-emerald-800 text-xs cursor-pointer">
                <strong>Otomatis tambahkan kuantitas PO ({formatNumber(poQuantity)} {material.unit})</strong> langsung ke Stok Fisik Gudang.
              </label>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition cursor-pointer"
            >
              Simpan Status PO
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
