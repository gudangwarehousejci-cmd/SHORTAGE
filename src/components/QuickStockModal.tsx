import React, { useState } from 'react';
import { RawMaterial } from '../types/inventory';
import { formatNumber } from '../utils/calculations';
import { X, ArrowDownRight, ArrowUpRight, Check, AlertCircle } from 'lucide-react';

interface QuickStockModalProps {
  material: RawMaterial | null;
  onClose: () => void;
  onSave: (materialId: string, newStock: number, note: string) => void;
}

export const QuickStockModal: React.FC<QuickStockModalProps> = ({
  material,
  onClose,
  onSave,
}) => {
  if (!material) return null;

  const [mode, setMode] = useState<'add' | 'subtract' | 'set'>('add');
  const [qty, setQty] = useState<number>(0);
  const [reason, setReason] = useState<string>('');

  const currentStock = material.currentStock;
  let finalStock = currentStock;

  if (mode === 'add') {
    finalStock = currentStock + (qty || 0);
  } else if (mode === 'subtract') {
    finalStock = Math.max(0, currentStock - (qty || 0));
  } else {
    finalStock = qty >= 0 ? qty : 0;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode !== 'set' && (!qty || qty <= 0)) {
      alert('Masukkan jumlah kuantitas valid!');
      return;
    }
    const noteText =
      reason.trim() !== ''
        ? reason
        : mode === 'add'
        ? `Penerimaan barang masuk +${qty} ${material.unit}`
        : mode === 'subtract'
        ? `Pemakaian produksi -${qty} ${material.unit}`
        : `Penyesuaian stok fisik (Stock Opname) ke ${qty} ${material.unit}`;

    onSave(material.id, finalStock, noteText);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Update Stok Fisik Cepat
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              <span className="font-semibold text-slate-700">{material.name}</span> &bull; {material.category}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Stock Banner */}
        <div className="px-5 py-3 bg-slate-100/70 border-b border-slate-200/60 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500">Stok Saat Ini:</span>
            <div className="text-base font-bold text-slate-900">
              {formatNumber(currentStock)} <span className="text-xs font-normal text-slate-600">{material.unit}</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-slate-500">Safety Stock:</span>
            <div className="text-sm font-semibold text-amber-700">
              {formatNumber(material.safetyStock)} {material.unit}
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Action Mode Toggle */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">
              Jenis Perubahan Stok:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setMode('add');
                  setQty(0);
                }}
                className={`py-2 px-2.5 rounded-lg border text-center font-medium flex flex-col items-center gap-1 transition cursor-pointer ${
                  mode === 'add'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-300'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <ArrowDownRight className="w-4 h-4 text-emerald-600" />
                <span>Barang Masuk (+)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('subtract');
                  setQty(0);
                }}
                className={`py-2 px-2.5 rounded-lg border text-center font-medium flex flex-col items-center gap-1 transition cursor-pointer ${
                  mode === 'subtract'
                    ? 'bg-rose-50 text-rose-800 border-rose-300 ring-1 ring-rose-300'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-rose-600" />
                <span>Barang Keluar (-)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('set');
                  setQty(currentStock);
                }}
                className={`py-2 px-2.5 rounded-lg border text-center font-medium flex flex-col items-center gap-1 transition cursor-pointer ${
                  mode === 'set'
                    ? 'bg-sky-50 text-sky-800 border-sky-300 ring-1 ring-sky-300'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Check className="w-4 h-4 text-sky-600" />
                <span>Stock Opname (=)</span>
              </button>
            </div>
          </div>

          {/* Qty Input */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              {mode === 'add'
                ? 'Jumlah Masuk (Inbound)'
                : mode === 'subtract'
                ? 'Jumlah Pemakaian (Outbound)'
                : 'Jumlah Stok Fisik Baru (Opname)'}
              {' '}({material.unit}):
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={qty === 0 && mode !== 'set' ? '' : qty}
              onChange={(e) => setQty(parseFloat(e.target.value) || 0)}
              placeholder={`Masukkan jumlah dalam ${material.unit}`}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              autoFocus
              required
            />
          </div>

          {/* Reason / Reference */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Catatan / Nomor Referensi (Surat Jalan / SPK / PO):
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: SJ-2026-9041 PT Krakatau Steel / Pemakaian Shift 1 Line 2"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Forecast Result Preview */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
            <span className="text-slate-600">Hasil Stok Akhir:</span>
            <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span>{formatNumber(finalStock)} {material.unit}</span>
              {finalStock < material.safetyStock && (
                <span className="text-[10px] text-rose-600 font-normal flex items-center gap-0.5">
                  <AlertCircle className="w-3 h-3" /> Di bawah min stock
                </span>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
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
              Simpan Perubahan Stok
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
