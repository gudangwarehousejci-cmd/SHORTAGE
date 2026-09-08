import React, { useState } from 'react';
import { RawMaterial } from '../types/inventory';
import { formatNumber, getPOStatusBadge } from '../utils/calculations';
import {
  Truck,
  Calendar,
  Clock,
  Phone,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Search,
  ExternalLink,
} from 'lucide-react';

interface SupplierDeliveryTrackerProps {
  materials: RawMaterial[];
  onOpenPOTracking: (material: RawMaterial) => void;
  onOpenQuickStock: (material: RawMaterial) => void;
}

export const SupplierDeliveryTracker: React.FC<SupplierDeliveryTrackerProps> = ({
  materials,
  onOpenPOTracking,
  onOpenQuickStock,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter only items that have an active PO or are awaiting delivery
  const poItems = materials.filter(
    (m) => m.poStatus !== 'NONE' || m.poNumber || m.etaDate
  );

  const filteredPoItems = poItems.filter((m) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      m.supplier.toLowerCase().includes(q) ||
      (m.poNumber && m.poNumber.toLowerCase().includes(q))
    );
  });

  const inTransitList = filteredPoItems.filter((m) => m.poStatus === 'IN_TRANSIT');
  const delayedList = filteredPoItems.filter((m) => m.poStatus === 'DELAYED');
  const pendingSentList = filteredPoItems.filter(
    (m) => m.poStatus === 'PO_SENT' || m.poStatus === 'DRAFT' || m.poStatus === 'PARTIAL_RECEIVED'
  );

  return (
    <div className="space-y-4">
      {/* Top Delivery Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-4 border border-slate-200 flex items-center gap-3">
          <div className="p-3 rounded-lg bg-sky-50 text-sky-600">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Dalam Pengiriman (In-Transit)</span>
            <div className="text-xl font-bold text-slate-900">{inTransitList.length} PO</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 flex items-center gap-3">
          <div className="p-3 rounded-lg bg-rose-50 text-rose-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Pengiriman Terlambat (Delayed)</span>
            <div className="text-xl font-bold text-rose-700">{delayedList.length} PO</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 flex items-center gap-3">
          <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">PO Terbit / Menunggu Kirim</span>
            <div className="text-xl font-bold text-slate-900">{pendingSentList.length} PO</div>
          </div>
        </div>
      </div>

      {/* Main Delivery Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Truck className="w-4 h-4 text-sky-600" />
              Tracking Jadwal Kedatangan Supplier (Inbound Schedule)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Pantau armada logistik supplier, nomor kontak sopir/PIC, dan jadwal tiba di gudang.
            </p>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari PO, vendor, bahan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/60 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">No. PO & Tanggal Terbit</th>
                <th className="py-3 px-3">Bahan Baku</th>
                <th className="py-3 px-3">Supplier & Kontak</th>
                <th className="py-3 px-3">Kuantitas Pesanan</th>
                <th className="py-3 px-3">Status Pengiriman</th>
                <th className="py-3 px-3">Estimasi Kedatangan (ETA)</th>
                <th className="py-3 px-3">Catatan / Status Muatan</th>
                <th className="py-3 px-4 text-right">Aksi Gudang</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60">
              {filteredPoItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Tidak ada data pemesanan PO aktif saat ini.
                  </td>
                </tr>
              ) : (
                filteredPoItems.map((item) => {
                  const poBadge = getPOStatusBadge(item.poStatus);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono">
                        <span className="font-bold text-slate-800 text-xs">
                          {item.poNumber || 'DRAFT-PO'}
                        </span>
                        <p className="text-[10px] text-slate-400 font-sans">
                          Lead Time: {item.leadTimeDays} hari
                        </p>
                      </td>

                      <td className="py-3 px-3">
                        <p className="font-semibold text-slate-900 leading-snug">{item.name}</p>
                        <span className="text-[10px] text-slate-500">{item.category}</span>
                      </td>

                      <td className="py-3 px-3">
                        <p className="font-medium text-slate-800">{item.supplier}</p>
                        {item.supplierContact && (
                          <span className="text-[10px] text-sky-700 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" />
                            {item.supplierContact}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900">
                          {formatNumber(item.poQuantity || 0)} {item.unit}
                        </span>
                        <p className="text-[10px] text-slate-400">
                          Stok Gudang: {formatNumber(item.currentStock)} {item.unit}
                        </p>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${poBadge.color}`}
                        >
                          {poBadge.label}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        {item.etaDate ? (
                          <div className="flex items-center gap-1 font-semibold text-slate-800">
                            <Calendar className="w-3.5 h-3.5 text-sky-600" />
                            <span>{item.etaDate}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Belum dijadwalkan</span>
                        )}
                      </td>

                      <td className="py-3 px-3 max-w-[200px]">
                        <p className="text-[11px] text-slate-600 truncate" title={item.notes}>
                          {item.notes || '-'}
                        </p>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenPOTracking(item)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded border border-sky-200 transition cursor-pointer"
                          >
                            Update PO
                          </button>
                          <button
                            onClick={() => onOpenQuickStock(item)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition cursor-pointer"
                            title="Terima Barang Masuk ke Gudang"
                          >
                            Terima Barang
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
