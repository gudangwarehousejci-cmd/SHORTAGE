import React, { useState } from 'react';
import { RawMaterial } from '../types/inventory';
import { formatNumber } from '../utils/calculations';
import {
  Clock,
  TrendingUp,
  AlertOctagon,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Zap,
} from 'lucide-react';

interface RunOutSimulatorProps {
  materials: RawMaterial[];
  onOpenPOTracking: (material: RawMaterial) => void;
  onOpenQuickStock: (material: RawMaterial) => void;
}

export const RunOutSimulator: React.FC<RunOutSimulatorProps> = ({
  materials,
  onOpenPOTracking,
  onOpenQuickStock,
}) => {
  const [productionMultiplier, setProductionMultiplier] = useState<number>(1.0); // 1.0 = 100% normal
  const [targetFilter, setTargetFilter] = useState<'ALL' | 'DAY_1' | 'DAY_2_3' | 'WEEK_1'>('ALL');

  // Calculate dynamic days of inventory with multiplier
  const simulatedList = materials.map((m) => {
    const simulatedDaily = m.dailyRequirement * productionMultiplier;
    const daysLeft =
      simulatedDaily > 0 ? Number((m.currentStock / simulatedDaily).toFixed(1)) : 999;

    let bucket: 'DAY_1' | 'DAY_2_3' | 'WEEK_1' | 'SAFE';
    if (m.currentStock === 0 || daysLeft < 1) {
      bucket = 'DAY_1';
    } else if (daysLeft <= 3) {
      bucket = 'DAY_2_3';
    } else if (daysLeft <= 7) {
      bucket = 'WEEK_1';
    } else {
      bucket = 'SAFE';
    }

    return {
      ...m,
      simulatedDaily,
      daysLeft,
      bucket,
    };
  });

  const day1Items = simulatedList.filter((x) => x.bucket === 'DAY_1');
  const day23Items = simulatedList.filter((x) => x.bucket === 'DAY_2_3');
  const week1Items = simulatedList.filter((x) => x.bucket === 'WEEK_1');
  const safeItems = simulatedList.filter((x) => x.bucket === 'SAFE');

  const displayedItems = simulatedList
    .filter((x) => (targetFilter === 'ALL' ? true : x.bucket === targetFilter))
    .sort((a, b) => a.daysLeft - b.daysLeft);

  return (
    <div className="space-y-4">
      {/* Simulation Controls Card */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                <Zap className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900">
                Kalkulator Proyeksi Stock Run-Out (Sisa Waktu Ketersediaan)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Simulasikan seberapa cepat bahan baku habis jika target output pabrik / shift lembur ditingkatkan.
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 mr-1">Beban Produksi:</span>
            {[
              { label: 'Normal (100%)', mult: 1.0 },
              { label: '+20% Lembur', mult: 1.2 },
              { label: '+50% Peak Order', mult: 1.5 },
              { label: '+100% Double Shift', mult: 2.0 },
            ].map((preset) => (
              <button
                key={preset.mult}
                onClick={() => setProductionMultiplier(preset.mult)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  productionMultiplier === preset.mult
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Slider */}
        <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-3 w-full sm:w-80">
            <TrendingUp className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-xs text-slate-600 font-medium whitespace-nowrap">
              Kapasitas: {Math.round(productionMultiplier * 100)}%
            </span>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.1"
              value={productionMultiplier}
              onChange={(e) => setProductionMultiplier(parseFloat(e.target.value))}
              className="w-full accent-slate-900 cursor-pointer"
            />
          </div>
          <p className="text-[11px] text-slate-500">
            {productionMultiplier > 1.0
              ? `*Kebutuhan konsumsi harian dinaikkan sebesar ${Math.round((productionMultiplier - 1) * 100)}% dari standar normal.`
              : '*Kebutuhan konsumsi harian menggunakan standar normal pabrik.'}
          </p>
        </div>
      </div>

      {/* Bucket Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Bucket 1: Habis Hari Ini */}
        <div
          onClick={() => setTargetFilter(targetFilter === 'DAY_1' ? 'ALL' : 'DAY_1')}
          className={`bg-white rounded-xl p-4 border transition cursor-pointer ${
            targetFilter === 'DAY_1'
              ? 'border-rose-500 ring-2 ring-rose-200'
              : 'border-slate-200 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 uppercase">
              Habis &lt; 24 Jam
            </span>
            <div className="w-7 h-7 rounded-md bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-slate-900">
              {day1Items.length}
            </span>
            <span className="text-xs text-slate-500">Item Kritis</span>
          </div>
          <p className="text-[11px] text-rose-600 mt-1 font-medium">
            Stop-line hari ini jika tak ada kiriman
          </p>
        </div>

        {/* Bucket 2: Habis 2-3 Hari */}
        <div
          onClick={() => setTargetFilter(targetFilter === 'DAY_2_3' ? 'ALL' : 'DAY_2_3')}
          className={`bg-white rounded-xl p-4 border transition cursor-pointer ${
            targetFilter === 'DAY_2_3'
              ? 'border-amber-500 ring-2 ring-amber-200'
              : 'border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase">
              Habis Dalam 2 - 3 Hari
            </span>
            <div className="w-7 h-7 rounded-md bg-amber-100 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-slate-900">
              {day23Items.length}
            </span>
            <span className="text-xs text-slate-500">Item Peringatan</span>
          </div>
          <p className="text-[11px] text-amber-600 mt-1 font-medium">
            Segera terbitkan PO darurat / percepat vendor
          </p>
        </div>

        {/* Bucket 3: Habis 4-7 Hari */}
        <div
          onClick={() => setTargetFilter(targetFilter === 'WEEK_1' ? 'ALL' : 'WEEK_1')}
          className={`bg-white rounded-xl p-4 border transition cursor-pointer ${
            targetFilter === 'WEEK_1'
              ? 'border-sky-500 ring-2 ring-sky-200'
              : 'border-slate-200 hover:border-sky-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-700 uppercase">
              Habis Dalam 4 - 7 Hari
            </span>
            <div className="w-7 h-7 rounded-md bg-sky-100 text-sky-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-slate-900">
              {week1Items.length}
            </span>
            <span className="text-xs text-slate-500">Item Perhatian</span>
          </div>
          <p className="text-[11px] text-sky-600 mt-1 font-medium">
            Dalam batas lead time normal pemesanan
          </p>
        </div>

        {/* Bucket 4: Aman > 7 Hari */}
        <div
          onClick={() => setTargetFilter('ALL')}
          className="bg-white rounded-xl p-4 border border-slate-200 hover:border-emerald-300 transition cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase">
              Aman (&gt; 7 Hari)
            </span>
            <div className="w-7 h-7 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-slate-900">
              {safeItems.length}
            </span>
            <span className="text-xs text-slate-500">Item Aman</span>
          </div>
          <p className="text-[11px] text-emerald-600 mt-1 font-medium">
            Stok melimpah memenuhi target produksi
          </p>
        </div>
      </div>

      {/* Simulator Results Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            Daftar Urutan Kehabisan Bahan Baku (Run-Out Sequence)
          </h3>
          <span className="text-xs text-slate-500">
            {displayedItems.length} material ditampilkan
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/60 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-2.5 px-4">Urutan & Bahan</th>
                <th className="py-2.5 px-3">Stok Saat Ini</th>
                <th className="py-2.5 px-3">Konsumsi / Hari (Simulasi)</th>
                <th className="py-2.5 px-3">Sisa Waktu (Hari)</th>
                <th className="py-2.5 px-3">Lead Time Vendor</th>
                <th className="py-2.5 px-3">Status Inbound PO</th>
                <th className="py-2.5 px-4 text-right">Tindakan Mitigasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60">
              {displayedItems.map((item, index) => {
                const isRunOutDanger = item.daysLeft < item.leadTimeDays;
                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50 transition-colors ${
                      item.bucket === 'DAY_1'
                        ? 'bg-rose-50/30'
                        : item.bucket === 'DAY_2_3'
                        ? 'bg-amber-50/20'
                        : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center font-mono font-bold text-[10px] ${
                          index < 3 ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-900">{item.name}</p>
                          <span className="text-[10px] text-slate-500">
                            {item.category} &bull; {item.supplier}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-800">
                        {formatNumber(item.currentStock)} {item.unit}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="font-medium text-slate-700">
                        {formatNumber(Math.round(item.simulatedDaily))} {item.unit}/hari
                      </span>
                      {productionMultiplier !== 1.0 && (
                        <span className="text-[10px] text-slate-400 block">
                          (Standar: {item.dailyRequirement})
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <div className="space-y-0.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                            item.daysLeft <= 0
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : item.daysLeft < 1
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : item.daysLeft <= 3
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : item.daysLeft <= 7
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          {item.daysLeft <= 0 ? 'Habis (0 Hari)' : `${item.daysLeft} Hari`}
                        </span>
                        {isRunOutDanger && (
                          <p className="text-[10px] text-rose-600 font-medium">
                            ⚠️ Habis sebelum lead time ({item.leadTimeDays} hari)!
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-slate-600">
                      {item.leadTimeDays} Hari Kerja
                    </td>

                    <td className="py-3 px-3">
                      {item.poStatus === 'IN_TRANSIT' ? (
                        <span className="text-[10px] bg-sky-50 text-sky-700 px-2 py-0.5 rounded border border-sky-200 font-medium">
                          In-Transit (ETA {item.etaDate || 'Segera'})
                        </span>
                      ) : item.poNumber ? (
                        <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          {item.poNumber}
                        </span>
                      ) : (
                        <span className="text-[10px] text-rose-600 font-medium">
                          Belum Ada PO Terbit!
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onOpenPOTracking(item)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded border border-sky-200 transition cursor-pointer"
                        >
                          Cek PO
                        </button>
                        <button
                          onClick={() => onOpenQuickStock(item)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition cursor-pointer"
                        >
                          Stok
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
